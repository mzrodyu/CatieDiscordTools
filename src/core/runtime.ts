// Runtime orchestration.
//
// Owns the plugin registry, persisted enable-state, and the start/stop
// lifecycle. Source patches are registered before Discord's modules load;
// runtime lifecycle hooks fire once the client is alive. A plugin that throws
// on start is isolated and switched off rather than allowed to take the client
// (or its neighbours) down with it.

import { logger } from "./logger";
import {
  awaitCoreReady,
  installChunkInterceptor,
  isReady,
  registerSourcePatch,
  setSelfResolver
} from "./modules/webpack";
import { loadNamespace, saveNamespace } from "./settings/storage";
import type { Plugin } from "./plugin";

const log = logger("runtime");

const ENABLED_NS = "core.enabled";

export type PluginState = "disabled" | "starting" | "running" | "stopping" | "errored";

export interface PluginView {
  id: string;
  name: string;
  description: string;
  category: Plugin["category"];
  authors: Plugin["authors"];
  required: boolean;
  hidden: boolean;
  enabled: boolean;
  state: PluginState;
  error?: unknown;
  hasSettings: boolean;
  hasPage: boolean;
  needsRestart: boolean;
}

interface Record_ {
  plugin: Plugin;
  state: PluginState;
  error?: unknown;
}

class Runtime {
  private records = new Map<string, Record_>();
  private enabledMap: Record<string, boolean> = {};
  private bootPatched = new Set<string>();
  private listeners = new Set<() => void>();
  private prepared = false;
  private booted = false;

  register(plugin: Plugin): void {
    if (this.records.has(plugin.id)) {
      log.warn(`duplicate plugin id "${plugin.id}" ignored`);
      return;
    }
    this.records.set(plugin.id, { plugin, state: "disabled" });
    // Bind persistence immediately so the settings UI reflects saved values
    // even for plugins that are currently switched off.
    plugin.settings?.__bind(plugin.id);
  }

  registerAll(plugins: Plugin[]): void {
    for (const p of plugins) this.register(p);
  }

  /**
   * Synchronous, storage-independent preparation. Wires up `$self` resolution,
   * registers source patches for everything that will run, and takes over
   * Webpack — all of which must be in place before Discord pushes its first
   * chunk, or a module can be cached in its unpatched form.
   *
   * The extension entry calls this ahead of its async storage handshake for
   * exactly that reason; the desktop entry reaches it synchronously through
   * boot(). Idempotent either way.
   */
  prepare(): void {
    if (this.prepared) return;
    this.prepared = true;

    setSelfResolver((id) => this.records.get(id)?.plugin);
    // Best-effort read: in the extension the storage mirror may not have
    // hydrated yet, which only leaves optional plugins looking disabled.
    // Required plugins (the settings host among them) resolve correctly
    // regardless, so their patches register here — before modules load.
    this.enabledMap = (loadNamespace(ENABLED_NS) as Record<string, boolean>) ?? {};
    this.registerBootPatches();

    installChunkInterceptor();
  }

  /** Boot sequence. Call once, as early as the renderer allows. */
  async boot(): Promise<void> {
    if (this.booted) return;
    this.booted = true;

    // Interceptor + patches must be in place before modules load. This is
    // effectively immediate on desktop; the extension runs it even earlier,
    // before its storage handshake. Idempotent, so calling it again is safe.
    this.prepare();

    // Storage is authoritative now (the extension's mirror has hydrated), so
    // re-read enable-state and pick up patches for any plugin that turned out
    // to be enabled but wasn't known when prepare() ran.
    this.enabledMap = (loadNamespace(ENABLED_NS) as Record<string, boolean>) ?? {};
    this.registerBootPatches();

    await awaitCoreReady();

    for (const id of this.startOrder()) {
      if (this.shouldRun(id)) this.startPlugin(id);
    }

    this.emit();
    const build = typeof HALCYON_BUILD !== "undefined" ? HALCYON_BUILD : "dev";
    log.info(`runtime up — ${this.runningCount()} plugin(s) active (build ${build})`);
  }

  isEnabled(id: string): boolean {
    const rec = this.records.get(id);
    if (!rec) return false;
    if (rec.plugin.required) return true;
    return this.enabledMap[id] === true;
  }

  enable(id: string): void {
    const rec = this.records.get(id);
    if (!rec) return;

    for (const dep of rec.plugin.dependencies ?? []) {
      if (!this.isEnabled(dep)) this.enable(dep);
    }

    this.enabledMap[id] = true;
    this.persistEnabledState();

    if (this.booted && isReady()) this.startPlugin(id);
    this.emit();
  }

  disable(id: string): void {
    const rec = this.records.get(id);
    if (!rec) return;
    if (rec.plugin.required) {
      log.warn(`"${id}" is required and cannot be disabled`);
      return;
    }

    // Cascade to anything depending on this plugin.
    for (const [otherId, other] of this.records) {
      if (other.plugin.dependencies?.includes(id) && this.isEnabled(otherId)) {
        this.disable(otherId);
      }
    }

    this.enabledMap[id] = false;
    this.persistEnabledState();
    this.stopPlugin(id);
    this.emit();
  }

  toggle(id: string): boolean {
    if (this.isEnabled(id)) {
      this.disable(id);
      return false;
    }
    this.enable(id);
    return true;
  }

  /**
   * Whether a restart is needed for a plugin's source patches to match its
   * current enable-state. Source patches only apply at module load, so toggling
   * a patch-bearing plugin after boot cannot take full effect until relaunch.
   */
  needsRestart(id: string): boolean {
    const rec = this.records.get(id);
    if (!rec?.plugin.patches?.length) return false;
    return this.isEnabled(id) !== this.bootPatched.has(id);
  }

  getPlugin(id: string): Plugin | undefined {
    return this.records.get(id)?.plugin;
  }

  list(): PluginView[] {
    return [...this.records.values()].map(({ plugin, state, error }) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      authors: plugin.authors,
      required: plugin.required ?? false,
      hidden: plugin.hidden ?? false,
      enabled: this.isEnabled(plugin.id),
      state,
      error,
      hasSettings: plugin.settings != null,
      hasPage: plugin.page != null,
      needsRestart: this.needsRestart(plugin.id)
    }));
  }

  /** Subscribe to any registry change (enable/disable/state). */
  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // --- internals -----------------------------------------------------------

  private shouldRun(id: string): boolean {
    if (!this.isEnabled(id)) return false;
    const rec = this.records.get(id);
    if (!rec) return false;
    return (rec.plugin.dependencies ?? []).every((dep) => this.isEnabled(dep));
  }

  /**
   * Register source patches for every plugin that should run and hasn't been
   * patched yet. Safe to call more than once: the bootPatched guard keeps a
   * plugin from being registered twice across prepare() and boot().
   */
  private registerBootPatches(): void {
    for (const { plugin } of this.records.values()) {
      if (this.shouldRun(plugin.id) && plugin.patches?.length && !this.bootPatched.has(plugin.id)) {
        this.registerPatches(plugin);
        this.bootPatched.add(plugin.id);
      }
    }
  }

  private registerPatches(plugin: Plugin): void {
    for (const spec of plugin.patches ?? []) {
      const replacements = Array.isArray(spec.replacement) ? spec.replacement : [spec.replacement];
      for (const r of replacements) {
        registerSourcePatch({
          pluginId: plugin.id,
          label: spec.label,
          find: spec.find,
          match: r.match,
          replace: r.replace,
          all: spec.all ?? false
        });
      }
    }
  }

  private startPlugin(id: string): void {
    const rec = this.records.get(id);
    if (!rec || rec.state === "running" || rec.state === "starting") return;

    rec.state = "starting";
    try {
      rec.plugin.start?.();
      rec.state = "running";
      rec.error = undefined;
      log.debug(`started "${id}"`);
    } catch (err) {
      rec.state = "errored";
      rec.error = err;
      // A plugin that fails to start is switched off so it doesn't retry on
      // every launch and so the failure surfaces in the UI.
      this.enabledMap[id] = false;
      this.persistEnabledState();
      log.error(`plugin "${id}" threw during start; it has been disabled`, err);
    }
    this.emit();
  }

  private stopPlugin(id: string): void {
    const rec = this.records.get(id);
    if (!rec || (rec.state !== "running" && rec.state !== "errored")) return;

    rec.state = "stopping";
    try {
      rec.plugin.stop?.();
      log.debug(`stopped "${id}"`);
    } catch (err) {
      log.error(`plugin "${id}" threw during stop; state may be inconsistent`, err);
    } finally {
      rec.state = "disabled";
      this.emit();
    }
  }

  /** Topological order over dependencies so a plugin starts after its deps. */
  private startOrder(): string[] {
    const ordered: string[] = [];
    const seen = new Set<string>();

    const visit = (id: string, trail: Set<string>) => {
      if (seen.has(id)) return;
      if (trail.has(id)) {
        log.error(`dependency cycle involving "${id}"; breaking it`);
        return;
      }
      trail.add(id);
      const rec = this.records.get(id);
      for (const dep of rec?.plugin.dependencies ?? []) {
        if (this.records.has(dep)) visit(dep, trail);
      }
      trail.delete(id);
      seen.add(id);
      ordered.push(id);
    };

    for (const id of this.records.keys()) visit(id, new Set());
    return ordered;
  }

  private runningCount(): number {
    let n = 0;
    for (const rec of this.records.values()) if (rec.state === "running") n++;
    return n;
  }

  private persistEnabledState(): void {
    saveNamespace(ENABLED_NS, this.enabledMap);
  }

  private emit(): void {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {
        // A broken UI subscriber must not stall the runtime.
      }
    }
  }
}

export const runtime = new Runtime();
