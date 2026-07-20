// Webpack bridge.
//
// Discord ships its client as thousands of Webpack modules registered through a
// global chunk array. We take that array over before Discord populates it so we
// can (a) rewrite module factories at load time for source-level patches and
// (b) observe every module's exports so callers can locate the ones they need.
//
// Nothing here references numeric module IDs: those churn on every Discord
// release. Callers describe modules by shape or source text instead.

import { logger } from "../logger";

const log = logger("modules");

// The global key Discord registers its chunk loader under. If Discord ever
// renames this, module discovery degrades to a no-op rather than throwing.
const CHUNK_KEY = "webpackChunkdiscord_app";

interface CachedModule {
  id: PropertyKey;
  loaded: boolean;
  exports: any;
}

interface WebpackRequire {
  (id: PropertyKey): any;
  /** Live module cache: id -> module record. */
  c: Record<PropertyKey, CachedModule>;
  /** Factory map: id -> factory function. */
  m: Record<PropertyKey, ModuleFactory>;
}

type ModuleFactory = (module: CachedModule, exports: any, require: WebpackRequire) => void;

export type ModuleFilter = (exports: any, meta: { id: PropertyKey; module: CachedModule }) => boolean;

interface SourcePatch {
  pluginId: string;
  label: string;
  find: string | RegExp;
  match: RegExp;
  replace: string | ((substring: string, ...args: any[]) => string);
  all: boolean;
  applied: boolean;
  hits: number;
}

interface Waiter {
  filter: ModuleFilter;
  resolve: (exports: any) => void;
}

let wpRequire: WebpackRequire | undefined;
let ready = false;
let interceptorInstalled = false;

const waiters = new Set<Waiter>();
const sourcePatches: SourcePatch[] = [];

/**
 * How `$self` in a patch replacement is resolved back to a live plugin
 * instance. Set by the runtime once plugins are registered.
 */
let selfResolver: (pluginId: string) => unknown = () => undefined;

export function setSelfResolver(fn: (pluginId: string) => unknown): void {
  selfResolver = fn;
  // Expose a stable global entry point that patched source can call into.
  (globalThis as any).__halcyon_self__ = (id: string) => selfResolver(id);
}

/** Register a source-level patch. Must happen before the target module loads. */
export function registerSourcePatch(patch: Omit<SourcePatch, "applied" | "hits">): void {
  sourcePatches.push({ ...patch, applied: false, hits: 0 });
}

export function getSourcePatchReport(): ReadonlyArray<Pick<SourcePatch, "pluginId" | "label" | "applied" | "hits">> {
  return sourcePatches.map(({ pluginId, label, applied, hits }) => ({ pluginId, label, applied, hits }));
}

/**
 * Take over the chunk loader so every incoming module factory is instrumented —
 * and patched — before Discord executes and caches it.
 *
 * This is synchronous and idempotent by design. It MUST run before Discord
 * pushes its first chunk: a module executed under its original factory gets
 * cached in `require.c` in that unpatched form, and swapping the factory map
 * entry afterwards does nothing for the already-cached exports. The desktop
 * build reaches this immediately; the extension build calls it ahead of its
 * async storage handshake for exactly this reason (waiting on the bridge first
 * let the settings module cache unpatched, so the native embed never applied).
 */
export function installChunkInterceptor(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;

  const target = globalThis as any;
  const existing: any[] = target[CHUNK_KEY] ?? [];

  // Wrap a push implementation so each incoming chunk is instrumented before
  // being handed on. `apply` preserves the caller's `this` and arguments.
  const wrapPush =
    (underlying: (...args: any[]) => number) =>
    function (this: any, ...args: any[]): number {
      try {
        instrumentChunk(args[0]);
      } catch (err) {
        log.error("failed to instrument chunk", err);
      }
      return underlying.apply(this ?? existing, args);
    };

  // The value `existing.push` returns. While the array is still fresh it MUST
  // stay the native push, never a wrapper. Webpack's jsonp bootstrap reads
  // `.push` to capture the "parent" appender it will call internally, and only
  // then assigns its own callback:
  //
  //   chunk.push = jsonp.bind(null, chunk.push.bind(chunk));
  //
  // If that captured parent were our wrapper — which forwards to whatever
  // Webpack assigns — the wrapper and Webpack's callback would invoke each
  // other without end (the stack overflow this replaced). So we only wrap the
  // callback Webpack hands us in the setter; the parent it captured stays
  // native.
  const prior = (existing as any).push;
  let currentPush: (...args: any[]) => number =
    typeof prior === "function" && prior !== Array.prototype.push
      ? wrapPush(prior.bind(existing)) // Webpack already hooked before us
      : Array.prototype.push.bind(existing);

  try {
    Object.defineProperty(existing, "push", {
      configurable: true,
      get: () => currentPush,
      set: (assigned: (...args: any[]) => number) => {
        currentPush = wrapPush(assigned);
      }
    });
  } catch (err) {
    log.error("could not install chunk interceptor", err);
    return;
  }

  target[CHUNK_KEY] = existing;

  // Any chunks Discord already queued before we arrived still need wrapping.
  for (const chunk of existing) {
    try {
      instrumentChunk(chunk);
    } catch {
      // Pre-existing chunks may be in odd shapes; skip quietly.
    }
  }

  // Ask Webpack to hand us the `require` implementation. Pushed even before
  // Webpack initializes: it processes pre-existing array entries on startup, so
  // this runtime callback fires either way.
  (existing.push as (chunk: any[]) => number)([
    [Symbol("halcyon.require")],
    {},
    (req: WebpackRequire) => {
      wpRequire = req;
      // Catch modules whose chunk landed BEFORE our push hook went live. Their
      // factories are already in `req.m`, but most have not executed yet;
      // wrapping them in place means patches still apply when Discord first
      // requires them. Without this, an early-loading module (the emoji-
      // usability utilities among them) runs unpatched and its source patches
      // silently miss — which is exactly why the picker stayed locked while the
      // later-loading send module patched fine.
      try {
        wrapPendingFactories(req);
      } catch (err) {
        log.error("failed to wrap pre-existing factories", err);
      }
    }
  ]);
}

/**
 * Wrap every not-yet-executed factory already sitting in Webpack's require map.
 *
 * The push hook only sees chunks that arrive after we install; anything Webpack
 * merged into `require.m` before that is invisible to it. On the browser
 * extension our MAIN-world content script does not reliably beat Discord's
 * bundle, so a batch of core modules can already be registered by the time we
 * get `require`. Those whose factories have not run yet (absent from
 * `require.c`) can still be wrapped in place, so a later require applies the
 * patches. A module already in `require.c` has been required — it ran under its
 * original factory and cannot be retro-patched — so it is skipped.
 */
function wrapPendingFactories(req: WebpackRequire): void {
  const factories = req?.m;
  if (!factories || typeof factories !== "object") return;

  let wrapped = 0;
  let alreadyRun = 0;
  for (const id of Object.keys(factories)) {
    const original = factories[id];
    if (typeof original !== "function" || (original as any).__halcyon__) continue;
    if (req.c && req.c[id]) {
      alreadyRun++;
      continue; // already required — too late to patch this one
    }
    factories[id] = wrapFactory(id, original);
    wrapped++;
  }

  if (wrapped || alreadyRun) {
    log.info(
      `swept pre-existing factories: wrapped ${wrapped}, skipped ${alreadyRun} already-executed`
    );
  }
}

/**
 * Resolve once a recognizable core module (the Flux dispatcher) has appeared,
 * which we treat as "Discord's runtime is alive". Ensures the interceptor is in
 * place first, then waits — with a safety valve so it never hangs forever.
 */
export function awaitCoreReady(): Promise<void> {
  return new Promise((resolveReady) => {
    installChunkInterceptor();

    waitFor(
      (exp) => isFluxDispatcher(exp),
      () => {
        if (ready) return;
        ready = true;
        log.info("core runtime detected");
        resolveReady();
      }
    );

    // Safety valve: never hang forever. If the dispatcher never shows up we
    // still resolve so the loader can report a clean failure instead of hanging.
    setTimeout(() => {
      if (ready) return;
      log.warn("core module not seen within grace period; continuing degraded");
      ready = true;
      resolveReady();
    }, 15_000);
  });
}

/**
 * Take over the chunk loader and resolve once Discord's runtime is alive.
 * A convenience wrapper for callers that want both phases in one await; the two
 * halves are also exposed separately so the interceptor can be installed as
 * early as possible, ahead of any async setup.
 */
export function bootstrap(): Promise<void> {
  installChunkInterceptor();
  return awaitCoreReady();
}

function instrumentChunk(chunk: any[]): void {
  const factories = chunk?.[1];
  if (!factories || typeof factories !== "object") return;

  for (const id of Object.keys(factories)) {
    const original = factories[id];
    if (typeof original !== "function" || (original as any).__halcyon__) continue;
    factories[id] = wrapFactory(id, original);
  }
}

function wrapFactory(id: string, original: ModuleFactory): ModuleFactory {
  // Lazily compute the patched factory on first execution, so patches registered
  // after instrumentChunk (e.g., plugin patches from runtime.boot) are seen.
  let effective: ModuleFactory | undefined;

  const wrapped: ModuleFactory = function (this: any, module, exports, require) {
    if (!effective) {
      const applicable = sourcePatches.filter((p) => sourceMatches(p.find, original));
      effective = applicable.length ? applyPatches(id, original, applicable) : original;
    }
    effective.call(this, module, exports, require);
    // After the factory runs, `module.exports` is settled. Let waiters inspect.
    try {
      dispatchToWaiters(module);
    } catch (err) {
      log.error("module observer threw for", id, err);
    }
  };

  // Preserve original source text so later patches (and findBySource) still work.
  wrapped.toString = () => original.toString();
  (wrapped as any).__halcyon__ = true;
  return wrapped;
}

function applyPatches(id: string, original: ModuleFactory, patches: SourcePatch[]): ModuleFactory {
  let code = String(original);

  for (const patch of patches) {
    const before = code;
    const replacement = bindSelf(patch.replace, patch.pluginId);
    code = patch.all
      ? code.replace(new RegExp(patch.match.source, ensureGlobal(patch.match.flags)), replacement as any)
      : code.replace(patch.match, replacement as any);

    if (code === before) {
      log.warn(`patch "${patch.label}" (${patch.pluginId}) matched module ${id} but changed nothing`);
      continue;
    }
    patch.applied = true;
    patch.hits++;
    log.debug(`applied patch "${patch.label}" (${patch.pluginId}) to module ${id}`);
  }

  try {
    // Discord stores factories in several shapes: `function(){}`, arrows, and
    // concise object methods like `12345(e,t,n){}`. Only the last is not a
    // valid standalone expression, so normalize it first. The factory is
    // self-contained (all deps arrive through its `require` argument), so
    // recompiling it in global scope loses nothing it depends on.
    // eslint-disable-next-line no-eval
    const rebuilt = (0, eval)(`(${toFunctionExpression(code)})`) as ModuleFactory;
    return rebuilt;
  } catch (err) {
    log.error(`patched module ${id} failed to compile; using original`, err);
    return original;
  }
}

/**
 * Coerce a stringified module factory into a form that is a valid standalone
 * function expression, so `eval("(" + it + ")")` parses.
 *
 * Function expressions (`function(){}`, `function name(){}`, `async function`)
 * and arrows (`a=>{}`, `(a)=>{}`) are already fine. Concise object/class
 * methods (`name(a){}`, `*gen(){}`, `async m(){}`, `[computed](){}`) are not —
 * they carry a leading method head where an expression is expected — so rewrite
 * that head into an anonymous `function`.
 */
function toFunctionExpression(src: string): string {
  const s = src.trimStart();

  if (/^(async\s+)?function[\s*(]/.test(s)) return s;
  if (/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(s)) return s;

  const head = s.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);
  if (head) {
    const asyncKw = head[1] ? "async " : "";
    const star = head[2] ? "*" : "";
    // Keep the "(" that head captured; splice in the function keyword before it.
    return `${asyncKw}function${star}${s.slice(head[0].length - 1)}`;
  }

  return s;
}

function ensureGlobal(flags: string): string {
  return flags.includes("g") ? flags : flags + "g";
}

function bindSelf(
  replace: string | ((substring: string, ...args: any[]) => string),
  pluginId: string
): string | ((substring: string, ...args: any[]) => string) {
  const token = `__halcyon_self__(${JSON.stringify(pluginId)})`;
  if (typeof replace === "string") {
    return replace.split("$self").join(token);
  }
  return (...args: any[]) => (replace as (...rest: any[]) => string)(...args).split("$self").join(token);
}

function sourceMatches(find: string | RegExp, factory: ModuleFactory): boolean {
  const src = factory.toString();
  return typeof find === "string" ? src.includes(find) : find.test(src);
}

// How many own keys of an export object the nested scan will walk. Real module
// namespaces are small; anything bigger is data (maps, tables) and skipped.
const NESTED_SCAN_MAX_KEYS = 40;

/**
 * Test one module's exports against a filter: the exports object itself, then
 * — one level deep — each own-key value. The nested walk matters: Discord's
 * webpack now publishes most modules under minified export keys (`.Z`, `.ZP`,
 * `.h`…), so shape probes that only look at `exports` and `exports.default`
 * miss them entirely (the Flux dispatcher among them — the recorder silently
 * hooked 48 lookalikes while the real one sat behind such a key).
 */
function matchExport(exp: any, filter: ModuleFilter, meta: { id: PropertyKey; module: CachedModule }): any {
  try {
    if (filter(exp, meta)) return exp;
  } catch {
    // Not a match; keep probing nested values.
  }

  if (typeof exp !== "object" && typeof exp !== "function") return undefined;

  let keys: string[];
  try {
    keys = Object.keys(exp);
  } catch {
    return undefined;
  }
  if (keys.length > NESTED_SCAN_MAX_KEYS) return undefined;

  for (const key of keys) {
    let value: any;
    try {
      value = exp[key];
    } catch {
      continue; // getters may throw on access
    }
    if (value == null || (typeof value !== "object" && typeof value !== "function")) continue;
    try {
      if (filter(value, meta)) return value;
    } catch {
      // not a match
    }
  }
  return undefined;
}

function dispatchToWaiters(module: CachedModule): void {
  if (!waiters.size) return;
  const exp = module.exports;
  if (exp == null) return;

  for (const waiter of waiters) {
    const hit = matchExport(exp, waiter.filter, { id: module.id, module });
    if (hit !== undefined) {
      waiters.delete(waiter);
      waiter.resolve(hit);
    }
  }
}

/** Iterate the live cache, returning the first export that satisfies `filter`. */
export function find(filter: ModuleFilter): any {
  if (!wpRequire) return undefined;

  for (const id of Object.keys(wpRequire.c)) {
    const module = wpRequire.c[id];
    const exp = module?.exports;
    if (exp == null || exp === globalThis) continue;

    const hit = matchExport(exp, filter, { id, module });
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/** Every export satisfying `filter`. */
export function findAll(filter: ModuleFilter): any[] {
  const out: any[] = [];
  if (!wpRequire) return out;

  for (const id of Object.keys(wpRequire.c)) {
    const module = wpRequire.c[id];
    const exp = module?.exports;
    if (exp == null || exp === globalThis) continue;

    const hit = matchExport(exp, filter, { id, module });
    if (hit !== undefined) out.push(hit);
  }
  return out;
}

/** Find a module exporting all of the named properties. */
export function findByProps(...props: string[]): any {
  return find((exp) => props.every((p) => exp[p] !== undefined));
}

/** Find a module whose factory source contains all of the given substrings. */
export function findBySource(...needles: string[]): any {
  if (!wpRequire) return undefined;

  for (const id of Object.keys(wpRequire.m)) {
    let src: string;
    try {
      src = wpRequire.m[id].toString();
    } catch {
      continue;
    }
    if (needles.every((n) => src.includes(n))) {
      try {
        return wpRequire(id);
      } catch (err) {
        log.error("failed to require source-matched module", id, err);
      }
    }
  }
  return undefined;
}

/** Locate a Flux store by its registered name (`store.getName()`). */
export function findStore(name: string): any {
  return find((exp) => exp?.getName?.() === name || exp?.constructor?.displayName === name);
}

/** Register a callback fired once a matching module appears (now or later). */
export function waitFor(filter: ModuleFilter, callback: (exports: any) => void): void {
  // Check what is already loaded first.
  const existing = find(filter);
  if (existing !== undefined) {
    callback(existing);
    return;
  }
  waiters.add({ filter, resolve: callback });
}

/**
 * A proxy that defers resolution until first property access. Useful when a
 * plugin captures a module reference at start() but the module may not have
 * loaded yet.
 */
export function lazy<T = any>(filter: ModuleFilter): T {
  let resolved: any;
  const get = () => (resolved ??= find(filter));

  return new Proxy(
    {},
    {
      get(_t, key) {
        const mod = get();
        if (mod == null) return undefined;
        const value = mod[key];
        return typeof value === "function" ? value.bind(mod) : value;
      },
      has(_t, key) {
        const mod = get();
        return mod != null && key in mod;
      }
    }
  ) as T;
}

export function isReady(): boolean {
  return ready;
}

/**
 * Whether an export looks like Discord's Flux dispatcher. Deliberately lenient:
 * `dispatch` + `subscribe` plus any one of the dispatcher's internals, so it
 * keeps matching across the shape changes Discord makes between releases.
 */
export function isFluxDispatcher(exp: any): boolean {
  return (
    exp != null &&
    typeof exp.dispatch === "function" &&
    typeof exp.subscribe === "function" &&
    (typeof exp._actionHandlers !== "undefined" ||
      typeof exp._subscriptions !== "undefined" ||
      typeof exp._waitQueue !== "undefined" ||
      typeof exp.isDispatching === "function" ||
      typeof exp.wait === "function")
  );
}

/**
 * Debug helper: return a readable slice of every loaded factory whose source
 * contains `needle`, windowed around each occurrence. Exposed through
 * HalcyonAPI so the real shape of a patch target can be inspected from the
 * console when a patch applies but does not behave as expected.
 */
export function dumpFactorySource(needle: string, radius = 300): string {
  const factories = wpRequire?.m;
  if (!factories) return "<webpack require not ready — open the target UI first>";

  const blocks: string[] = [];
  for (const id of Object.keys(factories)) {
    let src: string;
    try {
      src = String(factories[id]);
    } catch {
      continue;
    }
    if (!src.includes(needle)) continue;

    const slices: string[] = [];
    let idx = src.indexOf(needle);
    let hits = 0;
    while (idx >= 0 && hits < 4) {
      slices.push(src.slice(Math.max(0, idx - radius), idx + needle.length + radius));
      idx = src.indexOf(needle, idx + needle.length);
      hits++;
    }
    blocks.push(`===== module ${id} (${hits} hit${hits === 1 ? "" : "s"}) =====\n${slices.join("\n  ...  \n")}`);
  }

  return blocks.length ? blocks.join("\n\n") : `<no loaded factory contains "${needle}">`;
}

/**
 * Debug helper: crawl the live React fiber tree and report what actually
 * renders the settings surface right now, and whether Halcyon's embed reached
 * it. A source patch can apply cleanly to a module that is loaded but never
 * rendered (dead or superseded code), in which case the patched method is
 * simply never called — this tells that apart from a patch that never matched.
 *
 * Reports both settings architectures: the current layout *builder*
 * (`buildLayout`) and the older `getPredicateSections`. For each, it notes
 * whether the component on screen carries Halcyon's patch marker
 * (`__halcyon_self__`). It also checks the DOM for Halcyon's own embed wrapper
 * (`.hc-embed`), which is the ground truth that the section rendered, and folds
 * in the source-patch report so "did it match at load time" and "did it render"
 * can be read side by side.
 *
 * Open user settings before calling, so the components are mounted and reachable.
 */
export function diagnoseSettings(): string {
  const patches = getSourcePatchReport();
  const dom = {
    // The wrapper EmbeddedView renders — proof the section is on screen.
    embedRendered: typeof document !== "undefined" && !!document.querySelector(".hc-embed"),
    // Any Halcyon surface mounted at all (embed or overlay).
    halcyonMounted: typeof document !== "undefined" && !!document.querySelector(".halcyon")
  };

  try {
    // Grab any fiber from the DOM, then climb to the tree root.
    let start: any = null;
    const els = document.querySelectorAll("*");
    for (let i = 0; i < els.length && !start; i++) {
      const el = els[i] as unknown as Record<string, unknown>;
      const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
      if (key) start = el[key];
    }
    if (!start) return JSON.stringify({ error: "no React fiber found in DOM", patches, dom }, null, 2);

    let root = start;
    while (root.return) root = root.return;

    const srcOf = (t: any): string => {
      try {
        if (typeof t === "function") return Function.prototype.toString.call(t);
        if (t && typeof t === "object") {
          const inner = t.type || t.render;
          if (typeof inner === "function") return Function.prototype.toString.call(inner);
        }
      } catch {
        /* some exotic types throw on toString */
      }
      return "";
    };
    const nameOf = (t: any): string =>
      (t && (t.displayName || t.name)) ||
      (t && t.type && (t.type.displayName || t.type.name)) ||
      "";

    const queue: any[] = [root];
    let walked = 0;
    // Current architecture: the layout builder.
    const buildLayoutHits: Array<{ name: string; patched: boolean }> = [];
    // Older architecture: the predicate-section list.
    const gpsHits: Array<{ name: string; patched: boolean }> = [];
    const sidebarComps = new Set<string>();
    const namedSettings = new Set<string>();

    while (queue.length && walked < 40000) {
      const f = queue.shift();
      walked++;
      const t = f.type;
      if (t && (typeof t === "function" || typeof t === "object")) {
        const s = srcOf(t);
        const n = nameOf(t) || "anon";
        const patched = s.includes("__halcyon_self__");
        if (s.includes("buildLayout")) buildLayoutHits.push({ name: n, patched });
        if (s.includes("getPredicateSections")) gpsHits.push({ name: n, patched });
        if (s.includes("renderSidebar") || s.includes("SETTINGS_SIDEBAR")) sidebarComps.add(n);
        if (/settings/i.test(n)) namedSettings.add(n);
      }
      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }

    // A plain-language read on the two questions that matter.
    const layoutPatch = patches.find((p) => p.label === "user-settings-layout");
    const sidebarPatch = patches.find((p) => p.label === "user-settings-sidebar");
    const verdict = dom.embedRendered
      ? "embed rendered — Halcyon section is on screen"
      : layoutPatch?.applied || sidebarPatch?.applied
        ? "patch applied at load but section not seen — open user settings, then re-run"
        : "no settings patch matched this build — run dumpSource('buildLayout') and share the output";

    return JSON.stringify(
      {
        verdict,
        dom,
        patches,
        walked,
        buildLayoutHits,
        gpsHits,
        sidebarComps: [...sidebarComps].slice(0, 25),
        settingsNamed: [...namedSettings].slice(0, 40)
      },
      null,
      2
    );
  } catch (err) {
    return JSON.stringify({ error: String(err), patches, dom }, null, 2);
  }
}
