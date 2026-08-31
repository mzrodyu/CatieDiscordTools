// ==UserScript==
// @name         Halcyon for Discord
// @namespace    halcyon
// @version      0.6.5
// @description  A restrained, iOS-styled plugin layer for the Discord web client.
// @author       caitemm (mzrodyu)
// @match        *://*.discord.com/*
// @run-at       document-start
// @grant        none
// @license      GPL-3.0-or-later
// @updateURL    https://raw.githubusercontent.com/mzrodyu/CatieDiscordTools/main/dist/halcyon.user.js
// @downloadURL  https://raw.githubusercontent.com/mzrodyu/CatieDiscordTools/main/dist/halcyon.user.js
// ==/UserScript==

"use strict";
var Halcyon = (() => {
  // src/core/logger/index.ts
  var WEIGHT = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
  };
  var BADGE = {
    debug: "#8E8E93",
    info: "#0A84FF",
    warn: "#FF9F0A",
    error: "#FF453A"
  };
  var RING_CAPACITY = 500;
  var ring = [];
  var subscribers = /* @__PURE__ */ new Set();
  var threshold = false ? WEIGHT.debug : WEIGHT.info;
  function record(level, scope, parts) {
    const entry = { time: Date.now(), level, scope, parts };
    ring.push(entry);
    if (ring.length > RING_CAPACITY) ring.shift();
    for (const fn of subscribers) {
      try {
        fn(entry);
      } catch {
      }
    }
    if (WEIGHT[level] < threshold) return;
    const badge = `background:${BADGE[level]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;
    const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    sink(`%cHalcyon%c ${scope}`, badge, "color:inherit;font-weight:600", ...parts);
  }
  function logger(scope) {
    return {
      debug: (...p) => record("debug", scope, p),
      info: (...p) => record("info", scope, p),
      warn: (...p) => record("warn", scope, p),
      error: (...p) => record("error", scope, p),
      child: (childScope) => logger(`${scope}:${childScope}`)
    };
  }
  function getLogHistory() {
    return ring.slice();
  }
  function onLog(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  // src/core/modules/webpack.ts
  var log = logger("modules");
  var CHUNK_KEY = "webpackChunkdiscord_app";
  var wpRequire;
  var ready = false;
  var interceptorInstalled = false;
  var waiters = /* @__PURE__ */ new Set();
  var sourcePatches = [];
  var selfResolver = () => void 0;
  function setSelfResolver(fn) {
    selfResolver = fn;
    globalThis.__halcyon_self__ = (id) => selfResolver(id);
  }
  function registerSourcePatch(patch) {
    sourcePatches.push({ index: 1, count: 1, optional: false, ...patch, applied: false, hits: 0, seen: 0 });
  }
  function getSourcePatchReport() {
    return sourcePatches.map(({ pluginId, label, applied, hits, seen, index, count: count2, optional }) => ({
      pluginId,
      label,
      applied,
      hits,
      seen,
      index,
      count: count2,
      optional
    }));
  }
  function installChunkInterceptor() {
    if (interceptorInstalled) return;
    interceptorInstalled = true;
    const target = globalThis;
    const existing = target[CHUNK_KEY] ?? [];
    const wrapPush = (underlying) => function(...args) {
      try {
        instrumentChunk(args[0]);
      } catch (err) {
        log.error("failed to instrument chunk", err);
      }
      return underlying.apply(this ?? existing, args);
    };
    const prior = existing.push;
    let currentPush = typeof prior === "function" && prior !== Array.prototype.push ? wrapPush(prior.bind(existing)) : Array.prototype.push.bind(existing);
    try {
      Object.defineProperty(existing, "push", {
        configurable: true,
        get: () => currentPush,
        set: (assigned) => {
          currentPush = wrapPush(assigned);
        }
      });
    } catch (err) {
      log.error("could not install chunk interceptor", err);
      return;
    }
    target[CHUNK_KEY] = existing;
    for (const chunk of existing) {
      try {
        instrumentChunk(chunk);
      } catch {
      }
    }
    existing.push([
      [Symbol("halcyon.require")],
      {},
      (req) => {
        wpRequire = req;
        try {
          wrapPendingFactories(req);
        } catch (err) {
          log.error("failed to wrap pre-existing factories", err);
        }
      }
    ]);
  }
  function wrapPendingFactories(req) {
    const factories = req?.m;
    if (!factories || typeof factories !== "object") return;
    let wrapped = 0;
    let alreadyRun = 0;
    for (const id of Object.keys(factories)) {
      const original = factories[id];
      if (typeof original !== "function" || original.__halcyon__) continue;
      if (req.c && req.c[id]) {
        alreadyRun++;
        continue;
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
  function awaitCoreReady() {
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
      setTimeout(() => {
        if (ready) return;
        log.warn("core module not seen within grace period; continuing degraded");
        ready = true;
        resolveReady();
      }, 15e3);
    });
  }
  function instrumentChunk(chunk) {
    const factories = chunk?.[1];
    if (!factories || typeof factories !== "object") return;
    for (const id of Object.keys(factories)) {
      const original = factories[id];
      if (typeof original !== "function" || original.__halcyon__) continue;
      factories[id] = wrapFactory(id, original);
    }
  }
  function wrapFactory(id, original) {
    let effective;
    const wrapped = function(module, exports, require2) {
      if (!effective) {
        const applicable = sourcePatches.filter((p) => sourceMatches(p.find, original));
        for (const p of applicable) p.seen++;
        effective = applicable.length ? applyPatches(id, original, applicable, wrapped) : original;
      }
      effective.call(this, module, exports, require2);
      try {
        dispatchToWaiters(module);
      } catch (err) {
        log.error("module observer threw for", id, err);
      }
    };
    wrapped.toString = () => original.toString();
    wrapped.__halcyon__ = true;
    return wrapped;
  }
  function applyPatches(id, original, patches, wrapper) {
    let code = String(original);
    let changed = false;
    for (const patch of patches) {
      const before = code;
      const replacement = bindSelf(patch.replace, patch.pluginId);
      code = patch.all ? code.replace(new RegExp(patch.match.source, ensureGlobal(patch.match.flags)), replacement) : code.replace(patch.match, replacement);
      if (code === before) {
        log.warn(
          `patch "${patch.label}"${patch.count > 1 ? ` \u7B2C ${patch.index}/${patch.count} \u5904` : ""} (${patch.pluginId}) matched module ${id} but changed nothing`
        );
        continue;
      }
      patch.applied = true;
      patch.hits++;
      changed = true;
      log.debug(`applied patch "${patch.label}" (${patch.pluginId}) to module ${id}`);
    }
    if (changed && wrapper) {
      try {
        wrapper.__halcyon_patched_source__ = code;
      } catch {
      }
    }
    try {
      const rebuilt = (0, eval)(`(${toFunctionExpression(code)})`);
      return rebuilt;
    } catch (err) {
      log.error(`patched module ${id} failed to compile; using original`, err);
      return original;
    }
  }
  function toFunctionExpression(src) {
    const s = src.trimStart();
    if (/^(async\s+)?function[\s*(]/.test(s)) return s;
    if (/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(s)) return s;
    const head = s.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);
    if (head) {
      const asyncKw = head[1] ? "async " : "";
      const star = head[2] ? "*" : "";
      return `${asyncKw}function${star}${s.slice(head[0].length - 1)}`;
    }
    return s;
  }
  function ensureGlobal(flags) {
    return flags.includes("g") ? flags : flags + "g";
  }
  function bindSelf(replace, pluginId) {
    const token = `__halcyon_self__(${JSON.stringify(pluginId)})`;
    if (typeof replace === "string") {
      return replace.split("$self").join(token);
    }
    return (...args) => replace(...args).split("$self").join(token);
  }
  function sourceMatches(find2, factory) {
    const src = factory.toString();
    return typeof find2 === "string" ? src.includes(find2) : find2.test(src);
  }
  var NESTED_SCAN_MAX_KEYS = 40;
  function matchExport(exp, filter, meta) {
    try {
      if (filter(exp, meta)) return exp;
    } catch {
    }
    if (typeof exp !== "object" && typeof exp !== "function") return void 0;
    let keys;
    try {
      keys = Object.keys(exp);
    } catch {
      return void 0;
    }
    if (keys.length > NESTED_SCAN_MAX_KEYS) return void 0;
    for (const key of keys) {
      let value;
      try {
        value = exp[key];
      } catch {
        continue;
      }
      if (value == null || typeof value !== "object" && typeof value !== "function") continue;
      try {
        if (filter(value, meta)) return value;
      } catch {
      }
    }
    return void 0;
  }
  function dispatchToWaiters(module) {
    if (!waiters.size) return;
    const exp = module.exports;
    if (exp == null) return;
    for (const waiter of waiters) {
      const hit = matchExport(exp, waiter.filter, { id: module.id, module });
      if (hit !== void 0) {
        waiters.delete(waiter);
        waiter.resolve(hit);
      }
    }
  }
  function find(filter) {
    if (!wpRequire) return void 0;
    for (const id of Object.keys(wpRequire.c)) {
      const module = wpRequire.c[id];
      const exp = module?.exports;
      if (exp == null || exp === globalThis) continue;
      const hit = matchExport(exp, filter, { id, module });
      if (hit !== void 0) return hit;
    }
    return void 0;
  }
  function findAll(filter) {
    const out = [];
    if (!wpRequire) return out;
    for (const id of Object.keys(wpRequire.c)) {
      const module = wpRequire.c[id];
      const exp = module?.exports;
      if (exp == null || exp === globalThis) continue;
      const hit = matchExport(exp, filter, { id, module });
      if (hit !== void 0) out.push(hit);
    }
    return out;
  }
  function findByProps(...props) {
    return find((exp) => props.every((p) => exp[p] !== void 0));
  }
  function findByCode(...needles) {
    return find((exp) => {
      if (typeof exp !== "function") return false;
      let src;
      try {
        src = Function.prototype.toString.call(exp);
      } catch {
        return false;
      }
      return needles.every((n) => src.includes(n));
    });
  }
  function findStore(name) {
    return find((exp) => exp?.getName?.() === name || exp?.constructor?.displayName === name);
  }
  function getAllStores() {
    const fluxModule = find(
      (exp) => typeof exp?.Store === "function" && typeof exp.Store.getAll === "function"
    );
    if (fluxModule) {
      try {
        const all = fluxModule.Store.getAll();
        if (Array.isArray(all) && all.length > 0) return all;
      } catch {
      }
    }
    return findAll(
      (exp) => typeof exp?.getName === "function" && typeof exp?.addChangeListener === "function" && // Reject Discord's answer-everything intl proxy (see UserStore).
      typeof exp?.__halcyon_probe__ === "undefined"
    );
  }
  function storeNames() {
    const names = /* @__PURE__ */ new Set();
    for (const store of getAllStores()) {
      try {
        const name = store?.getName?.();
        if (typeof name === "string" && name) names.add(name);
      } catch {
      }
    }
    return [...names].sort();
  }
  function findStoreByName(name) {
    const direct = findStore(name);
    if (direct) return direct;
    for (const store of getAllStores()) {
      try {
        if (store?.getName?.() === name || store?.constructor?.displayName === name) return store;
      } catch {
      }
    }
    return void 0;
  }
  function findStoreWithMethods(...methods) {
    for (const store of getAllStores()) {
      try {
        if (methods.every((m) => typeof store?.[m] === "function")) return store;
      } catch {
      }
    }
    return void 0;
  }
  function waitFor(filter, callback) {
    const existing = find(filter);
    if (existing !== void 0) {
      callback(existing);
      return;
    }
    waiters.add({ filter, resolve: callback });
  }
  function lazy(filter) {
    let resolved;
    const get = () => resolved ??= find(filter);
    return new Proxy(
      {},
      {
        get(_t, key) {
          const mod = get();
          if (mod == null) return void 0;
          const value = mod[key];
          return typeof value === "function" ? value.bind(mod) : value;
        },
        has(_t, key) {
          const mod = get();
          return mod != null && key in mod;
        }
      }
    );
  }
  function isReady() {
    return ready;
  }
  function isFluxDispatcher(exp) {
    return exp != null && typeof exp.__halcyon_probe__ === "undefined" && typeof exp.dispatch === "function" && typeof exp.subscribe === "function" && (typeof exp._actionHandlers !== "undefined" || typeof exp._subscriptions !== "undefined" || typeof exp._waitQueue !== "undefined" || typeof exp.isDispatching === "function" || typeof exp.wait === "function");
  }
  function dumpFactorySource(needle, radius = 300) {
    const factories = wpRequire?.m;
    if (!factories) return "<webpack require not ready \u2014 open the target UI first>";
    const blocks = [];
    for (const id of Object.keys(factories)) {
      let src;
      let patched = false;
      try {
        const rewritten = factories[id]?.__halcyon_patched_source__;
        if (typeof rewritten === "string") {
          src = rewritten;
          patched = true;
        } else {
          src = String(factories[id]);
        }
      } catch {
        continue;
      }
      if (!src.includes(needle)) continue;
      const slices = [];
      let idx = src.indexOf(needle);
      let hits = 0;
      while (idx >= 0 && hits < 4) {
        slices.push(src.slice(Math.max(0, idx - radius), idx + needle.length + radius));
        idx = src.indexOf(needle, idx + needle.length);
        hits++;
      }
      blocks.push(
        `===== module ${id} (${hits} hit${hits === 1 ? "" : "s"}${patched ? ", PATCHED source" : ""}) =====
${slices.join("\n  ...  \n")}`
      );
    }
    return blocks.length ? blocks.join("\n\n") : `<no loaded factory contains "${needle}">`;
  }
  function diagnoseSettings() {
    const patches = getSourcePatchReport();
    const dom = {
      // The wrapper EmbeddedView renders — proof the section is on screen.
      embedRendered: typeof document !== "undefined" && !!document.querySelector(".hc-embed"),
      // Any Halcyon surface mounted at all (embed or overlay).
      halcyonMounted: typeof document !== "undefined" && !!document.querySelector(".halcyon")
    };
    try {
      let start = null;
      const els = document.querySelectorAll("*");
      for (let i = 0; i < els.length && !start; i++) {
        const el = els[i];
        const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
        if (key) start = el[key];
      }
      if (!start) return JSON.stringify({ error: "no React fiber found in DOM", patches, dom }, null, 2);
      let root = start;
      while (root.return) root = root.return;
      const srcOf = (t) => {
        try {
          if (typeof t === "function") return Function.prototype.toString.call(t);
          if (t && typeof t === "object") {
            const inner = t.type || t.render;
            if (typeof inner === "function") return Function.prototype.toString.call(inner);
          }
        } catch {
        }
        return "";
      };
      const nameOf = (t) => t && (t.displayName || t.name) || t && t.type && (t.type.displayName || t.type.name) || "";
      const queue = [root];
      let walked = 0;
      const buildLayoutHits = [];
      const gpsHits = [];
      const sidebarComps = /* @__PURE__ */ new Set();
      const namedSettings = /* @__PURE__ */ new Set();
      while (queue.length && walked < 4e4) {
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
      const layoutPatch = patches.find((p) => p.label === "user-settings-layout");
      const sidebarPatch = patches.find((p) => p.label === "user-settings-sidebar");
      const verdict = dom.embedRendered ? "embed rendered \u2014 Halcyon section is on screen" : layoutPatch?.applied || sidebarPatch?.applied ? "patch applied at load but section not seen \u2014 open user settings, then re-run" : "no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";
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

  // src/core/common/react.ts
  function lazyProxy(resolve) {
    let cached2;
    const get = () => cached2 ??= resolve();
    return new Proxy(function() {
    }, {
      get: (_t, key) => get()?.[key],
      set: (_t, key, value) => {
        const mod = get();
        if (mod) mod[key] = value;
        return true;
      },
      has: (_t, key) => {
        const mod = get();
        return mod != null && key in mod;
      },
      ownKeys: () => Reflect.ownKeys(get() ?? {}),
      getOwnPropertyDescriptor: (_t, key) => Reflect.getOwnPropertyDescriptor(get() ?? {}, key),
      apply: (_t, thisArg, args) => get().apply(thisArg, args),
      construct: (_t, args) => new (get())(...args)
    });
  }
  function byFunctionProps(...props) {
    return (exp) => props.every((p) => typeof exp[p] === "function") && typeof exp.__halcyon_probe__ === "undefined";
  }
  var React = lazyProxy(
    () => find(byFunctionProps("createElement", "useState", "useEffect", "useMemo"))
  );
  var ReactDOM = lazyProxy(
    () => find(byFunctionProps("createPortal", "flushSync")) ?? find(byFunctionProps("createPortal"))
  );
  function getCreateRoot() {
    const mod = find(byFunctionProps("createRoot", "hydrateRoot")) ?? find(byFunctionProps("createRoot"));
    return mod?.createRoot?.bind(mod);
  }
  function mountDetached(element, container) {
    const createRoot = getCreateRoot();
    if (createRoot) {
      const root = createRoot(container);
      root.render(element);
      return () => {
        try {
          root.unmount();
        } catch {
        }
      };
    }
    ReactDOM.render(element, container);
    return () => {
      try {
        ReactDOM.unmountComponentAtNode(container);
      } catch {
      }
    };
  }
  function getFiber(node) {
    if (node == null || typeof node !== "object") return null;
    try {
      for (const key of Object.getOwnPropertyNames(node)) {
        if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
          return node[key];
        }
      }
    } catch {
    }
    return null;
  }
  function getFiberPropsChain(node, maxDepth = 30) {
    const out = [];
    let fiber = getFiber(node);
    for (let depth = 0; fiber != null && depth < maxDepth; depth++) {
      try {
        const props = fiber.memoizedProps ?? fiber.pendingProps;
        if (props != null && typeof props === "object") out.push(props);
        fiber = fiber.return;
      } catch {
        break;
      }
    }
    return out;
  }
  var useState = (...a) => React.useState(...a);
  var useEffect = (...a) => React.useEffect(...a);
  var useMemo = (...a) => React.useMemo(...a);
  var useRef = (...a) => React.useRef(...a);

  // src/userscript/install-storage.ts
  var g = globalThis;
  try {
    const ls = g.localStorage;
    if (ls) {
      const native = g.HalcyonNative ??= {};
      native.storage = {
        read: (key) => ls.getItem(key),
        write: (key, value) => ls.setItem(key, value),
        remove: (key) => ls.removeItem(key)
      };
    }
  } catch {
  }

  // src/core/settings/storage.ts
  var log2 = logger("settings");
  var PREFIX = "halcyon:";
  function selectBackend() {
    const native = globalThis.HalcyonNative?.storage;
    if (native && typeof native.read === "function" && typeof native.write === "function") {
      return native;
    }
    try {
      const ls = globalThis.localStorage;
      if (ls) {
        return {
          read: (k) => ls.getItem(k),
          write: (k, v) => ls.setItem(k, v),
          remove: (k) => ls.removeItem(k)
        };
      }
    } catch {
    }
    log2.warn("no persistent storage backend; settings will not survive a restart");
    const memory = /* @__PURE__ */ new Map();
    return {
      read: (k) => memory.get(k) ?? null,
      write: (k, v) => void memory.set(k, v),
      remove: (k) => void memory.delete(k)
    };
  }
  var backend = selectBackend();
  function loadNamespace(id) {
    const raw = backend.read(PREFIX + id);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      try {
        backend.write(`${PREFIX}${id}.corrupt-${stamp}`, raw);
      } catch {
      }
      log2.warn(`stored settings for "${id}" were unreadable; reset to defaults (backup kept)`);
      return {};
    }
  }
  function saveNamespace(id, values) {
    try {
      backend.write(PREFIX + id, JSON.stringify(values));
    } catch (err) {
      log2.error(`could not persist settings for "${id}"`, err);
    }
  }
  var hintStore;
  try {
    hintStore = globalThis.localStorage;
  } catch {
    hintStore = void 0;
  }
  var HINT_PREFIX = "halcyon:hint:";
  function readSyncHint(id) {
    try {
      if (!hintStore) return void 0;
      const raw = hintStore.getItem(HINT_PREFIX + id);
      if (!raw) return void 0;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : void 0;
    } catch {
      return void 0;
    }
  }
  function writeSyncHint(id, values) {
    try {
      if (!hintStore) return;
      hintStore.setItem(HINT_PREFIX + id, JSON.stringify(values));
    } catch {
    }
  }

  // src/core/runtime.ts
  var log3 = logger("runtime");
  var ENABLED_NS = "core.enabled";
  var Runtime = class {
    records = /* @__PURE__ */ new Map();
    enabledMap = {};
    bootPatched = /* @__PURE__ */ new Set();
    listeners = /* @__PURE__ */ new Set();
    prepared = false;
    booted = false;
    register(plugin) {
      if (this.records.has(plugin.id)) {
        log3.warn(`duplicate plugin id "${plugin.id}" ignored`);
        return;
      }
      this.records.set(plugin.id, { plugin, state: "disabled" });
      plugin.settings?.__bind(plugin.id);
    }
    registerAll(plugins2) {
      for (const p of plugins2) this.register(p);
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
    prepare() {
      if (this.prepared) return;
      this.prepared = true;
      setSelfResolver((id) => this.records.get(id)?.plugin);
      const hint = readSyncHint(ENABLED_NS) ?? {};
      const stored = loadNamespace(ENABLED_NS) ?? {};
      this.enabledMap = { ...hint, ...stored };
      this.registerBootPatches();
      installChunkInterceptor();
    }
    /** Boot sequence. Call once, as early as the renderer allows. */
    async boot() {
      if (this.booted) return;
      this.booted = true;
      this.prepare();
      this.enabledMap = loadNamespace(ENABLED_NS) ?? {};
      writeSyncHint(ENABLED_NS, this.enabledMap);
      for (const { plugin } of this.records.values()) {
        plugin.settings?.__bind(plugin.id);
      }
      this.registerBootPatches();
      await awaitCoreReady();
      for (const id of this.startOrder()) {
        if (this.shouldRun(id)) this.startPlugin(id);
      }
      this.emit();
      const build = true ? "2026-08-31 14:26:25" : "dev";
      log3.info(`runtime up \u2014 ${this.runningCount()} plugin(s) active (build ${build})`);
    }
    isEnabled(id) {
      const rec = this.records.get(id);
      if (!rec) return false;
      if (rec.plugin.required) return true;
      return this.enabledMap[id] === true;
    }
    enable(id) {
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
    disable(id) {
      const rec = this.records.get(id);
      if (!rec) return;
      if (rec.plugin.required) {
        log3.warn(`"${id}" is required and cannot be disabled`);
        return;
      }
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
    toggle(id) {
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
    needsRestart(id) {
      const rec = this.records.get(id);
      if (!rec?.plugin.patches?.length) return false;
      return this.isEnabled(id) !== this.bootPatched.has(id);
    }
    getPlugin(id) {
      return this.records.get(id)?.plugin;
    }
    list() {
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
    onChange(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    // --- internals -----------------------------------------------------------
    shouldRun(id) {
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
    registerBootPatches() {
      for (const { plugin } of this.records.values()) {
        if (this.shouldRun(plugin.id) && plugin.patches?.length && !this.bootPatched.has(plugin.id)) {
          this.registerPatches(plugin);
          this.bootPatched.add(plugin.id);
        }
      }
    }
    registerPatches(plugin) {
      for (const spec of plugin.patches ?? []) {
        const replacements = Array.isArray(spec.replacement) ? spec.replacement : [spec.replacement];
        replacements.forEach((r, i) => {
          registerSourcePatch({
            pluginId: plugin.id,
            label: spec.label,
            find: spec.find,
            match: r.match,
            replace: r.replace,
            all: spec.all ?? false,
            // 1-based position within the spec, so the boot report can name the
            // exact replacement that missed instead of reporting the whole spec
            // as applied because a sibling landed.
            index: i + 1,
            count: replacements.length,
            optional: spec.optional ?? false
          });
        });
      }
    }
    startPlugin(id) {
      const rec = this.records.get(id);
      if (!rec || rec.state === "running" || rec.state === "starting") return;
      rec.state = "starting";
      try {
        rec.plugin.start?.();
        rec.state = "running";
        rec.error = void 0;
        log3.debug(`started "${id}"`);
      } catch (err) {
        rec.state = "errored";
        rec.error = err;
        this.enabledMap[id] = false;
        this.persistEnabledState();
        log3.error(`plugin "${id}" threw during start; it has been disabled`, err);
      }
      this.emit();
    }
    stopPlugin(id) {
      const rec = this.records.get(id);
      if (!rec || rec.state !== "running" && rec.state !== "errored") return;
      rec.state = "stopping";
      try {
        rec.plugin.stop?.();
        log3.debug(`stopped "${id}"`);
      } catch (err) {
        log3.error(`plugin "${id}" threw during stop; state may be inconsistent`, err);
      } finally {
        rec.state = "disabled";
        this.emit();
      }
    }
    /** Topological order over dependencies so a plugin starts after its deps. */
    startOrder() {
      const ordered = [];
      const seen = /* @__PURE__ */ new Set();
      const visit = (id, trail) => {
        if (seen.has(id)) return;
        if (trail.has(id)) {
          log3.error(`dependency cycle involving "${id}"; breaking it`);
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
      for (const id of this.records.keys()) visit(id, /* @__PURE__ */ new Set());
      return ordered;
    }
    runningCount() {
      let n = 0;
      for (const rec of this.records.values()) if (rec.state === "running") n++;
      return n;
    }
    persistEnabledState() {
      saveNamespace(ENABLED_NS, this.enabledMap);
      writeSyncHint(ENABLED_NS, this.enabledMap);
    }
    emit() {
      for (const fn of this.listeners) {
        try {
          fn();
        } catch {
        }
      }
    }
  };
  var runtime = new Runtime();

  // src/core/plugin.ts
  var BRAND = Symbol.for("halcyon.plugin");
  var ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  function definePlugin(definition) {
    if (!ID_PATTERN.test(definition.id)) {
      throw new Error(
        `Halcyon: invalid plugin id "${definition.id}" \u2014 use lowercase words separated by single dashes.`
      );
    }
    if (!definition.authors?.length) {
      throw new Error(`Halcyon: plugin "${definition.id}" must list at least one author.`);
    }
    return Object.assign(definition, { [BRAND]: true });
  }

  // src/ui/tokens.css
  var tokens_default = '/*\n * Design tokens.\n *\n * Every color, size, radius, and duration used anywhere in Halcyon resolves to\n * one of these variables. Components never hardcode raw values. The palette is\n * flat by design: solid fills only, no gradients.\n *\n * Values mirror docs/ui-design-guide.md. If the two ever disagree, the guide\n * is the source of truth and this file is the bug.\n */\n\n.halcyon {\n  /* Accent */\n  --hc-accent: #0a84ff;\n  --hc-accent-pressed: #0768cc;\n\n  /* Semantic */\n  --hc-red: #ff453a;\n  --hc-orange: #ff9f0a;\n  --hc-yellow: #ffd60a;\n  --hc-green: #30d158;\n  --hc-teal: #64d2ff;\n  --hc-indigo: #5e5ce6;\n  --hc-pink: #ff375f;\n\n  /* Neutral surfaces */\n  --hc-bg-primary: #000000;\n  --hc-bg-secondary: #1c1c1e;\n  --hc-bg-tertiary: #2c2c2e;\n  --hc-bg-elevated: #2c2c2e;\n\n  /* Fills */\n  --hc-fill-primary: rgba(120, 120, 128, 0.36);\n  --hc-fill-secondary: rgba(120, 120, 128, 0.24);\n\n  /* Separators */\n  --hc-separator: rgba(84, 84, 88, 0.65);\n  --hc-separator-opaque: #38383a;\n\n  /* Labels */\n  --hc-label-primary: #ffffff;\n  --hc-label-secondary: rgba(235, 235, 245, 0.6);\n  --hc-label-tertiary: rgba(235, 235, 245, 0.3);\n  --hc-label-quaternary: rgba(235, 235, 245, 0.16);\n\n  /* Spacing (8pt grid) */\n  --hc-space-1: 4px;\n  --hc-space-2: 8px;\n  --hc-space-3: 12px;\n  --hc-space-4: 16px;\n  --hc-space-5: 20px;\n  --hc-space-6: 24px;\n  --hc-space-8: 32px;\n  --hc-space-10: 40px;\n\n  /* Radii */\n  --hc-radius-xs: 4px;\n  --hc-radius-sm: 6px;\n  --hc-radius-md: 10px;\n  --hc-radius-lg: 12px;\n  --hc-radius-xl: 16px;\n  --hc-radius-2xl: 22px;\n  --hc-radius-pill: 999px;\n\n  /* Elevation */\n  --hc-elev-1: 0 1px 2px rgba(0, 0, 0, 0.24);\n  --hc-elev-2: 0 4px 12px rgba(0, 0, 0, 0.32);\n  --hc-elev-3: 0 12px 32px rgba(0, 0, 0, 0.44);\n\n  /* Type scale \u2014 sizes paired with absolute line heights */\n  --hc-text-title1: 28px;\n  --hc-lh-title1: 34px;\n  --hc-text-title2: 22px;\n  --hc-lh-title2: 28px;\n  --hc-text-title3: 20px;\n  --hc-lh-title3: 25px;\n  --hc-text-headline: 17px;\n  --hc-lh-headline: 22px;\n  --hc-text-body: 17px;\n  --hc-lh-body: 22px;\n  --hc-text-callout: 16px;\n  --hc-lh-callout: 21px;\n  --hc-text-subhead: 15px;\n  --hc-lh-subhead: 20px;\n  --hc-text-footnote: 13px;\n  --hc-lh-footnote: 18px;\n  --hc-text-caption1: 12px;\n  --hc-lh-caption1: 16px;\n  --hc-text-caption2: 11px;\n  --hc-lh-caption2: 13px;\n\n  /* Motion */\n  --hc-ease: cubic-bezier(0.32, 0.72, 0, 1);\n  --hc-duration-fast: 200ms;\n  --hc-duration-slow: 300ms;\n\n  /* Font stack */\n  --hc-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",\n    "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;\n  --hc-font-mono: "SF Mono", ui-monospace, "JetBrains Mono", "Cascadia Code",\n    Menlo, Consolas, monospace;\n}\n';

  // src/ui/components.css
  var components_default = `/*
 * Component styles.
 *
 * Class-based, scoped under \`.halcyon\`. All values reference tokens.css; there
 * are no raw colors or sizes here. Interaction states use flat fills and
 * opacity, never gradients.
 */

.halcyon,
.halcyon * {
  box-sizing: border-box;
}

.halcyon {
  font-family: var(--hc-font);
  color: var(--hc-label-primary);
  -webkit-font-smoothing: antialiased;
}

/* --- Typographic helpers ------------------------------------------------- */

.hc-title2 {
  font-size: var(--hc-text-title2);
  line-height: var(--hc-lh-title2);
  font-weight: 700;
}

.hc-title3 {
  font-size: var(--hc-text-title3);
  line-height: var(--hc-lh-title3);
  font-weight: 600;
}

.hc-headline {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
}

.hc-body {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  font-weight: 400;
}

.hc-callout {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
}

.hc-footnote {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-muted {
  color: var(--hc-label-secondary);
}

/* --- Button -------------------------------------------------------------- */

.hc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--hc-space-2);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  font-weight: 600;
  border-radius: var(--hc-radius-md);
  padding: 0 var(--hc-space-4);
  height: 40px;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    opacity var(--hc-duration-fast) var(--hc-ease),
    transform var(--hc-duration-fast) var(--hc-ease);
  user-select: none;
  white-space: nowrap;
}

.hc-btn:active {
  transform: scale(0.98);
}

.hc-btn:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
}

.hc-btn--sm {
  height: 32px;
  font-size: var(--hc-text-subhead);
  padding: 0 var(--hc-space-3);
}

.hc-btn--lg {
  height: 50px;
  border-radius: var(--hc-radius-lg);
}

.hc-btn--primary {
  background: var(--hc-accent);
  color: #ffffff;
}

.hc-btn--primary:hover:not(:disabled) {
  background: var(--hc-accent-pressed);
}

.hc-btn--secondary {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

.hc-btn--secondary:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-btn--plain {
  background: transparent;
  color: var(--hc-accent);
  padding-left: var(--hc-space-2);
  padding-right: var(--hc-space-2);
}

.hc-btn--plain:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-btn--destructive {
  background: transparent;
  color: var(--hc-red);
}

.hc-btn--destructive:hover:not(:disabled) {
  background: rgba(255, 69, 58, 0.16);
}

/* --- Toggle -------------------------------------------------------------- */

.hc-toggle {
  position: relative;
  flex: none;
  width: 51px;
  height: 31px;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-secondary);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-toggle[data-on="true"] {
  background: var(--hc-green);
}

.hc-toggle:disabled {
  opacity: 0.4;
  cursor: default;
}

.hc-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: var(--hc-elev-1);
  transition: transform var(--hc-duration-fast) var(--hc-ease);
}

.hc-toggle[data-on="true"] .hc-toggle__knob {
  transform: translateX(20px);
}

/* --- Section ------------------------------------------------------------- */

.hc-section {
  margin-top: var(--hc-space-6);
}

.hc-section:first-child {
  margin-top: 0;
}

.hc-section__title {
  font-size: var(--hc-text-subhead);
  line-height: var(--hc-lh-subhead);
  color: var(--hc-label-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 var(--hc-space-4);
  margin-bottom: var(--hc-space-2);
}

.hc-section__body {
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  overflow: hidden;
}

.hc-section__note {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
  padding: var(--hc-space-2) var(--hc-space-4) 0;
}

/* --- List row ------------------------------------------------------------ */

.hc-row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  min-height: 44px;
  padding: var(--hc-space-2) var(--hc-space-4);
  position: relative;
}

.hc-row + .hc-row::before {
  content: "";
  position: absolute;
  top: 0;
  left: 56px;
  right: 0;
  height: 1px;
  background: var(--hc-separator);
  transform: scaleY(0.5);
}

.hc-row--button {
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-row--button:hover {
  background: var(--hc-fill-secondary);
}

.hc-row--button:active {
  background: var(--hc-fill-primary);
}

.hc-row__icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--hc-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.hc-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-row__title {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-row__subtitle {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-row__accessory {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  color: var(--hc-label-secondary);
}

.hc-row__chevron {
  color: var(--hc-label-tertiary);
}

/* --- Text input ---------------------------------------------------------- */

.hc-input {
  display: block;
  width: 100%;
  height: 40px;
  background: var(--hc-fill-primary);
  border: 2px solid transparent;
  border-radius: var(--hc-radius-md);
  padding: 0 var(--hc-space-3);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  outline: none;
  transition: border-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-input::placeholder {
  color: var(--hc-label-tertiary);
}

.hc-input:focus {
  border-color: var(--hc-accent);
}

/* --- Number stepper ------------------------------------------------------ */

.hc-stepper {
  display: inline-flex;
  align-items: center;
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  overflow: hidden;
}

.hc-stepper__btn {
  width: 36px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--hc-label-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-stepper__btn:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-stepper__btn:disabled {
  color: var(--hc-label-quaternary);
  cursor: default;
}

.hc-stepper__value {
  min-width: 44px;
  text-align: center;
  font-size: var(--hc-text-callout);
  font-variant-numeric: tabular-nums;
  color: var(--hc-label-primary);
}

/* --- Select -------------------------------------------------------------- */

/* Self-drawn dropdown: pill button + floating iOS-style menu sheet. */
.hc-select {
  position: relative;
  display: inline-block;
}

.hc-select__button {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 32px;
  background: var(--hc-fill-primary);
  border: none;
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  padding: 0 var(--hc-space-3);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
}

.hc-select__button:hover {
  background: var(--hc-fill-secondary);
}

.hc-select__button:focus-visible {
  box-shadow: 0 0 0 2px var(--hc-accent);
}

.hc-select__chevron {
  color: var(--hc-label-tertiary);
  transition: transform 0.15s ease;
}

.hc-select__chevron[data-open="true"] {
  transform: rotate(180deg);
}

.hc-select__menu {
  /* Positioned by its portal wrapper (fixed, anchored to the button). */
  max-height: 280px;
  overflow-y: auto;
  padding: var(--hc-space-1);
  background: var(--hc-bg-elevated, #2c2c2e);
  border-radius: var(--hc-radius-lg, 12px);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    0 10px 32px rgba(0, 0, 0, 0.45);
  animation: hc-select-pop 0.14s ease;
}

@keyframes hc-select-pop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hc-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-3);
  width: 100%;
  border: none;
  background: none;
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  text-align: left;
  padding: 7px var(--hc-space-3);
  cursor: pointer;
  white-space: nowrap;
}

.hc-select__option[data-active="true"] {
  background: var(--hc-fill-primary);
}

.hc-select__option[data-selected="true"] {
  color: var(--hc-accent);
}

.hc-select__check {
  flex: none;
  color: var(--hc-accent);
}

/* --- String list --------------------------------------------------------- */

.hc-strlist {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-4) var(--hc-space-3);
}

.hc-strlist__item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
}

.hc-strlist__add {
  display: flex;
  gap: var(--hc-space-2);
}

.hc-iconbtn {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--hc-radius-md);
  border: none;
  background: var(--hc-fill-primary);
  color: var(--hc-label-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-iconbtn:hover {
  background: var(--hc-fill-secondary);
}

.hc-iconbtn--danger:hover {
  color: var(--hc-red);
}

/* --- Badge --------------------------------------------------------------- */

.hc-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--hc-space-2);
  border-radius: var(--hc-radius-pill);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption1);
  font-weight: 600;
}

.hc-badge[data-tone="neutral"] {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
}

.hc-badge[data-tone="accent"] {
  background: rgba(10, 132, 255, 0.2);
  color: var(--hc-accent);
}

.hc-badge[data-tone="green"] {
  background: rgba(48, 209, 88, 0.2);
  color: var(--hc-green);
}

.hc-badge[data-tone="red"] {
  background: rgba(255, 69, 58, 0.2);
  color: var(--hc-red);
}

.hc-badge[data-tone="orange"] {
  background: rgba(255, 159, 10, 0.2);
  color: var(--hc-orange);
}

/* --- Empty state --------------------------------------------------------- */

.hc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--hc-space-10) var(--hc-space-6);
  color: var(--hc-label-tertiary);
}

.hc-empty__title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-secondary);
  margin-top: var(--hc-space-4);
}

.hc-empty__subtitle {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-tertiary);
  margin-top: var(--hc-space-2);
  max-width: 320px;
}

/* --- Overlay + panel (fallback entry point) ------------------------------ */

.hc-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  animation: hc-fade var(--hc-duration-slow) var(--hc-ease);
}

.hc-panel {
  width: min(900px, 92vw);
  height: min(720px, 88vh);
  background: var(--hc-bg-primary);
  border-radius: var(--hc-radius-xl);
  box-shadow: var(--hc-elev-3);
  display: flex;
  overflow: hidden;
  animation: hc-rise var(--hc-duration-slow) var(--hc-ease);
}

.hc-panel__sidebar {
  width: 220px;
  flex: none;
  background: var(--hc-bg-secondary);
  border-right: 1px solid var(--hc-separator-opaque);
  padding: var(--hc-space-4) var(--hc-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-panel__brand {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-3) var(--hc-space-4);
  color: var(--hc-label-primary);
}

.hc-panel__brand-name {
  font-size: var(--hc-text-headline);
  font-weight: 700;
}

.hc-navitem {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-secondary);
  cursor: pointer;
  font-size: var(--hc-text-callout);
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-navitem:hover {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-primary);
}

.hc-navitem[data-active="true"] {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

.hc-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hc-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--hc-space-5) var(--hc-space-6) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator-opaque);
}

.hc-panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--hc-space-5) var(--hc-space-6) var(--hc-space-8);
}

.hc-embed {
  /* When embedded in Discord's own settings pane rather than the overlay. */
  padding: var(--hc-space-2) 0 var(--hc-space-8);
}

@keyframes hc-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes hc-rise {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Respect the OS "reduce motion" preference. */
@media (prefers-reduced-motion: reduce) {
  .hc-overlay,
  .hc-panel,
  .hc-btn,
  .hc-toggle__knob {
    animation: none;
    transition: none;
  }
}

/* --- Setting cells (schema-driven form) ---------------------------------- */

.hc-cell {
  padding: var(--hc-space-2) var(--hc-space-4);
  position: relative;
}

.hc-cell + .hc-cell::before {
  content: "";
  position: absolute;
  top: 0;
  left: var(--hc-space-4);
  right: 0;
  height: 1px;
  background: var(--hc-separator);
  transform: scaleY(0.5);
}

.hc-cell--row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  min-height: 44px;
}

.hc-cell__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-cell__label {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  color: var(--hc-label-primary);
}

.hc-cell__desc {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-cell__control {
  flex: none;
}

.hc-cell__stacked {
  padding-top: var(--hc-space-2);
}

/* --- Toolbar (search + actions) ------------------------------------------ */

.hc-toolbar {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  margin-bottom: var(--hc-space-4);
}

/* --- Server-rail button (injected under Discord's home/DM button) -------- */
/* Styled to read as a native rail icon: a 48px rounded square (not a circle)
   like Discord's own home button, on the same graphite fill, with a muted grey
   glyph. On hover it snaps to the brand color and squares off a touch \u2014 exactly
   how Discord's guild pills animate \u2014 so it belongs in the rail instead of
   standing out as a bright foreign blob. */
.hc-rail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 0;
}

.hc-rail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: #000;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  border-radius: 16px;
  transition: border-radius var(--hc-duration-fast) var(--hc-ease),
    background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-rail-btn:hover {
  border-radius: 14px;
  background: var(--brand-experiment, var(--hc-accent, #5865f2));
  color: #fff;
}

.hc-rail-btn:active {
  border-radius: 12px;
}

.hc-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 36px;
  padding: 0 var(--hc-space-3);
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-tertiary);
}

.hc-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
}

.hc-search input::placeholder {
  color: var(--hc-label-tertiary);
}

/* --- Plugin detail header ------------------------------------------------ */

.hc-back {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-1);
  background: transparent;
  border: none;
  color: var(--hc-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-callout);
  padding: var(--hc-space-1) var(--hc-space-1) var(--hc-space-1) 0;
  margin-bottom: var(--hc-space-4);
}

.hc-detail-head {
  display: flex;
  align-items: flex-start;
  gap: var(--hc-space-3);
  margin-bottom: var(--hc-space-5);
}

.hc-detail-head__icon {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--hc-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.hc-detail-head__text {
  flex: 1;
  min-width: 0;
}

.hc-detail-head__name {
  font-size: var(--hc-text-title3);
  line-height: var(--hc-lh-title3);
  font-weight: 600;
}

.hc-detail-head__desc {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-secondary);
  margin-top: 2px;
}

.hc-detail-head__meta {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-tertiary);
  margin-top: var(--hc-space-2);
}

/* --- Log viewer ---------------------------------------------------------- */

.hc-logs {
  font-family: var(--hc-font-mono);
  font-size: var(--hc-text-footnote);
  line-height: 1.7;
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  padding: var(--hc-space-3);
  overflow-x: auto;
}

.hc-logline {
  display: flex;
  gap: var(--hc-space-2);
  white-space: pre;
  padding: 1px 0;
}

.hc-logline__time {
  color: var(--hc-label-tertiary);
  flex: none;
}

.hc-logline__scope {
  color: var(--hc-label-secondary);
  flex: none;
}

.hc-logline__msg {
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.hc-logline[data-level="warn"] .hc-logline__msg {
  color: var(--hc-orange);
}

.hc-logline[data-level="error"] .hc-logline__msg {
  color: var(--hc-red);
}

.hc-logline[data-level="debug"] .hc-logline__msg {
  color: var(--hc-label-secondary);
}

/* --- About --------------------------------------------------------------- */

.hc-about__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hc-about__value {
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
}

/* --- Generic vertical rhythm --------------------------------------------- */

.hc-stack > * + * {
  margin-top: var(--hc-space-4);
}

.hc-inline-note {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  color: var(--hc-orange);
  font-size: var(--hc-text-footnote);
}

.hc-inline-note--danger {
  color: var(--hc-red);
}

/* --- Detail head toggle stays top-aligned with the icon ------------------ */

.hc-detail-head > span {
  flex: none;
  padding-top: var(--hc-space-1);
}

/* --- About hero ---------------------------------------------------------- */

.hc-about-hero {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) 0 var(--hc-space-4);
  color: var(--hc-label-primary);
}

.hc-about-hero__name {
  font-size: var(--hc-text-title2);
  line-height: var(--hc-lh-title2);
  font-weight: 700;
}

.hc-about-hero__ver {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

/* --- Tabs (used by plugin pages) ----------------------------------------- */

.hc-tabs {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  margin-bottom: var(--hc-space-4);
}

.hc-tabs__spacer {
  flex: 1;
}

.hc-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 32px;
  padding: 0 var(--hc-space-3);
  border: none;
  border-radius: var(--hc-radius-md);
  background: transparent;
  color: var(--hc-label-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-tab:hover {
  color: var(--hc-label-primary);
}

.hc-tab[data-active="true"] {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

/* --- Save bar --------------------------------------------------------------- */

.hc-savebar {
  position: sticky;
  bottom: var(--hc-space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-4);
  margin-top: var(--hc-space-4);
  padding: var(--hc-space-2) var(--hc-space-2) var(--hc-space-2) var(--hc-space-4);
  background: var(--hc-bg-elevated, #2c2c2e);
  border-radius: var(--hc-radius-lg);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.35);
  animation: hc-select-pop 0.14s ease;
}

.hc-savebar__label {
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-secondary);
}

.hc-savebar__actions {
  display: flex;
  gap: var(--hc-space-2);
  flex: none;
}

/* --- Segmented control ------------------------------------------------------ */

.hc-segment {
  display: flex;
  gap: 2px;
  padding: 2px;
  margin-bottom: var(--hc-space-4);
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  width: fit-content;
}

.hc-segment__item {
  border: none;
  background: transparent;
  color: var(--hc-label-secondary);
  font-family: inherit;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  height: 28px;
  padding: 0 var(--hc-space-4);
  border-radius: calc(var(--hc-radius-md) - 2px);
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-segment__item:hover {
  color: var(--hc-label-primary);
}

.hc-segment__item[data-active="true"] {
  background: var(--hc-bg-elevated, #2c2c2e);
  color: var(--hc-label-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

/* --- Pager ----------------------------------------------------------------- */

.hc-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hc-space-3);
  margin-top: var(--hc-space-4);
}

.hc-pager__label {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 96px;
  text-align: center;
}

.hc-pager .hc-tab:disabled {
  opacity: 0.4;
  cursor: default;
}

/* --- Captured message entries -------------------------------------------- */

.hc-msglist {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-2);
}

.hc-msg {
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-left: 2px solid var(--hc-red);
}

.hc-msg__head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  margin-bottom: var(--hc-space-1);
}

.hc-msg__author {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-msg__where {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

.hc-msg__guild {
  color: var(--hc-label-secondary);
  font-weight: 600;
}

.hc-msg__sep {
  color: var(--hc-label-tertiary);
  margin: 0 4px;
}

.hc-msg__time {
  margin-left: auto;
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* Jump-to-message action, pinned to the right of each row's header. Keeps the
 * header on one line and doesn't steal the space the time claims via
 * margin-left:auto (which already pushes both to the right edge). */
.hc-msg__jump {
  flex: none;
  margin-left: var(--hc-space-2);
}

.hc-msg__body {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.hc-msg__empty {
  color: var(--hc-label-tertiary);
  font-style: italic;
}

.hc-msg__meta {
  margin-top: var(--hc-space-1);
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

/* Attachment thumbnails. Constrained so wide/tall media never spills past the
 * message card \u2014 a single image caps at the content width, and the row wraps
 * when there are several. */
.hc-msg__media {
  display: flex;
  flex-wrap: wrap;
  gap: var(--hc-space-2);
  margin-top: var(--hc-space-2);
  min-width: 0;
}

.hc-msg__media a {
  color: var(--hc-accent);
  font-size: var(--hc-text-footnote);
  word-break: break-all;
}

.hc-msg__thumb {
  max-width: 100%;
  max-height: 240px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--hc-radius-md);
  background: var(--hc-fill-secondary);
}

/* Inline custom emoji, sized to the surrounding text like Discord's own. */
.hc-emoji {
  display: inline-block;
  width: 1.375em;
  height: 1.375em;
  margin: 0 1px;
  object-fit: contain;
  vertical-align: bottom;
}

.hc-msg__versions {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-1);
}

.hc-msg__version {
  display: flex;
  gap: var(--hc-space-2);
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
}

.hc-msg__vtag {
  flex: none;
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
  font-size: var(--hc-text-footnote);
  padding-top: 2px;
}

.hc-msg__vbody {
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* The \`edited\` tone reuses the orange rule via a modifier. */
.hc-msg--edited {
  border-left-color: var(--hc-orange);
}

/* --- message-logger status banner ---------------------------------------- *
 * A compact warning on the log page, shown only when at least one of the
 * plugin's source patches failed to match the running Discord build. Inside
 * the .halcyon overlay/embed, so tokens are used throughout. Amber tone: the
 * feature isn't broken \u2014 records still land in the list below \u2014 but the
 * in-chat red row is off, and this is the only place a non-console user will
 * see that. */
.hc-mlog-warn {
  border: 1px solid rgba(224, 165, 63, 0.35);
  background: rgba(224, 165, 63, 0.08);
  border-radius: var(--hc-radius-md);
  padding: var(--hc-space-3) var(--hc-space-4);
  margin: var(--hc-space-3) 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hc-mlog-warn__title {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: #e0a53f;
}
.hc-mlog-warn__detail {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  line-height: var(--hc-lh-footnote);
}
.hc-mlog-warn__list {
  margin: 2px 0 0;
  padding-left: 18px;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
}

/* --- Deleted message (in-chat) ------------------------------------------- */

/*
 * Applied to Discord's own message row when a deleted message is kept in place.
 * These live outside the .halcyon scope on purpose \u2014 they decorate Discord
 * elements \u2014 so literal values, no tokens.
 *
 * The row itself only carries the stable .hc-deleted hook; the chosen style is
 * a class on <html> (hc-mlog-<style>). Splitting them lets a style change take
 * effect immediately \u2014 swap the root class and every kept message updates \u2014
 * instead of the pick only landing on rows Discord repaints after the change.
 */

/* Style: red tint (default) \u2014 flat red wash + left bar. */
.hc-mlog-tint .hc-deleted {
  background-color: rgba(255, 69, 58, 0.1);
  box-shadow: inset 2px 0 0 #ff453a;
}

/* Style: red text \u2014 content turns red, no background. */
.hc-mlog-text .hc-deleted [class*="messageContent"],
.hc-mlog-text .hc-deleted [class*="contents"] > div:not([class*="header"]) {
  color: #f04747 !important;
}
.hc-mlog-text .hc-deleted [class*="messageContent"] a {
  color: #ff6b6b !important;
}

/* Style: ghost \u2014 the whole row fades. */
.hc-mlog-ghost .hc-deleted {
  opacity: 0.45;
  filter: saturate(0.6);
}

/* Style: strike \u2014 red strikethrough over the text. */
.hc-mlog-strike .hc-deleted [class*="messageContent"] {
  text-decoration: line-through;
  text-decoration-color: rgba(255, 69, 58, 0.7);
  text-decoration-thickness: 1.5px;
}
.hc-mlog-strike .hc-deleted {
  box-shadow: inset 2px 0 0 rgba(255, 69, 58, 0.5);
}

/* "This message was deleted (\u2026)": marker row under the content. One base
 * class plus a look modifier chosen in settings. */
.hc-deleted-marker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 0.8125rem;
  line-height: 1.2;
  color: #f04747;
  user-select: none;
}
.hc-deleted-marker__icon {
  flex: none;
}

/* Look: badge \u2014 pill-shaped chip on its OWN line. It used \`display: inline-flex\`,
 * which let the pill run inline with the message text so the two never wrapped
 * ("\u4E0D\u4F1A\u6362\u884C"). Inheriting the base \`display: flex\` makes it block-level (its own
 * line); \`width: fit-content\` keeps the pill only as wide as its label, and
 * \`max-width: 100%\` stops a long label from overflowing the row. */
.hc-deleted-marker--badge {
  width: fit-content;
  max-width: 100%;
  background: rgba(255, 69, 58, 0.12);
  border-radius: 9999px;
  padding: 2px 10px;
  margin-top: 4px;
}

/* Look: quote \u2014 indented behind a red bar, like a blockquote. */
.hc-deleted-marker--quote {
  border-left: 3px solid rgba(255, 69, 58, 0.7);
  padding-left: 8px;
  margin-top: 4px;
  color: rgba(240, 71, 71, 0.85);
}

/* Tone: edited \u2014 same marker layout, calmer amber so an edit doesn't read as a
 * deletion. Overrides the red the delete marker uses. */
.hc-deleted-marker--edited {
  color: #e0a53f;
}
.hc-deleted-marker--edited.hc-deleted-marker--badge {
  background: rgba(224, 165, 63, 0.14);
}
.hc-deleted-marker--edited.hc-deleted-marker--quote {
  border-left-color: rgba(224, 165, 63, 0.7);
  color: rgba(224, 165, 63, 0.9);
}

/* --- Username next to nickname (show-username plugin) --------------------- */

/*
 * Appended inside Discord's message header, so literal values, no tokens.
 * One base class plus a per-style modifier chosen in the plugin's settings.
 */
.hc-username {
  font-size: 0.75rem;
  font-weight: 500;
  vertical-align: baseline;
}

.hc-username--muted {
  color: var(--text-muted, #949ba4);
}

.hc-username--pill {
  color: var(--text-muted, #949ba4);
  background: rgba(128, 132, 142, 0.16);
  border-radius: 9999px;
  padding: 0 6px;
  line-height: 1.35;
  display: inline-block;
}

.hc-username--at {
  color: #949cf7;
}

.hc-username--paren {
  color: var(--text-muted, #949ba4);
  font-weight: 400;
}

/* --- Inline edit history (in-chat) ---------------------------------------- */

/*
 * Old versions of an edited message, rendered above the current content by the
 * message-logger content patch. Like .hc-deleted this decorates Discord's own
 * DOM, so literal values, no tokens. The base class only handles wrapping; a
 * per-style modifier (chosen in settings) sets the look. MessageExtras re-reads
 * the modifier on every render, so changing the style applies live.
 */
.hc-edit-history__version {
  word-break: break-word;
  white-space: pre-wrap;
}

/* Per-version edit time, shown inline at the end of each old-version line.
 * Muted and compact; opacity keeps it tied to whatever the version style is,
 * and text-decoration:none stops the strike style from striking the time. */
.hc-edit-history__time {
  margin-left: 6px;
  font-size: 0.72em;
  opacity: 0.55;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
  vertical-align: baseline;
}

/* The old-version line mirrors the deleted-message style (tint/text/ghost/
 * strike) so both share one setting; strike stays its natural default look. */

/* Style: red strikethrough \u2014 struck out in red, like removed text. */
.hc-edit-history__version--strike {
  color: rgba(255, 69, 58, 0.75);
  text-decoration: line-through;
  text-decoration-color: rgba(255, 69, 58, 0.4);
}

/* Style: red text \u2014 red, no strikethrough. */
.hc-edit-history__version--text {
  color: rgba(255, 69, 58, 0.85);
}

/* Style: ghost \u2014 faded out, keeps the normal text color. */
.hc-edit-history__version--ghost {
  opacity: 0.45;
  filter: saturate(0.6);
}

/* Style: tint \u2014 red wash + left bar, as a quote-like block on the line. */
.hc-edit-history__version--tint {
  background-color: rgba(255, 69, 58, 0.1);
  box-shadow: inset 2px 0 0 #ff453a;
  padding: 1px 6px 1px 8px;
  border-radius: 3px;
}

/* \u2500\u2500 message-cleaner page \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
 * The self-message cleaner's operate surface. Scope/confirm reuse .hc-section
 * and .hc-cell; these rules cover the action bar, the live status line, the
 * preview list, and the stat readout. Decorates Halcyon's own panel, so every
 * value is a token. */
.hc-cleaner__actions {
  display: flex;
  gap: var(--hc-space-3);
  margin: var(--hc-space-4) 0;
}
.hc-cleaner__actions .hc-btn {
  flex: 1;
}
.hc-cleaner__status {
  margin: var(--hc-space-3) 0;
  padding: var(--hc-space-3) var(--hc-space-4);
  background: var(--hc-fill-secondary);
  border-radius: var(--hc-radius-md);
}
.hc-cleaner__status-state {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-primary);
}
.hc-cleaner__status-detail {
  margin-top: 2px;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  word-break: break-word;
}
.hc-cleaner__list {
  display: flex;
  flex-direction: column;
}
.hc-cleaner__item {
  display: flex;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-4);
  font-size: var(--hc-text-footnote);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__item:last-child {
  border-bottom: none;
}
.hc-cleaner__item-time {
  flex-shrink: 0;
  color: var(--hc-accent);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__item-text {
  color: var(--hc-label-primary);
  word-break: break-word;
}
.hc-cleaner__more {
  padding: var(--hc-space-2) var(--hc-space-4);
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
}
.hc-cleaner__stat {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: var(--hc-space-2);
}
.hc-cleaner__stat-num {
  font-size: var(--hc-text-title1);
  font-weight: 700;
  color: var(--hc-accent);
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__stat-unit {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

/* \u2500\u2500 message-cleaner picker \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hc-cleaner__picker-head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__picker-title {
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-primary);
}
.hc-cleaner__picker-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 360px;
  padding: var(--hc-space-2);
}
.hc-cleaner__picker-item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  color: var(--hc-label-primary);
  transition: background var(--hc-duration-fast) var(--hc-ease);
}
.hc-cleaner__picker-item:hover {
  background: var(--hc-fill-secondary);
}
.hc-cleaner__picker-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--hc-fill-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-secondary);
}
.hc-cleaner__picker-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hc-cleaner__picker-name {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hc-cleaner__picker-empty {
  padding: var(--hc-space-5);
  text-align: center;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-tertiary);
}

/* \u2500\u2500 emote-cloner server picker \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
 * A floating modal (mounted in its own .halcyon host over Discord) shown when
 * "\u590D\u5236\u8868\u60C5/\u8D34\u7EB8\u5230\u670D\u52A1\u5668" is clicked. Sits on the shared .hc-overlay backdrop;
 * the panel is compact, with a search box and a scrollable, icon-bearing list
 * of the servers the account can add expressions to. Decorates Halcyon's own
 * surface, so every value is a token. */
.hc-emote-picker {
  width: min(440px, 92vw);
  max-height: min(560px, 82vh);
  background: var(--hc-bg-primary);
  border-radius: var(--hc-radius-xl);
  box-shadow: var(--hc-elev-3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: hc-rise var(--hc-duration-slow) var(--hc-ease);
}

.hc-emote-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-3);
  padding: var(--hc-space-4) var(--hc-space-4) var(--hc-space-3);
  border-bottom: 1px solid var(--hc-separator-opaque);
}

.hc-emote-picker__title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-emote-picker__close {
  flex: none;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--hc-label-secondary);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-emote-picker__close:hover {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-primary);
}

.hc-emote-picker__search {
  padding: var(--hc-space-3) var(--hc-space-4) var(--hc-space-2);
}

.hc-emote-picker__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--hc-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-emote-picker__item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-emote-picker__item:hover {
  background: var(--hc-fill-secondary);
}

.hc-emote-picker__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--hc-fill-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-secondary);
}

.hc-emote-picker__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hc-emote-picker__name {
  flex: 1;
  min-width: 0;
  font-size: var(--hc-text-body);
  font-weight: 500;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-emote-picker__empty {
  padding: var(--hc-space-8) var(--hc-space-6);
  text-align: center;
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-footnote);
}

/* Thin, subtle scrollbar for the picker list. Our overlay mounts in its own
 * .halcyon host, which Discord's global scrollbar styling doesn't reach, so
 * without this the list falls back to the chunky default OS scrollbar. */
.hc-emote-picker__list::-webkit-scrollbar {
  width: 8px;
}

.hc-emote-picker__list::-webkit-scrollbar-track {
  background: transparent;
}

.hc-emote-picker__list::-webkit-scrollbar-thumb {
  background: var(--hc-fill-secondary);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.hc-emote-picker__list::-webkit-scrollbar-thumb:hover {
  background: var(--hc-label-tertiary);
  background-clip: padding-box;
}

/* Post-pick status view (copying / done / error), shown in place of the list
 * so a clone never looks like "nothing happened" even when the toast module
 * isn't present on this build. */
.hc-emote-picker__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-8) var(--hc-space-6);
}

.hc-emote-picker__status-icon {
  font-size: 32px;
  line-height: 1;
}

.hc-emote-picker__status[data-state="done"] .hc-emote-picker__status-icon {
  color: var(--hc-green);
}

.hc-emote-picker__status[data-state="error"] .hc-emote-picker__status-icon {
  color: var(--hc-red);
}

.hc-emote-picker__status-title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-emote-picker__status-detail {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
  max-width: 340px;
  word-break: break-word;
}

/* --- Quest indicator badge ------------------------------------------------ */
/* Small count badge on the quest rail button. Positioned at top-right, styled
   to match Discord's own notification badges. */
.hc-quest-btn {
  position: relative;
}

.hc-quest-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ed4245;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 3px var(--background-tertiary, #1e1f22);
}

/* --- Member count chip (member-count plugin) ------------------------------ */
/*
 * Inserted into Discord's channel header toolbar or above its member list, so
 * literal values and Discord's own CSS variables \u2014 the \`--hc-*\` tokens are
 * scoped to \`.halcyon\` and do not reach this far into the client's tree.
 * The host is inert: an empty chip (a DM, or a guild with no numbers yet)
 * occupies nothing.
 */
.hc-membercount-host {
  display: contents;
}
.hc-membercount {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  margin-right: 8px;
  border-radius: 8px;
  background: rgba(128, 132, 142, 0.12);
  color: var(--interactive-normal, #b5bac1);
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  cursor: default;
  user-select: none;
}
.hc-membercount__icon {
  flex: 0 0 auto;
  opacity: 0.75;
}
.hc-membercount__part {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.hc-membercount__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #23a55a;
}
.hc-membercount__label {
  color: var(--text-muted, #949ba4);
  font-weight: 400;
}
.hc-membercount__value {
  font-variant-numeric: tabular-nums;
}
.hc-membercount__sep {
  color: var(--text-muted, #949ba4);
  opacity: 0.6;
}
/* Above the member list, the chip sits inside the scroller (before the first
 * group header), so it flows as a natural roster line rather than floating in
 * empty space above everything. Layout is the same pill as the header variant;
 * only the outer margin changes so it doesn't hug the aside's edge. */
.hc-membercount--list {
  margin: 8px 12px 4px;
}

/* --- Reactor list card (who-reacted plugin) ------------------------------- */
/*
 * Our own floating surface on document.body, hosted inside a \`.halcyon\`
 * element, so this one does use the design tokens. Non-interactive by design:
 * pointer-events stay off so the card can never eat the click that toggles a
 * reaction.
 */
.hc-whoreacted-host {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 4000;
  pointer-events: none;
}
.hc-whoreacted {
  min-width: 180px;
  max-width: 280px;
  padding: var(--hc-space-2) 0;
  border-radius: var(--hc-radius-md);
  background: var(--hc-bg-elevated);
  box-shadow: var(--hc-elev-2);
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
}
.hc-whoreacted__head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-1) var(--hc-space-3) var(--hc-space-2);
  border-bottom: 1px solid var(--hc-separator);
  margin-bottom: var(--hc-space-2);
}
.hc-whoreacted__emoji-img {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.hc-whoreacted__emoji-char {
  flex: 0 0 auto;
  font-size: 16px;
  line-height: 18px;
}
.hc-whoreacted__title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-whoreacted__count {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
  font-size: var(--hc-text-caption2);
  font-variant-numeric: tabular-nums;
}
.hc-whoreacted__hint {
  padding: var(--hc-space-1) var(--hc-space-3) var(--hc-space-2);
  color: var(--hc-label-secondary);
}
.hc-whoreacted__hint--error {
  color: var(--hc-red);
}
.hc-whoreacted__list {
  max-height: 260px;
  overflow: hidden;
}
.hc-whoreacted__row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: 3px var(--hc-space-3);
}
.hc-whoreacted__avatar {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}
.hc-whoreacted__name {
  flex: 1;
  min-width: 0;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-whoreacted__tag {
  flex: 0 0 auto;
  padding: 0 4px;
  border-radius: var(--hc-radius-xs);
  background: var(--hc-accent);
  color: #fff;
  font-size: var(--hc-text-caption2);
  font-weight: 600;
  line-height: 14px;
}
.hc-whoreacted__id {
  flex: 0 0 auto;
  color: var(--hc-label-tertiary);
  font-family: var(--hc-font-mono);
  font-size: var(--hc-text-caption2);
}
.hc-whoreacted__more {
  padding: var(--hc-space-1) var(--hc-space-3) 0;
  color: var(--hc-label-tertiary);
}

/* --- Platform indicators (platform-indicators plugin) --------------------- */
/*
 * Inline glyphs appended inside Discord's message header and member rows, so
 * literal values, no tokens. \`vertical-align: middle\` keeps them on the name's
 * baseline; the status colors match Discord's own presence dots.
 */
.hc-platform-host {
  display: inline;
}
.hc-platform {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 5px;
  vertical-align: middle;
}
.hc-platform__item {
  display: inline-flex;
  align-items: center;
}
.hc-platform__item--online {
  color: #23a55a;
}
.hc-platform__item--idle {
  color: #f0b232;
}
.hc-platform__item--dnd {
  color: #f23f43;
}
.hc-platform__item--offline,
.hc-platform__item--muted {
  color: var(--text-muted, #949ba4);
}




/* --- Inline reactor avatars (who-reacted plugin) -------------------------- */
/*
 * Reactor faces inside every reaction pill \u2014 the primary surface. Meant to
 * blend with Discord's own count layout: same vertical center, small enough
 * that a pill with 3 avatars is only a little wider than one without, and no
 * background of our own so the pill's own tint (blue for reactionMe, grey
 * otherwise) shows through.
 *
 * Attached inside \`.reactionInner__\u2026\` as its last child. Sits after the count
 * with a small margin, so it reads as an appended detail rather than a
 * standalone widget.
 */
.hc-inline-reactors {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  gap: 0;
  line-height: 1;
  /* Not interactive: this must never eat the click that toggles your own
   * reaction on the pill it's inside. */
  pointer-events: none;
}
.hc-inline-reactors__avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
  /* A slim rim in the pill's background color visually separates overlapping
   * avatars from each other without adding a foreign block color. */
  border: 1.5px solid var(--background-secondary, #2b2d31);
  background: var(--background-tertiary, #1e1f22);
  /* Overlap each next avatar over the previous one; the first stands alone. */
  margin-left: -4px;
}
.hc-inline-reactors__avatar:first-child {
  margin-left: 0;
}
.hc-inline-reactors__more {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--interactive-normal, #b5bac1);
  font-variant-numeric: tabular-nums;
}
/* When the pill is the "I reacted" variant Discord tints the whole pill blue,
 * so switch the avatar rim to that darker inner tone (approximation \u2014 no exact
 * token exists for the "reactionMe" background) so avatars don't rim in a
 * conflicting color. Falls back to the default rim on builds without that
 * class. */
[class*="reactionMe"] .hc-inline-reactors__avatar {
  border-color: rgba(88, 101, 242, 0.35);
}


/* --- Recovered media on a deleted message (message-logger, in-chat) ------- */
/*
 * Discord strips a deleted message's attachments/embeds from its render, so we
 * paint the recovered thumbnails back in beneath the "\u6B64\u6D88\u606F\u5DF2\u5220\u9664" marker. Sits
 * inside Discord's own message row, so literal values, no tokens.
 */
.hc-deleted-media {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.hc-deleted-media__thumb {
  max-width: 240px;
  max-height: 200px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}
.hc-deleted-media__file {
  color: #00a8fc;
  font-size: 0.8125rem;
  word-break: break-all;
}


/* --- Message-log button in the channel header toolbar -------------------- */
/*
 * Sits among Discord's own header icons (pin, members, \u2026), so it must read as
 * one of them: same 24px hit target, muted normal color, brighter on hover.
 * Decorates Discord's toolbar, so literal values + Discord CSS variables.
 */
.hc-mlog-toolbtn-host {
  display: inline-flex;
  align-items: center;
}
.hc-mlog-toolbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  transition: color 0.15s ease;
}
.hc-mlog-toolbtn:hover {
  color: var(--interactive-hover, #dbdee1);
}
.hc-mlog-toolbtn:active {
  color: var(--interactive-active, #fff);
}


/* --- Message-log search box ---------------------------------------------- */
/* Inside the .halcyon panel, so design tokens throughout. Mirrors the plugin
 * browser's search field but on its own row above the list. */
.hc-mlog-search {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 36px;
  margin: var(--hc-space-2) 0 var(--hc-space-3);
  padding: 0 var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
}
.hc-mlog-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--hc-label-primary);
  font-size: var(--hc-text-callout);
  font-family: var(--hc-font);
}
.hc-mlog-search input::placeholder {
  color: var(--hc-label-tertiary);
}
.hc-mlog-search__clear {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-primary);
  color: var(--hc-label-secondary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.hc-mlog-search__clear:hover {
  color: var(--hc-label-primary);
}

/* --- Thin scrollbars for Halcyon's own scroll areas ---------------------- */
/*
 * The settings panel and embedded views scroll with the OS default scrollbar,
 * which is a chunky light bar that reads as foreign inside the dark iOS-styled
 * panel. Give those containers the same slim, self-colored bar the emote picker
 * uses. Our surfaces mount in their own .halcyon host, outside Discord's global
 * scrollbar styling, so these rules are needed here.
 */
.hc-panel__scroll,
.hc-embed,
.hc-msglist {
  scrollbar-width: thin;
  scrollbar-color: var(--hc-fill-primary) transparent;
}
.hc-panel__scroll::-webkit-scrollbar,
.hc-embed::-webkit-scrollbar,
.hc-msglist::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.hc-panel__scroll::-webkit-scrollbar-track,
.hc-embed::-webkit-scrollbar-track,
.hc-msglist::-webkit-scrollbar-track {
  background: transparent;
}
.hc-panel__scroll::-webkit-scrollbar-thumb,
.hc-embed::-webkit-scrollbar-thumb,
.hc-msglist::-webkit-scrollbar-thumb {
  background: var(--hc-fill-secondary);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.hc-panel__scroll::-webkit-scrollbar-thumb:hover,
.hc-embed::-webkit-scrollbar-thumb:hover,
.hc-msglist::-webkit-scrollbar-thumb:hover {
  background: var(--hc-label-tertiary);
  background-clip: padding-box;
}
`;

  // src/ui/inject-styles.ts
  var STYLE_ID = "halcyon-styles";
  var mounted = false;
  function injectStyles() {
    if (mounted) return;
    const existing = document.getElementById(STYLE_ID);
    const style = existing instanceof HTMLStyleElement ? existing : document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `${tokens_default}
${components_default}`;
    if (!existing) {
      document.head.appendChild(style);
    }
    mounted = true;
  }

  // src/icons/index.tsx
  function Glyph({ size = 20, className, filled, children, ...rest }) {
    const label = rest["aria-label"];
    if (typeof size !== "number" || !Number.isFinite(size)) size = 20;
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        className,
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: filled ? "currentColor" : "none",
        stroke: filled ? "none" : "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        role: label ? "img" : void 0,
        "aria-label": label,
        "aria-hidden": label ? void 0 : true
      },
      children
    );
  }
  function HalcyonMark(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("rect", { x: "3.25", y: "3.25", width: "17.5", height: "17.5", rx: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5" }));
  }
  function ChevronRightIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M9 6l6 6-6 6" }));
  }
  function ClockIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.25" }), /* @__PURE__ */ React.createElement("path", { d: "M12 7.5V12l3 2" }));
  }
  function TrashIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 7h15" }), /* @__PURE__ */ React.createElement("path", { d: "M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7" }), /* @__PURE__ */ React.createElement("path", { d: "M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7" }), /* @__PURE__ */ React.createElement("path", { d: "M10 11v5.5M14 11v5.5" }));
  }
  function PencilIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M13.5 6.5l4 4" }), /* @__PURE__ */ React.createElement("path", { d: "M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z" }));
  }
  function ShieldIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z" }), /* @__PURE__ */ React.createElement("path", { d: "M9 12l2 2 4-4" }));
  }
  function MessageIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z" }));
  }
  function SearchIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "6.25" }), /* @__PURE__ */ React.createElement("path", { d: "M20 20l-3.8-3.8" }));
  }
  function XmarkIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11" }));
  }
  function MessageCheckIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M8.5 11l2.25 2.25L15.5 8.5" }));
  }
  function SlidersIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9" }), /* @__PURE__ */ React.createElement("circle", { cx: "15", cy: "8", r: "2.25" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "16", r: "2.25" }));
  }
  function SpeakerIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M15 9a4 4 0 010 6" }), /* @__PURE__ */ React.createElement("path", { d: "M17.5 6.5a7.5 7.5 0 010 11" }));
  }
  function AppearanceIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.25" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3.75a8.25 8.25 0 010 16.5z", fill: "currentColor", stroke: "none" }));
  }
  function CodeIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M8.5 8L4.5 12l4 4" }), /* @__PURE__ */ React.createElement("path", { d: "M15.5 8l4 4-4 4" }), /* @__PURE__ */ React.createElement("path", { d: "M13.5 5.5l-3 13" }));
  }
  function EllipsisIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props, filled: true }, /* @__PURE__ */ React.createElement("circle", { cx: "5.5", cy: "12", r: "1.6" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.6" }), /* @__PURE__ */ React.createElement("circle", { cx: "18.5", cy: "12", r: "1.6" }));
  }
  function DownloadIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M12 4v10" }), /* @__PURE__ */ React.createElement("path", { d: "M8 10.5l4 4 4-4" }), /* @__PURE__ */ React.createElement("path", { d: "M5 19.5h14" }));
  }
  function PlusIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M12 5v14M5 12h14" }));
  }
  function InfoIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.25" }), /* @__PURE__ */ React.createElement("path", { d: "M12 11v5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 7.75h.01" }));
  }
  function WarningIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M12 4.5L3.5 19h17L12 4.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 10v4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 16.75h.01" }));
  }
  function ListIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M8.5 7h11M8.5 12h11M8.5 17h11" }), /* @__PURE__ */ React.createElement("path", { d: "M4.5 7h.01M4.5 12h.01M4.5 17h.01" }));
  }
  function MinusIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M5 12h14" }));
  }
  function RefreshIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M19 8.5a7.5 7.5 0 10.9 6" }), /* @__PURE__ */ React.createElement("path", { d: "M19 4v4.5h-4.5" }));
  }
  function ChevronLeftIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M15 6l-6 6 6 6" }));
  }
  function ServerIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("rect", { x: "4", y: "4", width: "16", height: "6", rx: "2" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "14", width: "16", height: "6", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M8 7h.01M8 17h.01" }));
  }
  function BroadcastIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7" }), /* @__PURE__ */ React.createElement("path", { d: "M6 6a9 9 0 000 12M18 6a9 9 0 010 12" }));
  }
  function QuestIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props, filled: true }, /* @__PURE__ */ React.createElement("path", { d: "M7.5 21.7a8.95 8.95 0 0 1 9 0 1 1 0 0 0 1-1.73c-.6-.35-1.24-.64-1.9-.87.54-.3 1.05-.65 1.52-1.07a3.98 3.98 0 0 0 5.49-1.8.77.77 0 0 0-.24-.95 3.98 3.98 0 0 0-2.02-.76A4 4 0 0 0 23 10.47a.76.76 0 0 0-.71-.71 4.06 4.06 0 0 0-1.6.22 3.99 3.99 0 0 0 .54-5.35.77.77 0 0 0-.95-.24c-.75.36-1.37.95-1.77 1.67V6a4 4 0 0 0-4.9-3.9.77.77 0 0 0-.6.72 4 4 0 0 0 3.7 4.17c.89 1.3 1.3 2.95 1.3 4.51 0 3.66-2.75 6.5-6 6.5s-6-2.84-6-6.5c0-1.56.41-3.21 1.3-4.51A4 4 0 0 0 11 2.82a.77.77 0 0 0-.6-.72 4.01 4.01 0 0 0-4.9 3.96A4.02 4.02 0 0 0 3.73 4.4a.77.77 0 0 0-.95.24 3.98 3.98 0 0 0 .55 5.35 4 4 0 0 0-1.6-.22.76.76 0 0 0-.72.71l-.01.28a4 4 0 0 0 2.65 3.77c-.75.06-1.45.33-2.02.76-.3.22-.4.62-.24.95a4 4 0 0 0 5.49 1.8c.47.42.98.78 1.53 1.07-.67.23-1.3.52-1.91.87a1 1 0 1 0 1 1.73Z" }));
  }
  function PeopleIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "8.25", r: "3.25" }), /* @__PURE__ */ React.createElement("path", { d: "M3.5 19.5c0-2.9 2.46-5.25 5.5-5.25s5.5 2.35 5.5 5.25" }), /* @__PURE__ */ React.createElement("path", { d: "M16 5.4a3.25 3.25 0 010 6.2" }), /* @__PURE__ */ React.createElement("path", { d: "M17.2 14.6c2.03.6 3.3 2.4 3.3 4.9" }));
  }
  function DesktopIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4.5", width: "18", height: "11.5", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 19.5h6M12 16v3.5" }));
  }
  function MobileIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("rect", { x: "7", y: "2.75", width: "10", height: "18.5", rx: "2.5" }), /* @__PURE__ */ React.createElement("path", { d: "M10.75 18.25h2.5" }));
  }
  function GlobeIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.25" }), /* @__PURE__ */ React.createElement("path", { d: "M3.75 12h16.5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3.75c2.2 2.3 3.3 5.05 3.3 8.25S14.2 17.95 12 20.25c-2.2-2.3-3.3-5.05-3.3-8.25S9.8 6.05 12 3.75z" }));
  }
  function GamepadIcon(props) {
    return /* @__PURE__ */ React.createElement(Glyph, { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M7.5 7.5h9a5 5 0 014.9 6l-.5 2.6A2.5 2.5 0 0118.45 18c-.9 0-1.73-.48-2.17-1.26L15.5 15.5h-7l-.78 1.24A2.5 2.5 0 015.55 18a2.5 2.5 0 01-2.45-1.9l-.5-2.6a5 5 0 014.9-6z" }), /* @__PURE__ */ React.createElement("path", { d: "M8.25 10.5v2.25M7.12 11.6h2.26" }), /* @__PURE__ */ React.createElement("path", { d: "M15.25 11h.01M17 12.75h.01" }));
  }

  // src/ui/components/Toggle.tsx
  function Toggle({ checked, onChange, disabled, ...rest }) {
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": checked,
        "aria-label": rest["aria-label"],
        className: "hc-toggle",
        "data-on": checked,
        disabled,
        onClick: () => {
          if (!disabled) onChange(!checked);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "hc-toggle__knob" })
    );
  }

  // src/ui/components/ListRow.tsx
  function ListRow({
    icon,
    iconBackground,
    title,
    subtitle,
    accessory,
    onClick,
    showChevron
  }) {
    const interactive = typeof onClick === "function";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: interactive ? "hc-row hc-row--button" : "hc-row",
        onClick,
        role: interactive ? "button" : void 0,
        tabIndex: interactive ? 0 : void 0,
        onKeyDown: interactive ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        } : void 0
      },
      icon && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "hc-row__icon",
          style: iconBackground ? { background: iconBackground } : void 0
        },
        icon
      ),
      /* @__PURE__ */ React.createElement("div", { className: "hc-row__text" }, /* @__PURE__ */ React.createElement("div", { className: "hc-row__title" }, title), subtitle != null && subtitle !== false && /* @__PURE__ */ React.createElement("div", { className: "hc-row__subtitle" }, subtitle)),
      accessory != null && accessory !== false && /* @__PURE__ */ React.createElement("div", { className: "hc-row__accessory" }, accessory),
      showChevron && /* @__PURE__ */ React.createElement(ChevronRightIcon, { size: 20, className: "hc-row__chevron" })
    );
  }

  // src/ui/components/Badge.tsx
  function Badge({ tone = "neutral", children }) {
    return /* @__PURE__ */ React.createElement("span", { className: "hc-badge", "data-tone": tone }, children);
  }

  // src/ui/components/EmptyState.tsx
  function EmptyState({ icon, title, subtitle, action }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-empty" }, icon, /* @__PURE__ */ React.createElement("div", { className: "hc-empty__title" }, title), subtitle && /* @__PURE__ */ React.createElement("div", { className: "hc-empty__subtitle" }, subtitle), action && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "var(--hc-space-5)" } }, action));
  }

  // src/ui/components/NumberStepper.tsx
  function clamp(value, min, max) {
    if (min != null && value < min) return min;
    if (max != null && value > max) return max;
    return value;
  }
  function NumberStepper({ value, onChange, min, max, step = 1 }) {
    const atMin = min != null && value <= min;
    const atMax = max != null && value >= max;
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stepper" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-stepper__btn",
        onClick: () => onChange(clamp(value - step, min, max)),
        disabled: atMin,
        "aria-label": "\u51CF\u5C11"
      },
      /* @__PURE__ */ React.createElement(MinusIcon, { size: 16 })
    ), /* @__PURE__ */ React.createElement("span", { className: "hc-stepper__value" }, value), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-stepper__btn",
        onClick: () => onChange(clamp(value + step, min, max)),
        disabled: atMax,
        "aria-label": "\u589E\u52A0"
      },
      /* @__PURE__ */ React.createElement(PlusIcon, { size: 16 })
    ));
  }

  // src/ui/components/TextInput.tsx
  function TextInput({ value, onChange, className, ...rest }) {
    return /* @__PURE__ */ React.createElement(
      "input",
      {
        className: className ? `hc-input ${className}` : "hc-input",
        value,
        onChange: (e) => onChange(e.currentTarget.value),
        ...rest
      }
    );
  }

  // src/ui/components/Select.tsx
  function Select({ value, options, onChange, ...rest }) {
    const [open, setOpen] = useState(false);
    const [active2, setActive] = useState(-1);
    const rootRef = useRef(null);
    const menuRef = useRef(null);
    const [menuPos, setMenuPos] = useState(null);
    const current = options.find((o) => o.value === value);
    useEffect(() => {
      if (!open) return;
      const onPress = (e) => {
        const t = e.target;
        if (rootRef.current?.contains(t)) return;
        if (menuRef.current?.contains(t)) return;
        setOpen(false);
      };
      document.addEventListener("pointerdown", onPress, true);
      return () => document.removeEventListener("pointerdown", onPress, true);
    }, [open]);
    useEffect(() => {
      if (!open) return;
      const onMove = (e) => {
        if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
        setOpen(false);
      };
      window.addEventListener("scroll", onMove, true);
      window.addEventListener("resize", onMove);
      return () => {
        window.removeEventListener("scroll", onMove, true);
        window.removeEventListener("resize", onMove);
      };
    }, [open]);
    const openMenu = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const estimated = Math.min(280, options.length * 36 + 10);
        const below = rect.bottom + 6;
        const top = below + estimated > window.innerHeight - 8 ? Math.max(8, rect.top - 6 - estimated) : below;
        setMenuPos({
          top,
          right: Math.max(8, window.innerWidth - rect.right),
          width: rect.width
        });
      }
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
      setOpen(true);
    };
    const pick = (next) => {
      setOpen(false);
      if (next !== value) onChange(next);
    };
    const onKeyDown3 = (e) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          openMenu();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (active2 >= 0 && active2 < options.length) pick(options[active2].value);
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "hc-select", ref: rootRef, onKeyDown: onKeyDown3 }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-select__button",
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-label": rest["aria-label"],
        onClick: () => open ? setOpen(false) : openMenu()
      },
      /* @__PURE__ */ React.createElement("span", { className: "hc-select__value" }, current?.label ?? value),
      /* @__PURE__ */ React.createElement(
        "svg",
        {
          className: "hc-select__chevron",
          width: "12",
          height: "12",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
          "data-open": open
        },
        /* @__PURE__ */ React.createElement("path", { d: "M6 9l6 6 6-6" })
      )
    ), open && menuPos && ReactDOM.createPortal(
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "halcyon",
          ref: menuRef,
          style: { position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 1e4 },
          onKeyDown: onKeyDown3
        },
        /* @__PURE__ */ React.createElement("div", { className: "hc-select__menu", role: "listbox", style: { minWidth: menuPos.width } }, options.map((opt, index) => /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            key: opt.value,
            role: "option",
            "aria-selected": opt.value === value,
            className: "hc-select__option",
            "data-active": index === active2,
            "data-selected": opt.value === value,
            onPointerEnter: () => setActive(index),
            onClick: () => pick(opt.value)
          },
          /* @__PURE__ */ React.createElement("span", { className: "hc-select__optlabel" }, opt.label),
          opt.value === value && /* @__PURE__ */ React.createElement(
            "svg",
            {
              className: "hc-select__check",
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2.5,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": true
            },
            /* @__PURE__ */ React.createElement("path", { d: "M5 12.5l4.5 4.5L19 7" })
          )
        )))
      ),
      document.body
    ));
  }

  // src/ui/components/StringListEditor.tsx
  function StringListEditor({ value, onChange, itemPlaceholder }) {
    const [draft, setDraft] = useState("");
    const commit = () => {
      const next = draft.trim();
      if (!next || value.includes(next)) {
        setDraft("");
        return;
      }
      onChange([...value, next]);
      setDraft("");
    };
    const removeAt = (index) => {
      onChange(value.filter((_, i) => i !== index));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "hc-strlist" }, value.map((item, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-strlist__item", key: item }, /* @__PURE__ */ React.createElement(TextInput, { value: item, onChange: () => void 0, readOnly: true }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-iconbtn hc-iconbtn--danger",
        onClick: () => removeAt(index),
        "aria-label": "\u79FB\u9664"
      },
      /* @__PURE__ */ React.createElement(TrashIcon, { size: 18 })
    ))), /* @__PURE__ */ React.createElement("div", { className: "hc-strlist__add" }, /* @__PURE__ */ React.createElement(
      TextInput,
      {
        value: draft,
        onChange: setDraft,
        placeholder: itemPlaceholder ?? "\u6DFB\u52A0\u4E00\u9879",
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-iconbtn",
        onClick: commit,
        "aria-label": "\u6DFB\u52A0",
        disabled: !draft.trim()
      },
      /* @__PURE__ */ React.createElement(PlusIcon, { size: 18 })
    )));
  }

  // src/ui/components/Button.tsx
  function Button({
    variant = "secondary",
    size = "md",
    icon,
    className,
    children,
    type = "button",
    ...rest
  }) {
    const classes = ["hc-btn", `hc-btn--${variant}`];
    if (size !== "md") classes.push(`hc-btn--${size}`);
    if (className) classes.push(className);
    return /* @__PURE__ */ React.createElement("button", { type, className: classes.join(" "), ...rest }, icon, children != null && children !== false && /* @__PURE__ */ React.createElement("span", null, children));
  }

  // src/ui/settings/hooks.ts
  function useRuntimeList() {
    const [list, setList] = useState(() => runtime.list());
    useEffect(() => {
      const refresh = () => setList(runtime.list());
      refresh();
      return runtime.onChange(refresh);
    }, []);
    return list;
  }
  function useSettingsSnapshot(settings11) {
    const [, bump] = useState(0);
    useEffect(() => {
      const unsubscribes3 = Object.keys(settings11.schema).map(
        (key) => settings11.subscribe(key, () => bump((n) => n + 1))
      );
      return () => {
        for (const off of unsubscribes3) off();
      };
    }, [settings11]);
    return settings11.store;
  }

  // src/ui/settings/SettingsForm.tsx
  function clone(value) {
    if (value === null || typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
  }
  function equal(a, b) {
    if (a === b) return true;
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  function SettingsForm({ settings: settings11 }) {
    const store = useSettingsSnapshot(settings11);
    const keys = useMemo(
      () => Object.keys(settings11.schema).filter((key) => !settings11.schema[key].hidden),
      [settings11]
    );
    const [draft, setDraft] = useState(() => seed(store, keys));
    useEffect(() => {
      setDraft(seed(store, keys));
    }, [settings11]);
    if (keys.length === 0) return null;
    const dirty = keys.filter((key) => !equal(draft[key], store[key]));
    const save = () => {
      for (const key of dirty) store[key] = clone(draft[key]);
    };
    const discard = () => setDraft(seed(store, keys));
    const sections = [];
    for (const key of keys) {
      const title = settings11.schema[key].group ?? "\u8BBE\u7F6E";
      const last = sections[sections.length - 1];
      if (last && last.title === title) last.keys.push(key);
      else sections.push({ title, keys: [key] });
    }
    return /* @__PURE__ */ React.createElement(React.Fragment, null, sections.map((section, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-section", key: `${section.title}-${index}` }, /* @__PURE__ */ React.createElement("div", { className: "hc-section__title" }, section.title), /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, section.keys.map((key) => /* @__PURE__ */ React.createElement(
      SettingField,
      {
        key,
        def: settings11.schema[key],
        value: draft[key],
        onChange: (next) => setDraft((prev) => ({ ...prev, [key]: next }))
      }
    ))))), dirty.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-savebar" }, /* @__PURE__ */ React.createElement("span", { className: "hc-savebar__label" }, "\u6709 ", dirty.length, " \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"), /* @__PURE__ */ React.createElement("div", { className: "hc-savebar__actions" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: discard }, "\u653E\u5F03"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "primary", onClick: save }, "\u4FDD\u5B58"))));
  }
  function seed(store, keys) {
    const out = {};
    for (const key of keys) out[key] = clone(store[key]);
    return out;
  }
  function SettingField({ def, value, onChange }) {
    const label = /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, def.label), def.description && /* @__PURE__ */ React.createElement("div", { className: "hc-cell__desc" }, def.description));
    switch (def.type) {
      case "boolean":
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, label, /* @__PURE__ */ React.createElement(
          Toggle,
          {
            checked: value === true,
            onChange: (next) => onChange(next),
            disabled: def.disabled?.(),
            "aria-label": def.label
          }
        ));
      case "number":
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, label, /* @__PURE__ */ React.createElement(
          NumberStepper,
          {
            value: typeof value === "number" ? value : def.default,
            onChange: (next) => onChange(next),
            min: def.min,
            max: def.max,
            step: def.step
          }
        ));
      case "select":
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, label, /* @__PURE__ */ React.createElement(
          Select,
          {
            value: typeof value === "string" ? value : def.default,
            onChange: (next) => onChange(next),
            options: def.options
          }
        ));
      case "string":
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, label), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(
          TextInput,
          {
            value: typeof value === "string" ? value : "",
            onChange: (next) => onChange(next),
            placeholder: def.placeholder,
            maxLength: def.maxLength
          }
        )));
      case "string-list":
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, label, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(
          StringListEditor,
          {
            value: Array.isArray(value) ? value : [],
            onChange: (next) => onChange(next),
            itemPlaceholder: def.itemPlaceholder
          }
        )));
      case "custom": {
        const Custom = def.component;
        return /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, label, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(Custom, { value, onChange })));
      }
      default:
        return null;
    }
  }

  // src/ui/settings/categories.ts
  var CATEGORIES = {
    utility: { label: "\u5B9E\u7528\u5DE5\u5177", color: "var(--hc-accent)", Icon: SlidersIcon },
    chat: { label: "\u804A\u5929", color: "var(--hc-green)", Icon: MessageIcon },
    voice: { label: "\u8BED\u97F3", color: "var(--hc-indigo)", Icon: SpeakerIcon },
    appearance: { label: "\u5916\u89C2", color: "var(--hc-pink)", Icon: AppearanceIcon },
    privacy: { label: "\u9690\u79C1", color: "var(--hc-teal)", Icon: ShieldIcon },
    developer: { label: "\u5F00\u53D1\u8005", color: "var(--hc-orange)", Icon: CodeIcon },
    misc: { label: "\u5176\u4ED6", color: "var(--hc-fill-primary)", Icon: EllipsisIcon }
  };
  var CATEGORY_ORDER = [
    "utility",
    "chat",
    "voice",
    "appearance",
    "privacy",
    "developer",
    "misc"
  ];

  // src/ui/settings/PluginsView.tsx
  function PluginsView({
    initialSelectedId
  } = {}) {
    const plugins2 = useRuntimeList().filter((p) => !p.hidden);
    const [selectedId, setSelectedId] = useState(initialSelectedId ?? null);
    const [query, setQuery] = useState("");
    const selected = selectedId ? plugins2.find((p) => p.id === selectedId) : void 0;
    if (selected) {
      return /* @__PURE__ */ React.createElement(PluginDetail, { view: selected, onBack: () => setSelectedId(null) });
    }
    const needle = query.trim().toLowerCase();
    const filtered = needle ? plugins2.filter(
      (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)
    ) : plugins2;
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "hc-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "hc-search" }, /* @__PURE__ */ React.createElement(SearchIcon, { size: 20 }), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: query,
        onChange: (event) => setQuery(event.currentTarget.value),
        placeholder: "\u641C\u7D22\u63D2\u4EF6",
        "aria-label": "\u641C\u7D22\u63D2\u4EF6"
      }
    ))), filtered.length === 0 ? /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: /* @__PURE__ */ React.createElement(SearchIcon, { size: 48 }),
        title: "\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",
        subtitle: "\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"
      }
    ) : CATEGORY_ORDER.map((category) => {
      const inCategory = filtered.filter((p) => p.category === category);
      if (inCategory.length === 0) return null;
      const meta = CATEGORIES[category];
      return /* @__PURE__ */ React.createElement("div", { className: "hc-section", key: category }, /* @__PURE__ */ React.createElement("div", { className: "hc-section__title" }, meta.label), /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, inCategory.map((view) => /* @__PURE__ */ React.createElement(
        PluginRow,
        {
          key: view.id,
          view,
          onOpen: () => setSelectedId(view.id)
        }
      ))));
    }));
  }
  function PluginRow({ view, onOpen }) {
    const meta = CATEGORIES[view.category];
    const Icon = meta.Icon;
    const openable = view.hasSettings || view.hasPage;
    return /* @__PURE__ */ React.createElement(
      ListRow,
      {
        icon: /* @__PURE__ */ React.createElement(Icon, { size: 18 }),
        iconBackground: meta.color,
        title: view.name,
        subtitle: view.description,
        onClick: openable ? onOpen : void 0,
        showChevron: openable,
        accessory: /* @__PURE__ */ React.createElement(React.Fragment, null, view.needsRestart && /* @__PURE__ */ React.createElement(Badge, { tone: "orange" }, /* @__PURE__ */ React.createElement(RefreshIcon, { size: 12 }), " \u5F85\u91CD\u542F"), view.state === "errored" && /* @__PURE__ */ React.createElement(Badge, { tone: "red" }, /* @__PURE__ */ React.createElement(WarningIcon, { size: 12 }), " \u51FA\u9519"), /* @__PURE__ */ React.createElement(
          "span",
          {
            onClick: (event) => event.stopPropagation(),
            onKeyDown: (event) => event.stopPropagation()
          },
          /* @__PURE__ */ React.createElement(
            Toggle,
            {
              checked: view.enabled,
              disabled: view.required,
              onChange: () => runtime.toggle(view.id),
              "aria-label": `\u542F\u7528 ${view.name}`
            }
          )
        ))
      }
    );
  }
  function PluginDetail({ view, onBack }) {
    const plugin = runtime.getPlugin(view.id);
    const meta = CATEGORIES[view.category];
    const Icon = meta.Icon;
    const hasVisibleSettings = Boolean(
      plugin?.settings && Object.values(plugin.settings.schema).some((def) => !def.hidden)
    );
    const hasBoth = Boolean(plugin?.page) && hasVisibleSettings;
    const [section, setSection] = useState("page");
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "hc-back", onClick: onBack }, /* @__PURE__ */ React.createElement(ChevronLeftIcon, { size: 20 }), "\u63D2\u4EF6"), /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head" }, /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head__icon", style: { background: meta.color } }, /* @__PURE__ */ React.createElement(Icon, { size: 26 })), /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head__text" }, /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head__name" }, view.name), /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head__desc" }, view.description), /* @__PURE__ */ React.createElement("div", { className: "hc-detail-head__meta" }, view.authors.map((a) => a.name).join("\u3001"))), /* @__PURE__ */ React.createElement(
      "span",
      {
        onClick: (event) => event.stopPropagation(),
        onKeyDown: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        Toggle,
        {
          checked: view.enabled,
          disabled: view.required,
          onChange: () => runtime.toggle(view.id),
          "aria-label": `\u542F\u7528 ${view.name}`
        }
      )
    )), view.needsRestart && /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note" }, /* @__PURE__ */ React.createElement(RefreshIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")), view.state === "errored" && /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note hc-inline-note--danger" }, /* @__PURE__ */ React.createElement(WarningIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")), hasBoth && /* @__PURE__ */ React.createElement("div", { className: "hc-segment" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-segment__item",
        "data-active": section === "page",
        onClick: () => setSection("page")
      },
      plugin.page.title || "\u8BB0\u5F55"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-segment__item",
        "data-active": section === "settings",
        onClick: () => setSection("settings")
      },
      "\u8BBE\u7F6E"
    )), plugin?.page && (!hasBoth || section === "page") ? /* @__PURE__ */ React.createElement(plugin.page.component, null) : plugin?.settings ? /* @__PURE__ */ React.createElement(SettingsForm, { settings: plugin.settings }) : /* @__PURE__ */ React.createElement(EmptyState, { title: "\u6CA1\u6709\u53EF\u914D\u7F6E\u9879", subtitle: "\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002" }));
  }

  // src/ui/settings/LogsView.tsx
  var MAX_VISIBLE = 500;
  var PAGE_SIZE = 100;
  function LogsView() {
    const [entries, setEntries] = useState(() => getLogHistory().slice());
    const [page, setPage] = useState(0);
    const scrollRef = useRef(null);
    useEffect(() => {
      setEntries(getLogHistory().slice());
      return onLog((entry) => {
        setEntries((prev) => {
          const next = prev.concat(entry);
          return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
        });
      });
    }, []);
    const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    const clamped = Math.min(page, pageCount - 1);
    const end = entries.length - clamped * PAGE_SIZE;
    const visible = entries.slice(Math.max(0, end - PAGE_SIZE), end);
    useEffect(() => {
      if (clamped !== 0) return;
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, [entries, clamped]);
    if (entries.length === 0) {
      return /* @__PURE__ */ React.createElement(
        EmptyState,
        {
          icon: /* @__PURE__ */ React.createElement(ListIcon, { size: 48 }),
          title: "\u6682\u65E0\u65E5\u5FD7",
          subtitle: "\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
        }
      );
    }
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stack" }, /* @__PURE__ */ React.createElement("div", { className: "hc-logs", ref: scrollRef }, visible.map((entry, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-logline", "data-level": entry.level, key: `${entry.time}-${index}` }, /* @__PURE__ */ React.createElement("span", { className: "hc-logline__time" }, formatTime(entry.time)), /* @__PURE__ */ React.createElement("span", { className: "hc-logline__scope" }, entry.scope), /* @__PURE__ */ React.createElement("span", { className: "hc-logline__msg" }, entry.parts.map(stringify).join(" "))))), pageCount > 1 && /* @__PURE__ */ React.createElement("div", { className: "hc-pager" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-tab",
        disabled: clamped >= pageCount - 1,
        onClick: () => setPage(Math.min(pageCount - 1, clamped + 1))
      },
      "\u2190 \u66F4\u65E9"
    ), /* @__PURE__ */ React.createElement("span", { className: "hc-pager__label" }, clamped === 0 ? "\u5B9E\u65F6" : `\u7B2C ${pageCount - clamped} / ${pageCount} \u9875`), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-tab",
        disabled: clamped === 0,
        onClick: () => setPage(Math.max(0, clamped - 1))
      },
      "\u66F4\u65B0 \u2192"
    )));
  }
  function formatTime(time) {
    const date = new Date(time);
    const clock = date.toLocaleTimeString(void 0, { hour12: false });
    return `${clock}.${String(date.getMilliseconds()).padStart(3, "0")}`;
  }
  function stringify(part) {
    if (typeof part === "string") return part;
    if (part instanceof Error) return part.stack ?? part.message;
    try {
      return JSON.stringify(part);
    } catch {
      return String(part);
    }
  }

  // src/ui/components/Section.tsx
  function Section({ title, note, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-section" }, title && /* @__PURE__ */ React.createElement("div", { className: "hc-section__title" }, title), /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, children), note && /* @__PURE__ */ React.createElement("div", { className: "hc-section__note" }, note));
  }

  // src/core/update.ts
  var log4 = logger("update");
  var REPO = "mzrodyu/CatieDiscordTools";
  var VERSION_URL = `https://raw.githubusercontent.com/${REPO}/main/package.json`;
  var PROJECT_URL = `https://github.com/${REPO}`;
  var cached = null;
  var inflight = null;
  function currentVersion() {
    return true ? "0.6.5" : "dev";
  }
  function getCachedUpdate() {
    return cached;
  }
  function parseVersion(v) {
    return String(v).trim().replace(/^v/i, "").split(/[.+-]/).map((p) => parseInt(p, 10)).filter((n) => Number.isFinite(n));
  }
  function isNewer(remote, local) {
    const a = parseVersion(remote);
    const b = parseVersion(local);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const x = a[i] ?? 0;
      const y = b[i] ?? 0;
      if (x !== y) return x > y;
    }
    return false;
  }
  async function fetchText(url) {
    const native = globalThis.HalcyonNative;
    if (native && typeof native.fetchText === "function") {
      try {
        const text = await native.fetchText(url);
        if (typeof text === "string") return text;
      } catch {
      }
    }
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.text();
    } catch {
    }
    return null;
  }
  async function checkForUpdate(force = false) {
    if (!force && cached && cached.status !== "unknown") return cached;
    if (inflight) return inflight;
    inflight = (async () => {
      const current = currentVersion();
      const raw = await fetchText(VERSION_URL);
      let state;
      if (raw == null) {
        state = { status: "unknown", current, latest: null };
      } else {
        let latest = null;
        try {
          const parsed = JSON.parse(raw);
          latest = typeof parsed?.version === "string" && parsed.version ? parsed.version : null;
        } catch {
          latest = null;
        }
        if (!latest) {
          state = { status: "unknown", current, latest: null };
        } else if (current === "dev") {
          state = { status: "current", current, latest };
        } else {
          state = { status: isNewer(latest, current) ? "outdated" : "current", current, latest };
        }
      }
      if (state.status === "outdated") {
        log4.info(`update available: ${state.current} \u2192 ${state.latest}`);
      } else if (state.status === "unknown") {
        log4.info("could not determine the latest version (CSP or offline) \u2014 skipping notice");
      } else {
        log4.info(`up to date (${state.current})`);
      }
      cached = state;
      inflight = null;
      return state;
    })();
    return inflight;
  }

  // src/ui/settings/AboutView.tsx
  function AboutView() {
    const plugins2 = useRuntimeList().filter((p) => !p.hidden);
    const enabled = plugins2.filter((p) => p.enabled).length;
    const version2 = true ? "0.6.5" : "dev";
    const [update, setUpdate] = React.useState(getCachedUpdate);
    React.useEffect(() => {
      let alive = true;
      void checkForUpdate().then((state) => {
        if (alive) setUpdate(state);
      });
      return () => {
        alive = false;
      };
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stack" }, /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero" }, /* @__PURE__ */ React.createElement(HalcyonMark, { size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero__name" }, "Halcyon"), /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero__ver" }, "\u7248\u672C ", version2, update?.status === "outdated" && "\uFF0C\u6709\u65B0\u7248\u672C\u53EF\u7528"))), update?.status === "outdated" && /* @__PURE__ */ React.createElement(Section, { title: "\u66F4\u65B0" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u53D1\u73B0\u65B0\u7248\u672C ", update.latest)), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "primary",
        size: "sm",
        onClick: () => window.open(PROJECT_URL, "_blank", "noopener,noreferrer")
      },
      "\u524D\u5F80\u4E0B\u8F7D"
    ))), /* @__PURE__ */ React.createElement(Section, { title: "\u6982\u89C8" }, /* @__PURE__ */ React.createElement(AboutRow, { label: "\u63D2\u4EF6\u603B\u6570", value: String(plugins2.length) }), /* @__PURE__ */ React.createElement(AboutRow, { label: "\u5DF2\u542F\u7528", value: String(enabled) })), /* @__PURE__ */ React.createElement(
      Section,
      {
        title: "\u9879\u76EE",
        note: "\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"
      },
      /* @__PURE__ */ React.createElement(AboutRow, { label: "\u4F5C\u8005", value: "caitemm (mzrodyu)" }),
      /* @__PURE__ */ React.createElement(AboutRow, { label: "\u8BB8\u53EF\u534F\u8BAE", value: "GPL-3.0-or-later" })
    ));
  }
  function AboutRow({ label, value }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, label)), /* @__PURE__ */ React.createElement("span", { className: "hc-about__value" }, value));
  }

  // src/ui/settings/SettingsRoot.tsx
  var TABS = [
    { id: "plugins", label: "\u63D2\u4EF6", title: "\u63D2\u4EF6", Icon: SlidersIcon },
    { id: "logs", label: "\u65E5\u5FD7", title: "\u65E5\u5FD7", Icon: ListIcon },
    { id: "about", label: "\u5173\u4E8E", title: "\u5173\u4E8E Halcyon", Icon: InfoIcon }
  ];
  function renderView(tab, initialPluginId) {
    switch (tab) {
      case "plugins":
        return /* @__PURE__ */ React.createElement(PluginsView, { initialSelectedId: initialPluginId });
      case "logs":
        return /* @__PURE__ */ React.createElement(LogsView, null);
      case "about":
        return /* @__PURE__ */ React.createElement(AboutView, null);
    }
  }
  function SettingsRoot({
    onClose,
    initial
  }) {
    const [tab, setTab] = useState(initial?.tab ?? "plugins");
    const [initialPluginId] = useState(initial?.pluginId);
    const active2 = TABS.find((t) => t.id === tab) ?? TABS[0];
    return /* @__PURE__ */ React.createElement("div", { className: "halcyon hc-panel" }, /* @__PURE__ */ React.createElement("nav", { className: "hc-panel__sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "hc-panel__brand" }, /* @__PURE__ */ React.createElement(HalcyonMark, { size: 24 }), /* @__PURE__ */ React.createElement("span", { className: "hc-panel__brand-name" }, "Halcyon")), TABS.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t.id,
        type: "button",
        className: "hc-navitem",
        "data-active": t.id === tab,
        onClick: () => setTab(t.id)
      },
      /* @__PURE__ */ React.createElement(t.Icon, { size: 18 }),
      t.label
    ))), /* @__PURE__ */ React.createElement("section", { className: "hc-panel__content" }, /* @__PURE__ */ React.createElement("header", { className: "hc-panel__header" }, /* @__PURE__ */ React.createElement("span", { className: "hc-title2" }, active2.title), onClose && /* @__PURE__ */ React.createElement("button", { type: "button", className: "hc-iconbtn", onClick: onClose, "aria-label": "\u5173\u95ED" }, /* @__PURE__ */ React.createElement(XmarkIcon, { size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "hc-panel__scroll" }, renderView(tab, tab === "plugins" ? initialPluginId : void 0))));
  }
  function EmbeddedView({ tab }) {
    return /* @__PURE__ */ React.createElement("div", { className: "halcyon hc-embed" }, renderView(tab));
  }

  // src/ui/settings/overlay.tsx
  var log5 = logger("settings");
  var host = null;
  var unmount = null;
  var keyHandler = null;
  function openSettings(target) {
    injectStyles();
    if (host) return;
    host = document.createElement("div");
    host.className = "halcyon";
    document.body.appendChild(host);
    keyHandler = (event) => {
      if (event.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", keyHandler);
    try {
      unmount = mountDetached(
        React.createElement(Overlay, { onClose: closeSettings, target }),
        host
      );
    } catch (err) {
      log5.error("could not open settings overlay", err);
      closeSettings();
    }
  }
  function closeSettings() {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (unmount) {
      unmount();
      unmount = null;
    }
    if (host) {
      host.remove();
      host = null;
    }
  }
  function Overlay({
    onClose,
    target
  }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "hc-overlay",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Halcyon \u8BBE\u7F6E",
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose();
        }
      },
      /* @__PURE__ */ React.createElement(SettingsRoot, { onClose, initial: target })
    );
  }

  // src/plugins/settings-host/index.tsx
  var log6 = logger("settings-host");
  function PluginsSection() {
    return /* @__PURE__ */ React.createElement(EmbeddedView, { tab: "plugins" });
  }
  function LogsSection() {
    return /* @__PURE__ */ React.createElement(EmbeddedView, { tab: "logs" });
  }
  function AboutSection() {
    return /* @__PURE__ */ React.createElement(EmbeddedView, { tab: "about" });
  }
  function sidebarIcon(Icon) {
    return function HalcyonSidebarIcon() {
      return /* @__PURE__ */ React.createElement(Icon, { size: 20 });
    };
  }
  var HALCYON_SECTION_KEY = "halcyon-section";
  var ENTRIES = [
    { key: "halcyon-plugins", title: "\u63D2\u4EF6", Component: PluginsSection, Icon: SlidersIcon },
    { key: "halcyon-logs", title: "\u65E5\u5FD7", Component: LogsSection, Icon: ListIcon },
    { key: "halcyon-about", title: "\u5173\u4E8E", Component: AboutSection, Icon: InfoIcon }
  ];
  var diagLogged = false;
  var INJECT_SECTION = true;
  var FALLBACK_LAYOUT_TYPES = {
    SECTION: 1,
    SIDEBAR_ITEM: 2,
    PANEL: 3,
    CATEGORY: 5,
    CUSTOM: 20
  };
  var layoutTypes = null;
  function getLayoutTypes() {
    if (layoutTypes) return layoutTypes;
    try {
      const found = findByProps("SECTION", "SIDEBAR_ITEM", "PANEL", "CUSTOM");
      if (found && typeof found.SECTION === "number") {
        layoutTypes = {
          SECTION: found.SECTION,
          SIDEBAR_ITEM: found.SIDEBAR_ITEM,
          PANEL: found.PANEL,
          CATEGORY: typeof found.CATEGORY === "number" ? found.CATEGORY : FALLBACK_LAYOUT_TYPES.CATEGORY,
          CUSTOM: found.CUSTOM
        };
        return layoutTypes;
      }
    } catch (err) {
      log6.warn("could not resolve settings layout types; using fallback values", err);
    }
    return FALLBACK_LAYOUT_TYPES;
  }
  function safeChildren(node) {
    try {
      if (node && typeof node.buildLayout === "function") {
        const kids = node.buildLayout();
        if (Array.isArray(kids)) return kids;
      }
    } catch {
    }
    return [];
  }
  function resolveTypesFromLayout(layout) {
    const types = { ...FALLBACK_LAYOUT_TYPES };
    try {
      const first = Array.isArray(layout) ? layout[0] : void 0;
      if (first && typeof first.type === "number") types.SECTION = first.type;
      for (const section of layout) {
        for (const item of safeChildren(section)) {
          if (typeof item?.type !== "number") continue;
          types.SIDEBAR_ITEM = item.type;
          for (const panel of safeChildren(item)) {
            if (typeof panel?.type !== "number") continue;
            types.PANEL = panel.type;
            for (const category of safeChildren(panel)) {
              if (typeof category?.type !== "number") continue;
              types.CATEGORY = category.type;
              for (const leaf of safeChildren(category)) {
                if (leaf && typeof leaf.type === "number" && "Component" in leaf) {
                  types.CUSTOM = leaf.type;
                  return types;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      log6.warn("could not read layout types from the live tree; using fallbacks", err);
    }
    return types;
  }
  function buildEntry(types, entry) {
    const panel = {
      key: `${entry.key}-panel`,
      type: types.PANEL,
      useTitle: () => entry.title,
      buildLayout: () => [
        {
          key: `${entry.key}-category`,
          type: types.CATEGORY,
          buildLayout: () => [
            {
              key: `${entry.key}-custom`,
              type: types.CUSTOM,
              Component: entry.Component,
              useSearchTerms: () => [entry.title]
            }
          ]
        }
      ]
    };
    return {
      key: entry.key,
      type: types.SIDEBAR_ITEM,
      useTitle: () => entry.title,
      icon: sidebarIcon(entry.Icon),
      buildLayout: () => [panel]
    };
  }
  function fnSources(node) {
    const out = {};
    if (node && typeof node === "object") {
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (typeof v === "function") out[k] = String(v).replace(/\s+/g, " ").slice(0, 400);
      }
    }
    return out;
  }
  function describeNode(node, depth) {
    if (!node || typeof node !== "object") return { raw: typeof node };
    const info = {
      key: node.key,
      type: node.type,
      fields: Object.keys(node)
    };
    if (depth > 0 && typeof node.buildLayout === "function") {
      try {
        const kids = node.buildLayout();
        if (Array.isArray(kids)) {
          info.children = kids.slice(0, 6).map((k) => describeNode(k, depth - 1));
        }
      } catch (err) {
        info.childrenError = String(err);
      }
    }
    return info;
  }
  function probeLayoutOnce(layout) {
    if (diagLogged) return;
    diagLogged = true;
    try {
      const s0 = layout[0];
      const s1 = safeChildren(s0)[0];
      const s2 = safeChildren(s1)[0];
      const s3 = safeChildren(s2)[0];
      const s4 = safeChildren(s3)[0];
      const payload = {
        resolvedTypesFromEnum: getLayoutTypes(),
        resolvedTypesFromLive: resolveTypesFromLayout(layout),
        topLevelCount: layout.length,
        // The real function bodies Discord ships for one full branch: section ->
        // sidebar item -> panel -> category -> leaf. This is the ground truth for
        // what our own nodes must return (e.g. does useTitle yield a plain string
        // or an intl message object {locale, ast}?).
        sampleSources: {
          section: fnSources(s0),
          sidebarItem: fnSources(s1),
          panel: fnSources(s2),
          category: fnSources(s3),
          leaf: fnSources(s4)
        },
        layout: layout.slice(0, 12).map((n) => describeNode(n, 2))
      };
      globalThis.__halcyonLayoutProbe = JSON.stringify(payload, null, 2);
      log6.info(
        "[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back."
      );
    } catch (err) {
      log6.warn("[embed-probe] failed to capture layout shape", err);
    }
  }
  function buildLegacySections() {
    return [
      { section: "HEADER", label: "HALCYON" },
      { section: "halcyon-plugins", label: "\u63D2\u4EF6", element: PluginsSection },
      { section: "halcyon-logs", label: "\u65E5\u5FD7", element: LogsSection },
      { section: "halcyon-about", label: "\u5173\u4E8E", element: AboutSection }
    ];
  }
  var onKeyDown = null;
  var settings_host_default = definePlugin({
    id: "halcyon-settings",
    name: "Halcyon \u8BBE\u7F6E",
    description: "Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",
    authors: [{ name: "caitemm" }],
    category: "misc",
    required: true,
    hidden: true,
    patches: [
      {
        // Current builds. The sidebar renderer maps over a layout array produced
        // by `<builder>.buildLayout()`; we hand that call to `buildLayout` below,
        // which calls the original and splices Halcyon's SECTION in. `.map` in
        // the lookahead pins us to the render call site (not the many nested
        // `buildLayout()` calls the tree makes internally).
        label: "user-settings-layout",
        find: ".buildLayout().map",
        replacement: {
          match: /([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,
          replace: "$self.buildLayout($1)"
        }
      },
      {
        // Older builds. `getPredicateSections(){return <expr>}` gates the whole
        // sidebar; we wrap its return value. The captured body may itself contain
        // braces (arrow predicates, object literals), so it is matched as a
        // balanced block and replayed inside an arrow IIFE — `this` stays lexical,
        // so `this.props...` inside still resolves.
        label: "user-settings-sidebar",
        find: "getPredicateSections",
        replacement: {
          match: /getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,
          replace: (_full, body) => `getPredicateSections(){return $self.injectSections((()=>${body})())}`
        }
      }
    ],
    /**
     * Wrap the settings layout builder. Called from the patch with the object the
     * renderer was about to call `.buildLayout()` on; we call it ourselves, then
     * splice Halcyon's SECTION into the result.
     *
     * Defensive throughout: this feeds the entire settings pane, so any failure
     * falls through to the untouched layout rather than blanking it. Only the
     * root builder ("$Root") owns the sidebar — every panel and category runs its
     * own builder through here too, and those are left exactly as they were.
     */
    buildLayout(builder) {
      const layout = builder.buildLayout();
      try {
        if (!builder || builder.key !== "$Root") return layout;
        if (!Array.isArray(layout)) return layout;
        probeLayoutOnce(layout);
        if (!INJECT_SECTION) return layout;
        if (layout.some((n) => n?.key === HALCYON_SECTION_KEY)) return layout;
        const types = resolveTypesFromLayout(layout);
        const section = {
          key: HALCYON_SECTION_KEY,
          type: types.SECTION,
          useTitle: () => "HALCYON",
          buildLayout: () => ENTRIES.map((entry) => buildEntry(types, entry))
        };
        let index = layout.findIndex((n) => n?.key === "billing_section");
        if (index < 0) index = layout.findIndex((n) => n?.key === "user_section");
        if (index < 0) index = Math.min(2, layout.length);
        layout.splice(index, 0, section);
        log6.info(`native settings embed active \u2014 section inserted at index ${index}/${layout.length}`);
        return layout;
      } catch (err) {
        log6.error("failed to inject settings section into layout", err);
        return layout;
      }
    },
    /**
     * Splice Halcyon's group into the legacy settings sidebar array and return
     * it. Called from the older-build patch with that build's section list.
     *
     * Placement: right after the first divider, the seam between the account
     * block and the rest. Defensive: a throw here would blank the whole pane, so
     * any failure returns the original array untouched.
     */
    injectSections(sections) {
      try {
        if (!Array.isArray(sections)) return sections;
        if (sections.some((s) => s?.section === "halcyon-plugins")) return sections;
        const mine = buildLegacySections();
        const out = sections.slice();
        const firstDivider = out.findIndex((s) => s && s.section === "DIVIDER");
        if (firstDivider >= 0) {
          out.splice(firstDivider + 1, 0, ...mine);
        } else {
          out.push({ section: "DIVIDER" }, ...mine);
        }
        if (!diagLogged) {
          diagLogged = true;
          log6.info(`native settings embed active (legacy) \u2014 ${sections.length} base sections`);
        }
        return out;
      } catch (err) {
        log6.error("failed to inject settings sections", err);
        return sections;
      }
    },
    start() {
      injectStyles();
      onKeyDown = (event) => {
        const combo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "KeyH";
        if (!combo) return;
        event.preventDefault();
        openSettings();
      };
      window.addEventListener("keydown", onKeyDown);
      log6.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H");
    },
    stop() {
      if (onKeyDown) {
        window.removeEventListener("keydown", onKeyDown);
        onKeyDown = null;
      }
      closeSettings();
    }
  });

  // src/core/common/context-menu.ts
  var log7 = logger("context-menu");
  var navPatches = /* @__PURE__ */ new Map();
  var lastTarget = null;
  var trackingInstalled = false;
  function installTargetTracking() {
    if (trackingInstalled || typeof document === "undefined") return;
    trackingInstalled = true;
    document.addEventListener(
      "contextmenu",
      (e) => {
        lastTarget = e.target ?? null;
      },
      true
    );
  }
  function getContextMenuTarget() {
    return lastTarget;
  }
  var menuItemComponent = null;
  function getMenuItemComponent() {
    return menuItemComponent;
  }
  function findMenuItemType(children) {
    for (const child of children) {
      if (child == null) continue;
      if (Array.isArray(child)) {
        const found = findMenuItemType(child);
        if (found) return found;
      }
      const props = child.props;
      if (child.type && props && typeof props.id === "string" && (props.action != null || props.label != null || props.render != null || props.onClick != null || props.subtext != null)) {
        return child.type;
      }
      const sub = props?.children;
      if (sub) {
        const found = findMenuItemType(Array.isArray(sub) ? sub : [sub]);
        if (found) return found;
      }
    }
    return null;
  }
  function addContextMenuPatch(navId, callback) {
    installTargetTracking();
    const ids = Array.isArray(navId) ? navId : [navId];
    for (const id of ids) {
      let set = navPatches.get(id);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        navPatches.set(id, set);
      }
      set.add(callback);
    }
    return () => {
      for (const id of ids) navPatches.get(id)?.delete(callback);
    };
  }
  function removeContextMenuPatch(navId, callback) {
    const ids = Array.isArray(navId) ? navId : [navId];
    for (const id of ids) navPatches.get(id)?.delete(callback);
  }
  function cloneChildren(children) {
    if (Array.isArray(children)) return children.slice();
    return children == null ? [] : [children];
  }
  function usePatchContextMenu(props) {
    try {
      if (!props || typeof props.navId !== "string") return props;
      if (!menuItemComponent && props.children != null) {
        menuItemComponent = findMenuItemType(cloneChildren(props.children));
      }
      const set = navPatches.get(props.navId);
      if (!set || set.size === 0) return props;
      const next = { ...props, children: cloneChildren(props.children) };
      for (const cb of set) {
        try {
          cb(next.children);
        } catch (err) {
          log7.error(`context-menu patch for "${props.navId}" threw`, err);
        }
      }
      return next;
    } catch (err) {
      log7.error("failed to apply context-menu patches", err);
      return props;
    }
  }

  // src/plugins/context-menu-api/index.ts
  var context_menu_api_default = definePlugin({
    id: "context-menu-api",
    name: "\u53F3\u952E\u83DC\u5355 API",
    description: "\u4E3A\u5176\u4ED6\u63D2\u4EF6\u63D0\u4F9B\u5411 Discord \u53F3\u952E\u83DC\u5355\u6CE8\u5165\u83DC\u5355\u9879\u7684\u80FD\u529B\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "misc",
    required: true,
    hidden: true,
    patches: [
      {
        // The central menu component. Inject our hook at the very top of the
        // function body, right before it destructures navId out of its props.
        label: "context-menu central handler",
        find: "Menu API only allows Items",
        replacement: {
          match: /(?=let\{navId:)(?<=function [A-Za-z_$][\w$]*\(([A-Za-z_$][\w$]*)\).+?)/,
          replace: "$1=$self._usePatchContextMenu($1);"
        }
      }
    ],
    /** Called from the patched menu component with its props. */
    _usePatchContextMenu(props) {
      return usePatchContextMenu(props);
    }
  });

  // src/core/patcher/index.ts
  var log8 = logger("patcher");
  var INSTALLED = Symbol("halcyon.patch");
  function ensureInstalled(target, method) {
    const current = target[method];
    if (current && current[INSTALLED]) {
      return current[INSTALLED];
    }
    if (typeof current !== "function") {
      throw new TypeError(`cannot patch "${method}": not a function`);
    }
    const hooks = {
      before: /* @__PURE__ */ new Set(),
      instead: /* @__PURE__ */ new Set(),
      after: /* @__PURE__ */ new Set(),
      original: current
    };
    const wrapper = function(...args) {
      const ctx = {
        args,
        result: void 0,
        self: this,
        callOriginal: () => hooks.original.apply(this, ctx.args)
      };
      for (const hook of hooks.before) {
        try {
          hook(ctx);
        } catch (err) {
          log8.error(`before-hook on "${method}" threw`, err);
        }
      }
      if (hooks.instead.size) {
        let outcome;
        let ran = false;
        for (const hook of hooks.instead) {
          try {
            outcome = hook(ctx);
            ran = true;
          } catch (err) {
            log8.error(`instead-hook on "${method}" threw; falling back to original`, err);
            outcome = ctx.callOriginal();
            ran = true;
          }
        }
        ctx.result = ran ? outcome : ctx.callOriginal();
      } else {
        try {
          ctx.result = hooks.original.apply(this, ctx.args);
        } catch (err) {
          throw err;
        }
      }
      for (const hook of hooks.after) {
        try {
          hook(ctx);
        } catch (err) {
          log8.error(`after-hook on "${method}" threw`, err);
        }
      }
      return ctx.result;
    };
    Object.defineProperty(wrapper, "name", { value: current.name, configurable: true });
    Object.defineProperty(wrapper, "length", { value: current.length, configurable: true });
    wrapper.toString = () => hooks.original.toString();
    wrapper[INSTALLED] = hooks;
    Object.assign(wrapper, current);
    target[method] = wrapper;
    return hooks;
  }
  function maybeRestore(target, method, hooks) {
    if (hooks.before.size || hooks.instead.size || hooks.after.size) return;
    if (target[method] && target[method][INSTALLED] === hooks) {
      target[method] = hooks.original;
    }
  }
  function attach(kind, target, method, hook) {
    if (target == null) {
      log8.error(`refusing to patch "${method}" on a null target`);
      return () => {
      };
    }
    let hooks;
    try {
      hooks = ensureInstalled(target, method);
    } catch (err) {
      log8.error(err);
      return () => {
      };
    }
    hooks[kind].add(hook);
    let live = true;
    return () => {
      if (!live) return;
      live = false;
      hooks[kind].delete(hook);
      maybeRestore(target, method, hooks);
    };
  }
  var patcher = {
    /** Run before the original. Edit `ctx.args` to change what it receives. */
    before(target, method, hook) {
      return attach("before", target, method, hook);
    },
    /** Run after the original. Edit `ctx.result` to change what callers see. */
    after(target, method, hook) {
      return attach("after", target, method, hook);
    },
    /** Replace the original. Call `ctx.callOriginal()` to defer to it. */
    instead(target, method, hook) {
      return attach("instead", target, method, hook);
    }
  };

  // src/core/common/discord.ts
  var Dispatcher = lazy(isFluxDispatcher);
  function getDispatcher() {
    for (const store of [GuildStore, ChannelStore, ReadStateStore]) {
      try {
        const viaStore = store?._dispatcher;
        if (isFluxDispatcher(viaStore)) return viaStore;
      } catch {
      }
    }
    return find(isFluxDispatcher);
  }
  var MessageStore = lazy(
    (m) => m?.getName?.() === "MessageStore" || typeof m?.getMessage === "function" && typeof m?.getMessages === "function" && typeof m?.__halcyon_probe__ === "undefined"
  );
  var MessageActions = lazy(
    (m) => typeof m?.editMessage === "function" && typeof m?.deleteMessage === "function"
  );
  var UserStore = lazy(
    (m) => m?.getName?.() === "UserStore" || typeof m?.getCurrentUser === "function" && typeof m?.getUser === "function" && typeof m?.__halcyon_probe__ === "undefined"
  );
  var ChannelStore = lazy(
    (m) => m?.getName?.() === "ChannelStore" || m?.constructor?.displayName === "ChannelStore"
  );
  var SelectedChannelStore = lazy(
    (m) => m?.getName?.() === "SelectedChannelStore" || typeof m?.getChannelId === "function" && typeof m?.getLastSelectedChannelId === "function" && typeof m?.__halcyon_probe__ === "undefined"
  );
  var GuildStore = lazy(
    (m) => m?.getName?.() === "GuildStore" || m?.constructor?.displayName === "GuildStore"
  );
  var GuildChannelStore = lazy(
    (m) => (
      // Name-only, exactly like Vencord's findStoreLazy. A shape probe
      // (getChannels/getDefaultChannel "look like" functions) also matches
      // Discord's intl `t` proxy — which answers every property — so getChannels()
      // returned {locale, ast, deleted} instead of real channels, and the scan
      // collected zero. The proxy's getName() is a message object, never the
      // string, so a name check rejects it.
      m?.getName?.() === "GuildChannelStore"
    )
  );
  var GuildSubscriptions = lazy(
    (m) => typeof m?.subscribeToGuild === "function" || typeof m?.subscribeToChannel === "function"
  );
  var moment = lazy((m) => typeof m === "function" && typeof m?.locale === "function" && typeof m?.utc === "function");
  var NavigationRouter = lazy(
    (m) => typeof m?.transitionTo === "function" && // One companion method to avoid matching a bare transitionTo-only helper.
    // NOT the full {replaceWith AND transitionToGuild} triple: on the current
    // build the real router doesn't expose transitionToGuild, so requiring it
    // made this resolve to NOTHING — which sent NavigationRouter callers down
    // their fallback path (quest-indicator to `location.href`, i.e. a full page
    // reload — the "任务中心变成刷新了" report — and the log-page jump to a warn).
    // The intl-proxy is rejected by the __halcyon_probe__ guard alone, so the
    // companion check only needs to be specific enough, not exhaustive.
    (typeof m?.replaceWith === "function" || typeof m?.transitionToGuild === "function" || typeof m?.back === "function") && // Reject Discord's answer-everything intl `t` proxy, which reports EVERY
    // property as callable — so it satisfies any method probe and would win.
    typeof m?.__halcyon_probe__ === "undefined"
  );
  function navigate(path) {
    try {
      const router = NavigationRouter;
      if (typeof router?.transitionTo === "function") {
        router.transitionTo(path);
        return true;
      }
    } catch {
    }
    let scanned;
    try {
      scanned = find(
        (x) => typeof x?.transitionTo === "function" && typeof x?.__halcyon_probe__ === "undefined"
      );
      if (typeof scanned?.transitionTo === "function") {
        scanned.transitionTo(path);
        return true;
      }
    } catch {
    }
    try {
      const candidates = [NavigationRouter, scanned];
      try {
        candidates.push(
          find((x) => typeof x?.getHistory === "function" && typeof x?.__halcyon_probe__ === "undefined")
        );
      } catch {
      }
      for (const c of candidates) {
        try {
          const history2 = c?.getHistory?.();
          if (history2 && typeof history2.push === "function") {
            history2.push(path);
            return true;
          }
        } catch {
        }
      }
    } catch {
    }
    return false;
  }
  var AppLayers = lazy(
    (m) => typeof m?.popLayer === "function" && typeof m?.pushLayer === "function" && // Same intl-proxy rejection as NavigationRouter above.
    typeof m?.__halcyon_probe__ === "undefined"
  );
  var JumpActions = lazy(
    (m) => typeof m?.jumpToMessage === "function" && typeof m?.__halcyon_probe__ === "undefined"
  );
  var RestAPI = lazy(
    (m) => (
      // EXACTLY Vencord's discriminator: an *object* carrying `del` AND `put`.
      // This is what reliably picks Discord's real authenticated API client.
      // Every earlier attempt failed on the wrong signal: requiring
      // `getAPIBaseURL` matched nothing (this build doesn't expose it where our
      // scan looks), and requiring get/post/put/del-as-functions matched a
      // generic no-op HTTP client that answered 200 with an empty body and
      // created nothing (the silent sticker-upload failure).
      typeof m === "object" && typeof m?.del === "function" && typeof m?.put === "function" && // Reject Discord's intl `t` proxy, which answers EVERY property access with
      // a message value — so del/put "look like" functions and it wins the probe.
      // A real module returns undefined for a name it doesn't export; the
      // answer-everything proxy returns a (truthy) message, failing this guard.
      typeof m?.__halcyon_probe__ === "undefined"
    )
  );
  var PermissionStore = lazy(
    (m) => m?.getName?.() === "PermissionStore" && typeof m?.can === "function"
  );
  var EmojiStore = lazy((m) => m?.getName?.() === "EmojiStore");
  var Constants = lazy(
    (m) => typeof m?.Endpoints?.GUILD_STICKER_PACKS === "function"
  );
  var StickersStore = lazy((m) => m?.getName?.() === "StickersStore");
  var QuestsStore = lazy((m) => m?.getName?.() === "QuestsStore");
  var ReadStateStore = lazy(
    (m) => (
      // Name-only (see GuildChannelStore): the method-shape fallback also matched
      // Discord's answer-everything intl proxy, so hasUnread() returned a truthy
      // message object for every channel. The store's registered name is stable.
      m?.getName?.() === "ReadStateStore"
    )
  );
  var ActiveJoinedThreadsStore = lazy(
    (m) => m?.getName?.() === "ActiveJoinedThreadsStore"
  );
  var Toasts = lazy(
    (m) => typeof m?.showToast === "function" && typeof m?.createToast === "function" && // Reject Discord's intl `t` proxy, which answers EVERY property as a
    // callable — so showToast/createToast "look like" functions and it wins the
    // probe (which is why toasts silently never appeared). A real module returns
    // undefined for a name it doesn't export; the answer-everything proxy does not.
    typeof m?.__halcyon_probe__ === "undefined"
  );
  function showToast(message, type = "info") {
    try {
      const T = Toasts;
      const typeEnum = T?.Type ?? {};
      const resolved = type === "success" ? typeEnum.SUCCESS ?? 1 : type === "failure" ? typeEnum.FAILURE ?? 2 : typeEnum.MESSAGE ?? typeEnum.INFO ?? 0;
      if (typeof T?.showToast === "function" && typeof T?.createToast === "function") {
        T.showToast(T.createToast(message, resolved));
      }
    } catch {
    }
  }

  // src/core/settings/index.ts
  var log9 = logger("settings");
  function deepClone(value) {
    if (value === null || typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
  }
  function defineSettings(schema) {
    const listeners = /* @__PURE__ */ new Map();
    let boundId = null;
    const values = {};
    for (const key of Object.keys(schema)) {
      values[key] = deepClone(schema[key].default);
    }
    const persist = () => {
      if (boundId) saveNamespace(boundId, values);
    };
    const notify = (key, next, prev) => {
      const set = listeners.get(key);
      if (!set) return;
      for (const listener of set) {
        try {
          listener(next, prev);
        } catch (err) {
          log9.error(`settings listener for "${key}" threw`, err);
        }
      }
    };
    const store = new Proxy(values, {
      get: (target, key) => target[key],
      set: (target, key, value) => {
        if (!(key in schema)) {
          log9.warn(`ignoring write to unknown setting "${key}"`);
          return true;
        }
        const prev = target[key];
        if (Object.is(prev, value)) return true;
        target[key] = value;
        persist();
        notify(key, value, prev);
        return true;
      }
    });
    return {
      schema,
      store,
      subscribe(key, listener) {
        const k = key;
        let set = listeners.get(k);
        if (!set) {
          set = /* @__PURE__ */ new Set();
          listeners.set(k, set);
        }
        set.add(listener);
        return () => void set.delete(listener);
      },
      reset(key) {
        if (key != null) {
          store[key] = deepClone(schema[key].default);
          return;
        }
        for (const k of Object.keys(schema)) {
          store[k] = deepClone(schema[k].default);
        }
      },
      __bind(pluginId) {
        boundId = pluginId;
        const saved = loadNamespace(pluginId);
        for (const k of Object.keys(schema)) {
          if (Object.prototype.hasOwnProperty.call(saved, k)) {
            values[k] = saved[k];
          }
        }
      }
    };
  }

  // src/plugins/message-logger/settings.ts
  var settings = defineSettings({
    // --- 记录 -----------------------------------------------------------------
    keepDeletedInChat: {
      group: "\u8BB0\u5F55",
      type: "boolean",
      default: true,
      label: "\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",
      description: "\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"
    },
    toolbarButton: {
      group: "\u8BB0\u5F55",
      type: "boolean",
      default: true,
      label: "\u9891\u9053\u9876\u680F\u52A0\u300C\u6D88\u606F\u8BB0\u5F55\u300D\u6309\u94AE",
      description: "\u5728\u9891\u9053\u53F3\u4E0A\u89D2\u5DE5\u5177\u6761\u653E\u4E00\u4E2A\u56FE\u6807\uFF0C\u70B9\u4E00\u4E0B\u76F4\u63A5\u6253\u5F00\u6D88\u606F\u8BB0\u5F55\u9875\uFF0C\u4E0D\u7528\u7FFB\u8BBE\u7F6E\u3002"
    },
    logEdits: {
      group: "\u8BB0\u5F55",
      type: "boolean",
      default: true,
      label: "\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",
      description: "\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"
    },
    retention: {
      group: "\u8BB0\u5F55",
      type: "number",
      default: 50,
      label: "\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",
      description: "0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",
      min: 0,
      max: 500,
      step: 10
    },
    // --- 外观 -----------------------------------------------------------------
    deleteStyle: {
      group: "\u5916\u89C2",
      type: "select",
      default: "tint",
      label: "\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",
      description: "\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",
      options: [
        { value: "tint", label: "\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761" },
        { value: "text", label: "\u6B63\u6587\u53D8\u7EA2" },
        { value: "ghost", label: "\u534A\u900F\u660E\u6DE1\u51FA" },
        { value: "strike", label: "\u7EA2\u8272\u5220\u9664\u7EBF" }
      ]
    },
    showDeletedMarker: {
      group: "\u5916\u89C2",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",
      description: "\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"
    },
    showEditedMarker: {
      group: "\u5916\u89C2",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u7F16\u8F91\u6807\u8BB0\u884C",
      description: "\u5728\u7F16\u8F91\u8FC7\u7684\u6D88\u606F\u65C1\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91\u201D\u4E0E\u7F16\u8F91\u65F6\u95F4\uFF08\u6CBF\u7528\u4E0B\u65B9\u6807\u8BB0\u7684\u56FE\u6807 / \u5916\u89C2 / \u65F6\u95F4\u8BBE\u7F6E\uFF09\u3002"
    },
    markerIcon: {
      group: "\u5916\u89C2",
      type: "select",
      default: "trash",
      label: "\u6807\u8BB0\u56FE\u6807",
      description: "\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",
      options: [
        { value: "trash", label: "\u{1F5D1} \u5783\u573E\u6876" },
        { value: "shield", label: "\u{1F6E1} \u76FE\u724C" },
        { value: "warning", label: "\u26A0 \u8B66\u544A\u4E09\u89D2" },
        { value: "none", label: "\u65E0\u56FE\u6807" }
      ]
    },
    markerLook: {
      group: "\u5916\u89C2",
      type: "select",
      default: "plain",
      label: "\u6807\u8BB0\u5916\u89C2",
      description: "\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",
      options: [
        { value: "plain", label: "\u7EAF\u6587\u5B57" },
        { value: "badge", label: "\u5706\u89D2\u5FBD\u7AE0" },
        { value: "quote", label: "\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09" }
      ]
    },
    markerTime: {
      group: "\u5916\u89C2",
      type: "select",
      default: "time",
      label: "\u6807\u8BB0\u65F6\u95F4\u683C\u5F0F",
      description: "\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",
      options: [
        { value: "time", label: "\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09" },
        { value: "datetime", label: "\u65E5\u671F + \u65F6\u95F4" },
        { value: "none", label: "\u4E0D\u663E\u793A\u65F6\u95F4" }
      ]
    },
    // --- 屏蔽对象 ---------------------------------------------------------------
    // Every rule below gates BOTH capture paths: the recorder (log page) and
    // the in-chat red retention, via isIgnored().
    ignoreBots: {
      group: "\u5C4F\u853D\u5BF9\u8C61",
      type: "boolean",
      default: false,
      label: "\u5C4F\u853D\u673A\u5668\u4EBA",
      description: "\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"
    },
    ignoreSelf: {
      group: "\u5C4F\u853D\u5BF9\u8C61",
      type: "boolean",
      default: false,
      label: "\u5C4F\u853D\u81EA\u5DF1",
      description: "\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"
    },
    ignoredUsers: {
      group: "\u5C4F\u853D\u5BF9\u8C61",
      type: "string-list",
      default: [],
      label: "\u5C4F\u853D\u7684\u7528\u6237",
      description: "\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",
      itemPlaceholder: "\u7528\u6237 ID"
    },
    ignoredChannels: {
      group: "\u5C4F\u853D\u5BF9\u8C61",
      type: "string-list",
      default: [],
      label: "\u5C4F\u853D\u7684\u9891\u9053",
      description: "\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",
      itemPlaceholder: "\u9891\u9053 ID"
    }
  });

  // src/plugins/message-logger/store.ts
  var log10 = logger("message-logger");
  var DATA_NS = "message-logger.log";
  var SAVE_DEBOUNCE = 500;
  var MAX_SAVE_WAIT = 3e3;
  var SIZE_BUDGET = 3e6;
  var MessageLogStore = class {
    deleted = [];
    edited = [];
    /**
     * Per-channel cap; 0 means unlimited. Starts UNLIMITED on purpose. `load()`
     * used to trim with whatever this default was, i.e. BEFORE the plugin had
     * applied the user's setting — so a user who set 500 (precisely because of a
     * 冲水) still had the log cut to the default on every launch, and the next
     * save wrote that truncation back to disk permanently. It can now only ever
     * narrow from setRetention(), i.e. from a value the user actually chose.
     */
    retention = 0;
    listeners = /* @__PURE__ */ new Set();
    saveTimer;
    /** `${channelId}:${id}` of every deleted entry — for per-render lookups. */
    deletedIndex = /* @__PURE__ */ new Set();
    /**
     * Deleted-entry count per channel. Lets an insert know whether a trim is even
     * possible without scanning the whole log: a 200-message flush used to pay a
     * full filter + Set rebuild per delete, inside Discord's dispatch.
     */
    channelCounts = /* @__PURE__ */ new Map();
    /** When the oldest still-unwritten change happened (max-wait accounting). */
    deferredSince;
    /** Set by clear(): the only case where persisting an empty log is intended. */
    userCleared = false;
    /** Last prune summary, so a repeated oversized save doesn't repeat the warning. */
    lastPruneNote = "";
    /** Load persisted history. Safe to call before the first record. */
    load() {
      const raw = loadNamespace(DATA_NS);
      this.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
      this.edited = Array.isArray(raw.edited) ? raw.edited : [];
      this.userCleared = false;
      this.reindex();
    }
    /** O(1) "was this message deleted" — cheap enough for render paths. */
    isDeleted(channelId, id) {
      return this.deletedIndex.has(`${channelId}:${id}`);
    }
    /** The deleted-entry record for a message, if any. */
    findDeleted(channelId, id) {
      if (!this.isDeleted(channelId, id)) return void 0;
      return this.deleted.find((d) => d.channelId === channelId && d.id === id);
    }
    setRetention(n) {
      const next = Math.max(0, n | 0);
      if (next === this.retention) return;
      this.retention = next;
      if (this.trimDeleted()) this.reindex();
      this.scheduleSave();
      this.emit();
    }
    recordDeleted(entry) {
      if (this.deletedIndex.has(`${entry.channelId}:${entry.id}`)) return;
      this.deleted.unshift(entry);
      this.deletedIndex.add(`${entry.channelId}:${entry.id}`);
      this.channelCounts.set(entry.channelId, (this.channelCounts.get(entry.channelId) ?? 0) + 1);
      if (this.retention > 0 && (this.channelCounts.get(entry.channelId) ?? 0) > this.retention) {
        if (this.trimDeleted()) this.reindex();
      }
      this.scheduleSave();
      this.emit();
    }
    recordEdit(id, channelId, author, previous, guildId) {
      const now = Date.now();
      let entry = this.edited.find((e) => e.id === id);
      if (!entry) {
        entry = { id, channelId, guildId, author, history: [{ content: previous, at: now }], updatedAt: now };
        this.edited.unshift(entry);
      } else {
        const last = entry.history[entry.history.length - 1];
        if (last?.content === previous) return;
        entry.history.push({ content: previous, at: now });
        entry.updatedAt = now;
      }
      if (this.edited.length > 300) this.edited.length = 300;
      this.scheduleSave();
      this.emit();
    }
    getDeleted() {
      return this.deleted;
    }
    getEdited() {
      return this.edited;
    }
    counts() {
      return { deleted: this.deleted.length, edited: this.edited.length };
    }
    /**
     * Empty the log. `what` scopes it to one list — the page's 清空 button sits in
     * a shared tab bar, so an unscoped clear from the 已编辑 tab used to destroy
     * every recorded deletion too, which reads exactly like the plugin eating
     * messages.
     */
    clear(what = "all") {
      if (what !== "edited") this.deleted = [];
      if (what !== "deleted") this.edited = [];
      this.userCleared = this.deleted.length === 0 && this.edited.length === 0;
      this.reindex();
      this.scheduleSave();
      this.emit();
    }
    toJSON() {
      return JSON.stringify({ deleted: this.deleted, edited: this.edited }, null, 2);
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => void this.listeners.delete(listener);
    }
    /** Flush any pending save immediately (plugin stop, and page unload). */
    flush() {
      if (this.saveTimer !== void 0) {
        clearTimeout(this.saveTimer);
        this.saveTimer = void 0;
      }
      this.save();
    }
    // --- internals -----------------------------------------------------------
    /**
     * Drop entries beyond the per-channel cap, newest kept. Returns whether
     * anything was actually removed, so callers can skip the index rebuild.
     *
     * Trims by RECENCY, not array position: `deleted` is maintained newest-first
     * by unshift, but a bulk delete whose ids arrive newest-first (or a record
     * spliced in out of order) could otherwise evict a NEWER entry than the one it
     * kept. Sorting the per-channel view by deletedAt makes the cap mean what the
     * setting says: keep the most recent N for this channel.
     */
    trimDeleted() {
      if (this.retention <= 0) return false;
      const byChannel = /* @__PURE__ */ new Map();
      for (const d of this.deleted) {
        let list = byChannel.get(d.channelId);
        if (!list) byChannel.set(d.channelId, list = []);
        list.push(d);
      }
      const doomed = /* @__PURE__ */ new Set();
      for (const list of byChannel.values()) {
        if (list.length <= this.retention) continue;
        const ranked = list.slice().sort((a, b) => b.deletedAt - a.deletedAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
        for (const d of ranked.slice(this.retention)) doomed.add(d);
      }
      if (doomed.size === 0) return false;
      this.deleted = this.deleted.filter((d) => !doomed.has(d));
      this.recount();
      return true;
    }
    /** Rebuild the per-channel counters from `deleted`. */
    recount() {
      this.channelCounts.clear();
      for (const d of this.deleted) {
        this.channelCounts.set(d.channelId, (this.channelCounts.get(d.channelId) ?? 0) + 1);
      }
    }
    reindex() {
      this.deletedIndex = new Set(this.deleted.map((d) => `${d.channelId}:${d.id}`));
      this.recount();
    }
    emit() {
      for (const fn of this.listeners) {
        try {
          fn();
        } catch {
        }
      }
    }
    scheduleSave() {
      if (this.deferredSince === void 0) this.deferredSince = Date.now();
      if (Date.now() - this.deferredSince >= MAX_SAVE_WAIT) {
        this.flush();
        return;
      }
      if (this.saveTimer !== void 0) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE);
    }
    save() {
      this.saveTimer = void 0;
      this.deferredSince = void 0;
      try {
        if (this.deleted.length === 0 && this.edited.length === 0 && !this.userCleared) {
          const stored = loadNamespace(DATA_NS);
          const hadData = Array.isArray(stored.deleted) && stored.deleted.length > 0 || Array.isArray(stored.edited) && stored.edited.length > 0;
          if (hadData) {
            log10.warn("\u8DF3\u8FC7\u4E00\u6B21\u4FDD\u5B58\uFF1A\u5185\u5B58\u4E2D\u7684\u8BB0\u5F55\u4E3A\u7A7A\uFF0C\u4F46\u78C1\u76D8\u4E0A\u6709\u8BB0\u5F55\uFF0C\u62D2\u7EDD\u8986\u76D6\uFF08\u5B58\u50A8\u5C1A\u672A\u5C31\u7EEA\uFF1F\uFF09");
            return;
          }
        }
        const payload = this.withinBudget();
        saveNamespace(DATA_NS, { deleted: payload.deleted, edited: payload.edited });
      } catch (err) {
        log10.error("failed to persist message log", err);
      }
    }
    /**
     * The payload to persist, shrunk to fit `SIZE_BUDGET`.
     *
     * Neither backend survives an oversized write, and neither reports it usefully:
     * localStorage throws QuotaExceededError (caught and logged, then every
     * subsequent save fails too), and the extension's chrome.storage bridge writes
     * without reading `runtime.lastError` at all — so the log looks perfect all
     * session and silently reverts on the next launch. A heavy account serializes
     * to well over the quota, mostly embeds. Shedding weight, loudly, beats losing
     * the lot: embeds go first (they only enrich a revived row), then the oldest
     * entries.
     *
     * Sizes are measured ONCE per entry and then tracked arithmetically. The
     * obvious implementation — re-stringify the whole log to test each candidate
     * trim — is O(n²) and froze the client outright: 10k entries took 107 SECONDS
     * of blocking main-thread work on every save.
     */
    withinBudget() {
      const edited = this.edited;
      const overhead = JSON.stringify({ deleted: [], edited }).length;
      const sizes = this.deleted.map((d) => JSON.stringify(d).length + 1);
      let total = overhead + sizes.reduce((a, b) => a + b, 0);
      if (total <= SIZE_BUDGET) {
        this.lastPruneNote = "";
        return { deleted: this.deleted, edited };
      }
      const deleted = this.deleted.slice();
      let strippedEmbeds = 0;
      for (let i = deleted.length - 1; i >= 0 && total > SIZE_BUDGET; i--) {
        const d = deleted[i];
        if (!d.embeds?.length) continue;
        const lean = { ...d, embeds: void 0 };
        const leanSize = JSON.stringify(lean).length + 1;
        total -= sizes[i] - leanSize;
        sizes[i] = leanSize;
        deleted[i] = lean;
        strippedEmbeds++;
      }
      let droppedEntries = 0;
      while (deleted.length > 1 && total > SIZE_BUDGET) {
        total -= sizes[sizes.length - 1];
        sizes.pop();
        deleted.pop();
        droppedEntries++;
      }
      const note = `${strippedEmbeds}/${droppedEntries}`;
      if (note !== this.lastPruneNote) {
        this.lastPruneNote = note;
        log10.warn(
          `\u6D88\u606F\u8BB0\u5F55\u8D85\u51FA\u5B58\u50A8\u9884\u7B97\uFF08${Math.round(SIZE_BUDGET / 1024)}KB\uFF09\uFF0C\u5DF2\u88C1\u526A\u540E\u4FDD\u5B58\uFF1A\u4E22\u5F03 ${strippedEmbeds} \u6761\u65E7\u8BB0\u5F55\u7684 embed\uFF0C\u5220\u9664 ${droppedEntries} \u6761\u6700\u65E7\u8BB0\u5F55\u3002\u5185\u5B58\u4E2D\u4ECD\u4FDD\u7559 ${this.deleted.length} \u6761\uFF1B\u5982\u9700\u957F\u671F\u4FDD\u7559\u8BF7\u8C03\u4F4E\u300C\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570\u300D\u6216\u5B9A\u671F\u5BFC\u51FA\u3002`
        );
      }
      return { deleted, edited };
    }
  };
  var messageLog = new MessageLogStore();

  // src/core/common/cdn.ts
  var ALLOWED_SIZES = [16, 32, 48, 56, 64, 80, 96, 128, 160, 256, 300, 512, 600, 1024, 2048, 4096];
  function normalizeSize(size, fallback) {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    let best = ALLOWED_SIZES[0];
    for (const candidate of ALLOWED_SIZES) {
      if (Math.abs(candidate - n) < Math.abs(best - n)) best = candidate;
    }
    return best;
  }
  function emojiCdnUrl(id, animated, size) {
    const px = normalizeSize(size, 48);
    const query = `size=${px}${animated ? "&animated=true" : ""}`;
    return `https://cdn.discordapp.com/emojis/${id}.webp?${query}`;
  }
  var StickerFormat = {
    PNG: 1,
    APNG: 2,
    LOTTIE: 3,
    GIF: 4
  };
  function stickerCdnUrl(id, formatType, size) {
    const px = normalizeSize(size, 160);
    const ext = formatType === StickerFormat.GIF ? "gif" : "png";
    return `https://media.discordapp.net/stickers/${id}.${ext}?size=${px}`;
  }

  // src/plugins/message-logger/render-content.tsx
  var EMOJI_TOKEN = /<(a)?:([A-Za-z0-9_]+):(\d+)>/g;
  function renderContent(content) {
    const parts = [];
    let cursor = 0;
    let key = 0;
    EMOJI_TOKEN.lastIndex = 0;
    for (let m = EMOJI_TOKEN.exec(content); m; m = EMOJI_TOKEN.exec(content)) {
      if (m.index > cursor) {
        parts.push(/* @__PURE__ */ React.createElement("span", { key: key++ }, content.slice(cursor, m.index)));
      }
      const [, animated, name, id] = m;
      parts.push(
        /* @__PURE__ */ React.createElement(
          "img",
          {
            key: key++,
            className: "hc-emoji",
            src: emojiCdnUrl(id, Boolean(animated), 48),
            alt: `:${name}:`,
            title: `:${name}:`,
            draggable: false,
            loading: "lazy"
          }
        )
      );
      cursor = m.index + m[0].length;
    }
    if (parts.length === 0) return content;
    if (cursor < content.length) {
      parts.push(/* @__PURE__ */ React.createElement("span", { key: key++ }, content.slice(cursor)));
    }
    return parts;
  }

  // src/plugins/message-logger/ui/LogPage.tsx
  var log11 = logger("message-logger");
  function useLog() {
    const [snapshot, setSnapshot] = useState(() => ({
      deleted: messageLog.getDeleted(),
      edited: messageLog.getEdited()
    }));
    useEffect(() => {
      const update = () => setSnapshot({ deleted: messageLog.getDeleted(), edited: messageLog.getEdited() });
      update();
      return messageLog.subscribe(update);
    }, []);
    return snapshot;
  }
  var PAGE_SIZE2 = 25;
  function InChatStatus() {
    const [snapshot, setSnapshot] = useState(
      () => getSourcePatchReport().filter((p) => p.pluginId === "message-logger")
    );
    useEffect(() => {
      const tick = () => setSnapshot(getSourcePatchReport().filter((p) => p.pluginId === "message-logger"));
      tick();
      const t = setInterval(tick, 3e3);
      return () => clearInterval(t);
    }, []);
    if (snapshot.length === 0) return null;
    const failed = snapshot.filter((p) => !p.applied);
    if (failed.length === 0) return null;
    const critical = failed.find((p) => p.label === "keep deleted message in store");
    const title = critical ? "\u804A\u5929\u4E2D\u7684\u7EA2\u8272\u5360\u4F4D\u672A\u751F\u6548" : "\u90E8\u5206\u804A\u5929\u5185\u8865\u4E01\u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C";
    const detail = critical ? "\u88AB\u5220\u9664\u7684\u6D88\u606F\u4ECD\u7136\u8BB0\u5F55\u5728\u4E0B\u65B9\u5217\u8868\uFF0C\u4F46\u5728\u804A\u5929\u91CC\u4F1A\u76F4\u63A5\u6D88\u5931\u3002\u6838\u5FC3\u8865\u4E01 keep-deleted \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\u3002" : "\u8BB0\u5F55\u529F\u80FD\u6B63\u5E38\uFF0C\u4F46\u804A\u5929\u4E2D\u7684\u7F16\u8F91\u5386\u53F2 / \u5220\u9664\u6807\u8BB0\u53EF\u80FD\u65E0\u6CD5\u663E\u793A\u3002";
    return /* @__PURE__ */ React.createElement("div", { className: "hc-mlog-warn" }, /* @__PURE__ */ React.createElement("div", { className: "hc-mlog-warn__title" }, title), /* @__PURE__ */ React.createElement("div", { className: "hc-mlog-warn__detail" }, detail), /* @__PURE__ */ React.createElement("ul", { className: "hc-mlog-warn__list" }, failed.map((p) => /* @__PURE__ */ React.createElement("li", { key: p.label }, "\u201C", p.label, "\u201D"))), /* @__PURE__ */ React.createElement("div", { className: "hc-mlog-warn__detail" }, "\u8BF7\u628A\u6B64\u5904\u4EE5\u53CA\u65E5\u5FD7\u9875\u91CC \u201CHalcyon modules\u201D \u76F8\u5173\u7684\u8F93\u51FA\u53D1\u7ED9\u5F00\u53D1\u8005\u5B9A\u4F4D\u3002"));
  }
  function LogPage() {
    const { deleted, edited } = useLog();
    const [tab, setTab] = useState("deleted");
    const [pages, setPages] = useState({ deleted: 0, edited: 0 });
    const [query, setQuery] = useState("");
    const all = tab === "deleted" ? deleted : edited;
    const needle = query.trim().toLowerCase();
    const entries = needle ? all.filter((e) => entryMatches(e, needle)) : all;
    const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE2));
    const page = Math.min(pages[tab], pageCount - 1);
    const visible = entries.slice(page * PAGE_SIZE2, (page + 1) * PAGE_SIZE2);
    const goTo = (next) => setPages((prev) => ({ ...prev, [tab]: Math.max(0, Math.min(pageCount - 1, next)) }));
    const onQuery = (value) => {
      setQuery(value);
      setPages((prev) => ({ ...prev, [tab]: 0 }));
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(InChatStatus, null), /* @__PURE__ */ React.createElement("div", { className: "hc-tabs" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-tab",
        "data-active": tab === "deleted",
        onClick: () => setTab("deleted")
      },
      /* @__PURE__ */ React.createElement(TrashIcon, { size: 16 }),
      " \u5DF2\u5220\u9664",
      deleted.length > 0 && /* @__PURE__ */ React.createElement(Badge, { tone: "red" }, deleted.length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-tab",
        "data-active": tab === "edited",
        onClick: () => setTab("edited")
      },
      /* @__PURE__ */ React.createElement(PencilIcon, { size: 16 }),
      " \u5DF2\u7F16\u8F91",
      edited.length > 0 && /* @__PURE__ */ React.createElement(Badge, { tone: "orange" }, edited.length)
    ), /* @__PURE__ */ React.createElement("div", { className: "hc-tabs__spacer" }), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", icon: /* @__PURE__ */ React.createElement(DownloadIcon, { size: 16 }), onClick: exportLog }, "\u5BFC\u51FA"), /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "destructive",
        onClick: () => messageLog.clear(tab),
        disabled: all.length === 0,
        title: tab === "deleted" ? "\u6E05\u7A7A\u300C\u5DF2\u5220\u9664\u300D\u8BB0\u5F55" : "\u6E05\u7A7A\u300C\u5DF2\u7F16\u8F91\u300D\u8BB0\u5F55"
      },
      "\u6E05\u7A7A",
      tab === "deleted" ? "\u5DF2\u5220\u9664" : "\u5DF2\u7F16\u8F91"
    )), /* @__PURE__ */ React.createElement("div", { className: "hc-mlog-search" }, /* @__PURE__ */ React.createElement(SearchIcon, { size: 18 }), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: query,
        onChange: (event) => onQuery(event.currentTarget.value),
        placeholder: "\u641C\u7D22\u4F5C\u8005\u3001\u5185\u5BB9\u3001\u670D\u52A1\u5668 / \u9891\u9053",
        "aria-label": "\u641C\u7D22\u6D88\u606F\u8BB0\u5F55"
      }
    ), query && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-mlog-search__clear",
        "aria-label": "\u6E05\u9664\u641C\u7D22",
        onClick: () => onQuery("")
      },
      "\xD7"
    )), all.length === 0 ? tab === "deleted" ? /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: /* @__PURE__ */ React.createElement(TrashIcon, { size: 48 }),
        title: "\u8FD8\u6CA1\u6709\u8BB0\u5F55",
        subtitle: "\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"
      }
    ) : /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: /* @__PURE__ */ React.createElement(PencilIcon, { size: 48 }),
        title: "\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",
        subtitle: "\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"
      }
    ) : entries.length === 0 ? /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: /* @__PURE__ */ React.createElement(SearchIcon, { size: 48 }),
        title: "\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5F55",
        subtitle: `\u6CA1\u6709\u5305\u542B\u201C${query.trim()}\u201D\u7684\u8BB0\u5F55\uFF0C\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002`
      }
    ) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hc-msglist" }, tab === "deleted" ? visible.map((entry) => /* @__PURE__ */ React.createElement(DeletedRow, { key: `${entry.channelId}-${entry.id}`, entry })) : visible.map((entry) => /* @__PURE__ */ React.createElement(EditedRow, { key: `${entry.channelId}-${entry.id}`, entry }))), pageCount > 1 && /* @__PURE__ */ React.createElement(Pager, { page, pageCount, onChange: goTo })));
  }
  function Pager(props) {
    const { page, pageCount, onChange } = props;
    return /* @__PURE__ */ React.createElement("div", { className: "hc-pager" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: () => onChange(page - 1), disabled: page === 0 }, "\u4E0A\u4E00\u9875"), /* @__PURE__ */ React.createElement("span", { className: "hc-pager__label" }, "\u7B2C ", page + 1, " / ", pageCount, " \u9875"), /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "plain",
        onClick: () => onChange(page + 1),
        disabled: page >= pageCount - 1
      },
      "\u4E0B\u4E00\u9875"
    ));
  }
  function jumpToMessage(channelId, messageId, guildId) {
    dismissSettingsSurface();
    let gid = guildId;
    if (!gid) {
      try {
        const channel = ChannelStore.getChannel?.(channelId);
        gid = channel?.guild_id ?? channel?.guildId ?? void 0;
      } catch {
      }
    }
    const path = `/channels/${gid ?? "@me"}/${channelId}/${messageId}`;
    const selected = () => {
      try {
        return SelectedChannelStore.getChannelId?.();
      } catch {
        return void 0;
      }
    };
    const doJump = () => {
      const jump = JumpActions;
      if (typeof jump?.jumpToMessage === "function") {
        try {
          jump.jumpToMessage({ channelId, messageId, flash: true });
          if (selected() !== channelId) navigate(path);
          return;
        } catch (err) {
          log11.warn("[jump] jumpToMessage threw; falling back to route", err);
        }
      }
      if (!navigate(path)) {
        log11.warn("[jump] \u8DF3\u8F6C\u5931\u8D25\uFF1AJumpActions \u4E0E NavigationRouter \u5747\u672A\u89E3\u6790\u5230");
      }
    };
    const schedule = [80, 220, 450, 800];
    let i = 0;
    const tick = () => {
      doJump();
      const now = selected();
      const ok = now === channelId;
      log11.info(`[jump] \u7B2C ${i + 1} \u6B21 \xB7 now=${now ?? "?"} wanted=${channelId} ok=${ok}`);
      i++;
      if (!ok && i < schedule.length) {
        setTimeout(tick, schedule[i] - schedule[i - 1]);
      }
    };
    setTimeout(tick, schedule[0]);
  }
  function dismissSettingsSurface() {
    try {
      closeSettings();
    } catch {
    }
    try {
      const opts = { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent("keydown", opts));
      document.dispatchEvent(new KeyboardEvent("keyup", opts));
    } catch (err) {
      log11.error("[jump] escape dispatch failed", err);
    }
    try {
      if (typeof AppLayers.popLayer === "function") {
        AppLayers.popLayer();
      } else {
        getDispatcher()?.dispatch?.({ type: "LAYER_POP" });
      }
    } catch (err) {
      log11.error("[jump] layer pop failed", err);
    }
  }
  function JumpButton({ entry }) {
    return /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        variant: "plain",
        className: "hc-msg__jump",
        icon: /* @__PURE__ */ React.createElement(ChevronRightIcon, { size: 16 }),
        title: "\u8DF3\u8F6C\u5230\u8BE5\u6D88\u606F\u6240\u5728\u4F4D\u7F6E",
        onClick: () => jumpToMessage(entry.channelId, entry.id, entry.guildId)
      },
      "\u8DF3\u8F6C"
    );
  }
  function DeletedRow({ entry }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-msg" }, /* @__PURE__ */ React.createElement("div", { className: "hc-msg__head" }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__author" }, entry.author.name), entry.author.bot && /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, "BOT"), /* @__PURE__ */ React.createElement(Location, { channelId: entry.channelId, guildId: entry.guildId }), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__time" }, formatTime2(entry.deletedAt)), /* @__PURE__ */ React.createElement(JumpButton, { entry })), /* @__PURE__ */ React.createElement("div", { className: "hc-msg__body" }, entry.content ? renderContent(entry.content) : entry.stickers?.length ? /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A", entry.stickers.map((s) => s.name).join("\u3001")) : entry.attachmentsRich?.length || entry.embeds?.length ? /* @__PURE__ */ React.createElement("span", null, "\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F") : /* @__PURE__ */ React.createElement("span", { className: "hc-msg__empty" }, "\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")), (entry.attachmentsRich?.length ?? 0) > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-msg__media" }, entry.attachmentsRich.map(
      (a, i) => (a.content_type ?? "").startsWith("image/") || (a.content_type ?? "").startsWith("video/") ? /* @__PURE__ */ React.createElement(
        "img",
        {
          key: i,
          className: "hc-msg__thumb",
          src: a.proxy_url ?? a.url,
          alt: a.filename ?? "\u9644\u4EF6",
          loading: "lazy"
        }
      ) : /* @__PURE__ */ React.createElement("a", { key: i, href: a.url, target: "_blank", rel: "noreferrer" }, "\u{1F4CE} ", a.filename ?? "\u9644\u4EF6")
    )), !entry.attachmentsRich?.length && entry.attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-msg__meta" }, "\u9644\u4EF6 ", entry.attachments.length, " \u4E2A"));
  }
  function EditedRow({ entry }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-msg" }, /* @__PURE__ */ React.createElement("div", { className: "hc-msg__head" }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__author" }, entry.author.name), /* @__PURE__ */ React.createElement(Location, { channelId: entry.channelId, guildId: entry.guildId }), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__time" }, formatTime2(entry.updatedAt)), /* @__PURE__ */ React.createElement(JumpButton, { entry })), /* @__PURE__ */ React.createElement("div", { className: "hc-msg__versions" }, entry.history.map((version2, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-msg__version", key: index }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__vtag" }, "v", index + 1), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__vbody" }, version2.content ? renderContent(version2.content) : "\uFF08\u7A7A\uFF09")))));
  }
  function resolveLocation(channelId, guildId) {
    let channelName;
    let gid = guildId;
    let isDM = false;
    try {
      const channel2 = ChannelStore.getChannel?.(channelId);
      if (channel2) {
        if (channel2.name) channelName = String(channel2.name);
        gid = gid ?? channel2.guild_id ?? channel2.guildId ?? void 0;
        isDM = channel2.type === 1 || channel2.type === 3;
      }
    } catch {
    }
    let guildName;
    try {
      if (gid) {
        const guild = GuildStore.getGuild?.(gid);
        if (guild?.name) guildName = String(guild.name);
      }
    } catch {
    }
    const channel = channelName ? `#${channelName}` : isDM ? "\u79C1\u4FE1" : `#${channelId}`;
    return { guild: guildName, channel };
  }
  function Location({ channelId, guildId }) {
    const loc = resolveLocation(channelId, guildId);
    return /* @__PURE__ */ React.createElement("span", { className: "hc-msg__where" }, loc.guild && /* @__PURE__ */ React.createElement("span", { className: "hc-msg__guild" }, loc.guild), loc.guild && /* @__PURE__ */ React.createElement("span", { className: "hc-msg__sep" }, "\u203A"), /* @__PURE__ */ React.createElement("span", null, loc.channel));
  }
  function entryMatches(entry, needle) {
    try {
      if (entry.author?.name && entry.author.name.toLowerCase().includes(needle)) return true;
      const loc = resolveLocation(entry.channelId, entry.guildId);
      if (loc.guild && loc.guild.toLowerCase().includes(needle)) return true;
      if (loc.channel && loc.channel.toLowerCase().includes(needle)) return true;
      if ("content" in entry && typeof entry.content === "string") {
        if (entry.content.toLowerCase().includes(needle)) return true;
      }
      if ("history" in entry && Array.isArray(entry.history)) {
        for (const v of entry.history) {
          if (v?.content && v.content.toLowerCase().includes(needle)) return true;
        }
      }
    } catch {
    }
    return false;
  }
  function formatTime2(time) {
    const date = new Date(time);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function exportLog() {
    try {
      const blob = new Blob([messageLog.toJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor2 = document.createElement("a");
      anchor2.href = url;
      anchor2.download = `halcyon-message-log-${Date.now()}.json`;
      document.body.appendChild(anchor2);
      anchor2.click();
      anchor2.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      log11.error("export failed", err);
    }
  }

  // src/plugins/message-logger/toolbar-button.tsx
  var log12 = logger("message-logger");
  var TOOLBAR_ANCHORS = [
    'section[class*="title_"] [class*="toolbar_"]',
    'section[class*="title"] [class*="toolbar"]',
    '[class*="chat_"] [class*="toolbar_"]',
    '[class*="toolbar_"]'
  ];
  var ENSURE_MS = 1e3;
  var host2 = null;
  var unmount2 = null;
  var timer;
  var unsubscribe;
  function LogButton() {
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-mlog-toolbtn",
        "aria-label": "\u6D88\u606F\u8BB0\u5F55",
        title: "\u6D88\u606F\u8BB0\u5F55\uFF08\u88AB\u5220 / \u7F16\u8F91\uFF09",
        onClick: () => openSettings({ pluginId: "message-logger" })
      },
      /* @__PURE__ */ React.createElement(ClockIcon, { size: 24 })
    );
  }
  function findToolbar() {
    for (const selector of TOOLBAR_ANCHORS) {
      try {
        const el = document.querySelector(selector);
        if (el) return el;
      } catch {
      }
    }
    return null;
  }
  function ensureMounted() {
    if (!settings.store.toolbarButton) {
      teardown();
      return;
    }
    if (host2 && document.contains(host2)) return;
    if (host2) teardown();
    const toolbar = findToolbar();
    if (!toolbar) return;
    const el = document.createElement("div");
    el.className = "hc-mlog-toolbtn-host";
    el.setAttribute("data-hc-plugin", "message-logger");
    try {
      toolbar.insertBefore(el, toolbar.firstChild);
    } catch {
      return;
    }
    try {
      const off = mountDetached(React.createElement(LogButton), el);
      host2 = el;
      unmount2 = off;
    } catch (err) {
      el.remove();
      log12.debug("toolbar button mount failed", err);
    }
  }
  function teardown() {
    if (unmount2) {
      try {
        unmount2();
      } catch {
      }
      unmount2 = null;
    }
    if (host2) {
      host2.remove();
      host2 = null;
    }
  }
  function startToolbarButton() {
    injectStyles();
    stopToolbarButton();
    ensureMounted();
    timer = setInterval(ensureMounted, ENSURE_MS);
    unsubscribe = settings.subscribe("toolbarButton", () => ensureMounted());
  }
  function stopToolbarButton() {
    if (timer) {
      clearInterval(timer);
      timer = void 0;
    }
    unsubscribe?.();
    unsubscribe = void 0;
    teardown();
  }

  // src/plugins/message-logger/index.tsx
  var log13 = logger("message-logger");
  var unpatchDispatch;
  var unsubscribeRetention;
  var unsubscribeDeleteStyle;
  var flushOnUnload;
  function toMillis(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    }
    if (value && typeof value.valueOf === "function") {
      const raw = value.valueOf();
      if (typeof raw === "number") return raw;
    }
    return Date.now();
  }
  function displayName(author) {
    return author?.globalName || author?.global_name || author?.username || author?.name || "\u672A\u77E5\u7528\u6237";
  }
  function toAuthor(author) {
    return { id: String(author?.id ?? "0"), name: displayName(author), bot: Boolean(author?.bot) };
  }
  function attachmentsOf(message) {
    const list = message?.attachments;
    if (!Array.isArray(list)) return [];
    return list.map((a) => a?.filename || a?.url || "\u9644\u4EF6").slice(0, 20);
  }
  function richAttachmentsOf(message) {
    const list = message?.attachments;
    if (!Array.isArray(list)) return [];
    return list.map((a) => ({
      id: a?.id != null ? String(a.id) : void 0,
      filename: a?.filename ?? a?.fileName ?? void 0,
      url: a?.url ?? void 0,
      proxy_url: a?.proxy_url ?? a?.proxyURL ?? a?.proxyUrl ?? void 0,
      content_type: a?.content_type ?? a?.contentType ?? void 0,
      width: typeof a?.width === "number" ? a.width : void 0,
      height: typeof a?.height === "number" ? a.height : void 0,
      size: typeof a?.size === "number" ? a.size : void 0
    })).filter((a) => a.url || a.proxy_url).slice(0, 10);
  }
  function embedsOf(message) {
    const list = message?.embeds;
    if (!Array.isArray(list) || list.length === 0) return [];
    try {
      return JSON.parse(JSON.stringify(list)).slice(0, 6);
    } catch {
      return [];
    }
  }
  function stickersOf(message) {
    const list = message?.sticker_items ?? message?.stickerItems ?? message?.stickers;
    if (!Array.isArray(list)) return [];
    return list.filter((s) => s?.id != null).map((s) => ({
      id: String(s.id),
      name: String(s.name ?? "\u8D34\u7EB8"),
      format_type: typeof s.format_type === "number" ? s.format_type : s.formatType
    })).slice(0, 4);
  }
  function recoverBodyText(message) {
    if (!message) return void 0;
    const snapshots = message.message_snapshots ?? message.messageSnapshots;
    if (Array.isArray(snapshots) && snapshots.length) {
      const inner = snapshots[0]?.message ?? snapshots[0];
      const text = typeof inner?.content === "string" ? inner.content.trim() : "";
      if (text) return `\u21AA\uFE0F \u8F6C\u53D1\uFF1A${text}`;
      if (Array.isArray(inner?.attachments) && inner.attachments.length) return "\u21AA\uFE0F \u8F6C\u53D1\uFF08\u9644\u4EF6\uFF09";
      if (Array.isArray(inner?.embeds) && inner.embeds.length) return "\u21AA\uFE0F \u8F6C\u53D1\uFF08\u5D4C\u5165\u5185\u5BB9\uFF09";
      return "\u21AA\uFE0F \u8F6C\u53D1\u6D88\u606F";
    }
    const poll = message.poll;
    if (poll) {
      const question = typeof poll.question?.text === "string" ? poll.question.text : typeof poll.question === "string" ? poll.question : "";
      const options = Array.isArray(poll.answers) ? poll.answers.map((a) => typeof a?.poll_media?.text === "string" ? a.poll_media.text : void 0).filter(Boolean) : [];
      return `\u{1F4CA} \u6295\u7968\uFF1A${question || "\uFF08\u65E0\u9898\u76EE\uFF09"}${options.length ? `\uFF08${options.join(" / ")}\uFF09` : ""}`;
    }
    if (Array.isArray(message.components) && message.components.length) {
      const texts = [];
      const walk = (nodes, depth) => {
        if (depth > 4) return;
        for (const n of nodes) {
          if (typeof n?.content === "string" && n.content.trim()) texts.push(n.content.trim());
          if (Array.isArray(n?.components)) walk(n.components, depth + 1);
        }
      };
      walk(message.components, 0);
      if (texts.length) return texts.join("\n");
    }
    return void 0;
  }
  function currentUserId() {
    try {
      return UserStore.getCurrentUser?.()?.id;
    } catch {
      return void 0;
    }
  }
  var selfIgnoreLogged = false;
  function isIgnored(channelId, author) {
    const s = settings.store;
    if (channelId && s.ignoredChannels.includes(channelId)) return true;
    const authorId = author?.id != null ? String(author.id) : "";
    if (authorId && s.ignoredUsers.includes(authorId)) return true;
    if (s.ignoreBots && author?.bot) return true;
    if (s.ignoreSelf) {
      const me = currentUserId();
      if (!selfIgnoreLogged) {
        selfIgnoreLogged = true;
        const hit = Boolean(authorId && me && authorId === String(me));
        log13.info(
          `\u5C4F\u853D\u81EA\u5DF1 \u81EA\u68C0 \u2014 \u5F00\u5173=on\uFF0C\u6D88\u606F\u4F5C\u8005id=${authorId || "(\u7A7A)"}\uFF0C\u5F53\u524D\u7528\u6237id=${me ?? "(\u53D6\u4E0D\u5230)"}\uFF0C\u5224\u5B9A=${hit ? "\u547D\u4E2D\u2192\u4F1A\u5C4F\u853D" : "\u672A\u547D\u4E2D\u2192\u4E0D\u5C4F\u853D"}`
        );
      }
      if (authorId && me && authorId === String(me)) return true;
    }
    return false;
  }
  var shadow = /* @__PURE__ */ new Map();
  var SHADOW_MAX = 4e3;
  function remember(channelId, id, message) {
    const content = message?.content;
    if (!channelId || !id || typeof content !== "string") return;
    const key = `${channelId}:${id}`;
    const prior = shadow.get(key);
    if (prior) shadow.delete(key);
    const stickers = stickersOf(message);
    const rich = richAttachmentsOf(message);
    const embeds = embedsOf(message);
    shadow.set(key, {
      content,
      // Partial payloads (some MESSAGE_UPDATEs) may omit these; keep what we had.
      author: message?.author ?? prior?.author,
      attachments: Array.isArray(message?.attachments) ? attachmentsOf(message) : prior?.attachments,
      attachmentsRich: rich.length ? rich : prior?.attachmentsRich,
      embeds: embeds.length ? embeds : prior?.embeds,
      stickers: stickers.length ? stickers : prior?.stickers,
      sentAt: message?.timestamp != null ? toMillis(message.timestamp) : prior?.sentAt,
      guildId: message?.guild_id ?? message?.guildId ?? prior?.guildId
    });
    if (shadow.size > SHADOW_MAX) {
      const oldest = shadow.keys().next().value;
      if (oldest !== void 0) shadow.delete(oldest);
    }
  }
  function readMessage(channelId, id) {
    try {
      return MessageStore.getMessage(channelId, id);
    } catch {
      return void 0;
    }
  }
  var tintObserver;
  var tintInterval;
  var sweepScheduled = false;
  function sweepDeletedRows() {
    try {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      const want = `hc-mlog-${settings.store.deleteStyle || "tint"}`;
      if (root && !root.classList.contains(want)) {
        for (const s of DELETE_STYLE_CLASSES) root.classList.remove(`hc-mlog-${s}`);
        root.classList.add(want);
      }
      const rows = document.querySelectorAll('li[id^="chat-messages-"]');
      rows.forEach((el) => {
        if (!el.classList.contains("hc-deleted") && rowIsDeleted(el)) el.classList.add("hc-deleted");
      });
    } catch {
    }
  }
  function scheduleSweep() {
    if (sweepScheduled) return;
    sweepScheduled = true;
    setTimeout(() => {
      sweepScheduled = false;
      sweepDeletedRows();
    }, 60);
  }
  function rowIsDeleted(el) {
    const parts = el.id.split("-");
    const messageId = parts[parts.length - 1];
    const channelId = parts.length >= 4 ? parts[parts.length - 2] : void 0;
    return channelId ? messageLog.isDeleted(channelId, messageId) : messageLog.getDeleted().some((d) => d.id === messageId);
  }
  function startDomTinter() {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
    tintObserver = new MutationObserver((mutations) => {
      for (const mu of mutations) {
        const t = mu.target;
        if (mu.type === "attributes" && t instanceof Element && t.id && t.id.startsWith("chat-messages-") && !t.classList.contains("hc-deleted") && rowIsDeleted(t)) {
          t.classList.add("hc-deleted");
        }
      }
      scheduleSweep();
    });
    const attach4 = () => {
      const target = document.documentElement ?? document.body;
      if (!target) return false;
      sweepDeletedRows();
      tintObserver?.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
      });
      return true;
    };
    if (!attach4()) {
      let tries = 0;
      const timer3 = setInterval(() => {
        if (attach4() || ++tries > 100) clearInterval(timer3);
      }, 100);
    }
    if (tintInterval) clearInterval(tintInterval);
    tintInterval = setInterval(sweepDeletedRows, 300);
  }
  function stopDomTinter() {
    tintObserver?.disconnect();
    tintObserver = void 0;
    if (tintInterval) {
      clearInterval(tintInterval);
      tintInterval = void 0;
    }
  }
  function tintRowInDom(channelId, messageId) {
    try {
      const el = document.getElementById(`chat-messages-${channelId}-${messageId}`) || document.getElementById(`chat-messages-${messageId}`);
      if (el) el.classList.add("hc-deleted");
    } catch {
    }
    scheduleSweep();
  }
  function rawAuthorFor(authorId, fallbackName, fallbackBot) {
    try {
      const u = UserStore.getUser?.(authorId);
      if (u) {
        const author = {
          id: String(u.id),
          username: u.username ?? fallbackName,
          global_name: u.globalName ?? u.global_name ?? null,
          discriminator: String(u.discriminator ?? "0"),
          bot: Boolean(u.bot),
          public_flags: u.publicFlags ?? u.public_flags ?? 0
        };
        if (u.avatar !== void 0) author.avatar = u.avatar;
        const deco = u.avatarDecorationData ?? u.avatar_decoration_data;
        if (deco !== void 0) author.avatar_decoration_data = deco;
        return author;
      }
    } catch {
    }
    return {
      id: String(authorId || "0"),
      username: fallbackName,
      global_name: fallbackName,
      discriminator: "0",
      bot: fallbackBot
    };
  }
  function liveRepaintPatchesApplied() {
    try {
      const mine = getSourcePatchReport().filter((p) => p.pluginId === "message-logger");
      const needed = ["re-render on deleted flag", "declare deleted field on message record"];
      return needed.every((label) => mine.some((p) => p.label === label && p.applied));
    } catch {
      return false;
    }
  }
  var rerendered = /* @__PURE__ */ new Set();
  function forceRowRerender(channelId, messageId) {
    try {
      const dispatcher2 = getDispatcher();
      if (!dispatcher2 || typeof dispatcher2.dispatch !== "function") return;
      const msg = readMessage(channelId, messageId);
      if (!msg) return;
      const a = msg.author ?? {};
      const iso = (v) => {
        if (v == null) return null;
        if (typeof v?.toISOString === "function") return v.toISOString();
        if (typeof v === "string") return v;
        return new Date(toMillis(v)).toISOString();
      };
      const entry = messageLog.findDeleted(channelId, messageId);
      let embeds = embedsOf(msg);
      if ((!embeds || embeds.length === 0) && entry?.embeds?.length) embeds = entry.embeds;
      let stickerItems = stickersOf(msg);
      if (stickerItems.length === 0 && entry?.stickers?.length) stickerItems = entry.stickers;
      let rich = richAttachmentsOf(msg);
      if (rich.length === 0 && entry?.attachmentsRich?.length) rich = entry.attachmentsRich;
      const content = typeof msg.content === "string" && msg.content !== "" ? msg.content : entry?.content ?? "";
      const raw = {
        id: String(messageId),
        channel_id: String(channelId),
        guild_id: msg.guild_id ?? msg.guildId ?? entry?.guildId ?? null,
        type: typeof msg.type === "number" ? msg.type : 0,
        content,
        // Echo the REAL user (real avatar hash) so this update can't wipe it.
        author: rawAuthorFor(
          String(a.id ?? entry?.author.id ?? "0"),
          a.username ?? a.global_name ?? a.globalName ?? entry?.author.name ?? "user",
          Boolean(a.bot ?? entry?.author.bot)
        ),
        timestamp: iso(msg.timestamp) ?? (/* @__PURE__ */ new Date()).toISOString(),
        edited_timestamp: iso(msg.editedTimestamp ?? msg.edited_timestamp),
        tts: Boolean(msg.tts),
        mention_everyone: Boolean(msg.mentionEveryone ?? msg.mention_everyone),
        mentions: [],
        mention_roles: [],
        attachments: rich.map((x, i) => ({
          id: x.id ?? `${messageId}${i}`,
          filename: x.filename ?? "file",
          url: x.url ?? x.proxy_url,
          proxy_url: x.proxy_url ?? x.url,
          content_type: x.content_type,
          width: x.width,
          height: x.height,
          size: x.size ?? 0
        })),
        embeds,
        sticker_items: stickerItems,
        pinned: Boolean(msg.pinned),
        flags: typeof msg.flags === "number" ? msg.flags : 0,
        // Carried so the rebuilt record keeps the flag where our patch preserves it.
        deleted: true
      };
      dispatcher2.dispatch({ type: "MESSAGE_UPDATE", message: raw });
    } catch (err) {
      log13.debug("force row re-render failed (non-fatal)", err);
    }
  }
  function scheduleRerender(channelId, messageId) {
    if (liveRepaintPatchesApplied()) return;
    const key = `${channelId}:${messageId}`;
    if (rerendered.has(key)) return;
    rerendered.add(key);
    setTimeout(() => {
      forceRowRerender(channelId, messageId);
      setTimeout(() => rerendered.delete(key), 1500);
    }, 0);
  }
  function captureDelete(channelId, id) {
    if (!channelId || !id) return;
    const message = readMessage(channelId, id);
    const snap = shadow.get(`${channelId}:${id}`);
    if (!message && !snap) {
      log13.debug(`delete of ${id} skipped: message not in cache or shadow`);
      return;
    }
    const author = message?.author ?? snap?.author ?? {};
    if (isIgnored(channelId, author)) return;
    const liveContent = typeof message?.content === "string" && message.content !== "" ? message.content : snap?.content ?? "";
    const attachments = message ? attachmentsOf(message) : snap?.attachments ?? [];
    const liveRich = message ? richAttachmentsOf(message) : [];
    const attachmentsRich = liveRich.length ? liveRich : snap?.attachmentsRich ?? [];
    const liveEmbeds = message ? embedsOf(message) : [];
    const embeds = liveEmbeds.length ? liveEmbeds : snap?.embeds ?? [];
    const liveStickers = message ? stickersOf(message) : [];
    const stickers = liveStickers.length ? liveStickers : snap?.stickers ?? [];
    const recovered = recoverBodyText(message) ?? recoverBodyText(snap);
    const content = liveContent || recovered || "";
    messageLog.recordDeleted({
      id: String(id),
      channelId: String(channelId),
      guildId: message?.guild_id ?? message?.guildId ?? snap?.guildId ?? void 0,
      author: toAuthor(author),
      content,
      attachments,
      attachmentsRich: attachmentsRich.length ? attachmentsRich : void 0,
      embeds: embeds.length ? embeds : void 0,
      stickers: stickers.length ? stickers : void 0,
      sentAt: message?.timestamp != null ? toMillis(message.timestamp) : snap?.sentAt ?? Date.now(),
      deletedAt: Date.now()
    });
    if (message && settings.store.keepDeletedInChat) {
      try {
        message.deleted = true;
      } catch {
      }
    }
    if (settings.store.keepDeletedInChat) {
      tintRowInDom(String(channelId), String(id));
      scheduleRerender(String(channelId), String(id));
    }
    if (settings.store.keepDeletedInChat && !liveKeepChecked) {
      liveKeepChecked = true;
      const cid = String(channelId);
      const mid = String(id);
      setTimeout(() => {
        const still = readMessage(cid, mid);
        const domEl = typeof document !== "undefined" ? document.getElementById(`chat-messages-${cid}-${mid}`) || document.getElementById(`chat-messages-${mid}`) : null;
        const tinted = !!domEl && domEl.classList.contains("hc-deleted");
        if (still && still.deleted === true) {
          log13.info(
            `live keep-deleted \u81EA\u68C0 OK \u2014 \u88AB\u5220\u6D88\u606F\u4ECD\u7559\u5728 store \u4E14\u5DF2\u6807\u8BB0 deleted\uFF1BDOM \u884C${domEl ? tinted ? "\u5DF2\u76F4\u63A5\u67D3\u7EA2\uFF08\u5B9E\u65F6\u7EA2\u6761\u751F\u6548\uFF09" : "\u627E\u5230\u4F46\u672A\u67D3\u7EA2\uFF0C\u8BF7\u53CD\u9988" : "\u672A\u627E\u5230\uFF08\u53EF\u80FD\u5DF2\u6EDA\u51FA\u89C6\u56FE\uFF09"}`
          );
        } else if (still) {
          log13.warn("live keep-deleted \u81EA\u68C0 PARTIAL \u2014 \u6D88\u606F\u4FDD\u7559\u4F46\u672A\u6807\u8BB0 deleted\uFF0C\u6539\u7528 DOM \u76F4\u63A5\u67D3\u7EA2\u515C\u5E95");
        } else {
          log13.error(
            "live keep-deleted \u81EA\u68C0 FAILED \u2014 MessageStore \u5DF2\u4E22\u5F03\u88AB\u5220\u6D88\u606F\uFF0C\u8BF4\u660E \u201Ckeep deleted message in store\u201D \u8865\u4E01\u672A\u547D\u4E2D\u5F53\u524D\u6784\u5EFA\uFF1B\u88AB\u5220\u6D88\u606F\u53EA\u4F1A\u5728\u91CD\u65B0\u52A0\u8F7D\u9891\u9053\u540E\u7531 revive \u91CD\u65B0\u51FA\u73B0\uFF08\u6B63\u662F\u4F60\u8BF4\u7684\u201C\u5237\u65B0\u624D\u6709\u3001\u5B9E\u65F6\u6CA1\u6709\u201D\uFF09\u3002"
          );
        }
      }, 0);
    }
  }
  function captureEdit(payload) {
    if (!settings.store.logEdits || !payload) return;
    const channelId = payload.channel_id ?? payload.channelId;
    const id = payload.id;
    if (!channelId || !id) return;
    if (typeof payload.content !== "string") return;
    const key = `${channelId}:${id}`;
    const existing = readMessage(channelId, id);
    const snap = shadow.get(key);
    const previous = snap?.content ?? (typeof existing?.content === "string" ? existing.content : void 0);
    remember(channelId, id, payload);
    if (previous === void 0) {
      log13.debug(`edit to ${id} skipped: no prior content known (message predates the recorder)`);
      return;
    }
    if (previous === payload.content) return;
    const author = existing?.author ?? snap?.author ?? payload.author ?? {};
    if (isIgnored(channelId, author)) return;
    const guildId = payload.guild_id ?? payload.guildId ?? existing?.guild_id ?? snap?.guildId;
    messageLog.recordEdit(
      String(id),
      String(channelId),
      toAuthor(author),
      previous,
      guildId != null ? String(guildId) : void 0
    );
  }
  function entryToRaw(entry) {
    const attachments = (entry.attachmentsRich ?? []).map((a, i) => ({
      id: a.id ?? `${entry.id}${i}`,
      filename: a.filename ?? "attachment",
      url: a.url ?? a.proxy_url,
      proxy_url: a.proxy_url ?? a.url,
      content_type: a.content_type,
      width: a.width,
      height: a.height,
      size: a.size ?? 0,
      spoiler: false
    }));
    const timestamp = () => {
      const at = typeof entry.sentAt === "number" && Number.isFinite(entry.sentAt) ? entry.sentAt : snowflakeTime(entry.id);
      const d = new Date(at);
      return Number.isNaN(d.getTime()) ? (/* @__PURE__ */ new Date()).toISOString() : d.toISOString();
    };
    return {
      id: entry.id,
      type: 0,
      channel_id: entry.channelId,
      guild_id: entry.guildId,
      sticker_items: entry.stickers?.length ? entry.stickers : void 0,
      content: entry.content || (attachments.length === 0 && entry.attachments.length ? `\u{1F4CE} ${entry.attachments.join(", ")}` : ""),
      // Echo the real user so resurrecting a deleted message on reload can't null
      // that user's avatar across the client (the "吞头像" bug).
      author: rawAuthorFor(entry.author.id, entry.author.name, entry.author.bot),
      timestamp: timestamp(),
      edited_timestamp: null,
      attachments,
      embeds: entry.embeds ?? [],
      mentions: [],
      mention_roles: [],
      mention_everyone: false,
      pinned: false,
      tts: false,
      flags: 0
    };
  }
  function snowflakeTime(id) {
    try {
      return Number((BigInt(id) >> 22n) + 1420070400000n);
    } catch {
      return Date.now();
    }
  }
  function compareIds(a, b) {
    try {
      const x = BigInt(a);
      const y = BigInt(b);
      return x < y ? -1 : x > y ? 1 : 0;
    } catch {
      return a < b ? -1 : a > b ? 1 : 0;
    }
  }
  var injectedActions = /* @__PURE__ */ new WeakSet();
  var MAX_REVIVED_PER_PAGE = 50;
  function pageReachesPresent(action) {
    if (action.hasMoreAfter === true) return false;
    if (action.hasMoreAfter === false) return true;
    const jumped = action.jump?.messageId != null || action.jumpTargetId != null;
    return !jumped && action.isBefore !== true && action.isAfter !== true;
  }
  function resurrectIntoLoad(action) {
    if (!settings.store.keepDeletedInChat) return;
    if (injectedActions.has(action)) return;
    injectedActions.add(action);
    const channelId = String(action.channelId ?? action.channel_id ?? "");
    const msgs = action.messages;
    if (!channelId || !Array.isArray(msgs)) return;
    const mine = messageLog.getDeleted().filter((d) => d.channelId === channelId);
    if (!mine.length) return;
    const present = new Set(msgs.map((m) => String(m?.id)));
    let minId;
    let maxId;
    for (const m of msgs) {
      const id = m?.id != null ? String(m.id) : void 0;
      if (!id) continue;
      if (minId === void 0 || compareIds(id, minId) < 0) minId = id;
      if (maxId === void 0 || compareIds(id, maxId) > 0) maxId = id;
    }
    if (minId === void 0 && !pageReachesPresent(action)) return;
    const openEnded = pageReachesPresent(action);
    const revived = mine.filter((d) => {
      if (present.has(d.id)) return false;
      if (isIgnored(channelId, d.author)) return false;
      if (minId !== void 0 && compareIds(d.id, minId) < 0) return false;
      if (!openEnded && maxId !== void 0 && compareIds(d.id, maxId) > 0) return false;
      return true;
    });
    if (!revived.length) return;
    revived.sort((a, b) => -compareIds(a.id, b.id));
    const dropped = Math.max(0, revived.length - MAX_REVIVED_PER_PAGE);
    const chosen = dropped ? revived.slice(0, MAX_REVIVED_PER_PAGE) : revived;
    const descending = msgs.length >= 2 ? compareIds(String(msgs[0].id), String(msgs[msgs.length - 1].id)) > 0 : true;
    msgs.push(...chosen.map(entryToRaw));
    msgs.sort((a, b) => {
      const c = compareIds(String(a?.id ?? "0"), String(b?.id ?? "0"));
      return descending ? -c : c;
    });
    log13.info(
      `revived ${chosen.length} deleted message(s) into ${channelId}` + (dropped ? `\uFF08\u53E6\u6709 ${dropped} \u6761\u5728\u7A97\u53E3\u5185\u4F46\u8D85\u51FA\u5355\u9875\u4E0A\u9650\uFF0C\u4EC5\u5728\u6D88\u606F\u8BB0\u5F55\u9875\u53EF\u89C1\uFF09` : "")
    );
  }
  function reflagLoaded(action) {
    if (!settings.store.keepDeletedInChat) return;
    const channelId = String(action.channelId ?? action.channel_id ?? "");
    if (!channelId) return;
    for (const d of messageLog.getDeleted()) {
      if (d.channelId !== channelId) continue;
      const msg = readMessage(channelId, d.id);
      if (msg && !msg.deleted) {
        try {
          msg.deleted = true;
        } catch {
        }
      }
    }
  }
  function trackContent(action, type) {
    try {
      if (type === "MESSAGE_CREATE") {
        const m = action.message;
        remember(m?.channel_id ?? m?.channelId ?? action.channelId, m?.id, m);
      } else if (type === "LOAD_MESSAGES_SUCCESS") {
        const channelId = action.channelId ?? action.channel_id;
        if (Array.isArray(action.messages)) {
          for (const m of action.messages) remember(m?.channel_id ?? channelId, m?.id, m);
        }
      }
    } catch {
    }
  }
  var firstCaptureLogged = false;
  var actionsSeen = 0;
  var liveKeepChecked = false;
  function onAction(action) {
    const type = action?.type;
    if (typeof type !== "string") return;
    if (WATCHED.includes(type)) actionsSeen++;
    trackContent(action, type);
    if (type === "LOAD_MESSAGES_SUCCESS") {
      try {
        resurrectIntoLoad(action);
        setTimeout(() => reflagLoaded(action), 0);
      } catch (err) {
        log13.error("failed to revive deleted messages on channel load", err);
      }
    }
    try {
      if (type === "MESSAGE_DELETE") {
        captureDelete(action.channelId ?? action.channel_id, action.id ?? action.messageId);
      } else if (type === "MESSAGE_DELETE_BULK") {
        const channelId = action.channelId ?? action.channel_id;
        for (const id of action.ids ?? []) captureDelete(channelId, id);
      } else if (type === "MESSAGE_UPDATE") {
        captureEdit(action.message);
      } else {
        return;
      }
      if (!firstCaptureLogged) {
        firstCaptureLogged = true;
        log13.info(`recorder saw its first ${type}`);
      }
    } catch (err) {
      log13.error("recorder failed for", type, err);
    }
  }
  function onDispatch(ctx) {
    onAction(ctx.args[0]);
  }
  var WATCHED = ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK", "LOAD_MESSAGES_SUCCESS"];
  function attachRecorder(dispatcher2, tag) {
    const undo = [];
    const seams = [];
    if (typeof dispatcher2.addInterceptor === "function") {
      try {
        const interceptor = (action) => {
          onAction(action);
          return false;
        };
        dispatcher2.addInterceptor(interceptor);
        undo.push(() => {
          const list = dispatcher2._interceptors;
          if (Array.isArray(list)) {
            const at = list.indexOf(interceptor);
            if (at >= 0) list.splice(at, 1);
          }
        });
        seams.push("interceptor");
      } catch {
      }
    }
    for (const method of ["dispatch", "_dispatch"]) {
      if (typeof dispatcher2[method] === "function") {
        try {
          undo.push(patcher.before(dispatcher2, method, onDispatch));
          seams.push(method);
        } catch {
        }
        break;
      }
    }
    if (typeof dispatcher2.subscribe === "function") {
      try {
        const handler = (action) => onAction(action);
        for (const type of WATCHED) dispatcher2.subscribe(type, handler);
        undo.push(() => {
          if (typeof dispatcher2.unsubscribe === "function") {
            for (const type of WATCHED) {
              try {
                dispatcher2.unsubscribe(type, handler);
              } catch {
              }
            }
          }
        });
        seams.push("subscribe");
      } catch {
      }
    }
    log13.info(`recorder on dispatcher ${tag}: seams [${seams.join(", ") || "none"}]`);
    return () => undo.forEach((u) => u());
  }
  var MAX_DISPATCHERS = 6;
  function attachRecorderEverywhere() {
    const hooked = /* @__PURE__ */ new Set();
    const undo = [];
    let capReported = false;
    const sweep = () => {
      const candidates = [getDispatcher(), ...findAll(isFluxDispatcher)].filter(Boolean);
      let added = 0;
      for (const d of candidates) {
        if (hooked.has(d)) continue;
        if (hooked.size >= MAX_DISPATCHERS) {
          if (!capReported) {
            capReported = true;
            log13.warn(
              `dispatcher \u5019\u9009\u8D85\u8FC7 ${MAX_DISPATCHERS} \u4E2A\uFF0C\u5DF2\u505C\u6B62\u7EE7\u7EED\u6302\u63A5\u3002\u591A\u51FA\u6765\u7684\u901A\u5E38\u662F shape \u76F8\u4F3C\u7684\u5047\u6A21\u5757\uFF1B\u5982\u679C\u5F55\u5236\u6CA1\u751F\u6548\u8BF7\u53CD\u9988\u8FD9\u6761\u65E5\u5FD7\u3002`
            );
          }
          break;
        }
        hooked.add(d);
        undo.push(attachRecorder(d, `#${hooked.size}`));
        added++;
      }
      return added;
    };
    const first = sweep();
    log13.info(`recorder attached to ${first} dispatcher instance(s)`);
    const timer3 = setInterval(() => {
      if (hooked.size >= MAX_DISPATCHERS) {
        clearInterval(timer3);
        return;
      }
      const added = sweep();
      if (added > 0) log13.info(`recorder attached to ${added} late dispatcher instance(s)`);
    }, 5e3);
    const stopTimer = setTimeout(() => clearInterval(timer3), 6e4);
    return () => {
      clearInterval(timer3);
      clearTimeout(stopTimer);
      undo.forEach((u) => u());
    };
  }
  var MARKER_ICON_PATHS = {
    trash: () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4.5 7h15" }), /* @__PURE__ */ React.createElement("path", { d: "M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7" }), /* @__PURE__ */ React.createElement("path", { d: "M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7" })),
    shield: () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z" }), /* @__PURE__ */ React.createElement("path", { d: "M9.5 12l1.8 1.8 3.2-3.6" })),
    warning: () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 4.5L3.5 19h17L12 4.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 10v4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 16.75h.01" }))
  };
  function formatDeletedAt(at, mode) {
    if (at == null || mode === "none") return void 0;
    const d = new Date(at);
    if (mode === "datetime") {
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${d.toLocaleTimeString("zh-CN", { hour12: false })}`;
    }
    return d.toLocaleTimeString("zh-CN", { hour12: false });
  }
  function MessageMarker(props) {
    const s = settings.store;
    const icon = MARKER_ICON_PATHS[s.markerIcon]?.();
    const stamp = formatDeletedAt(props.at, s.markerTime);
    const cls = `hc-deleted-marker hc-deleted-marker--${s.markerLook || "plain"}` + (props.edited ? " hc-deleted-marker--edited" : "");
    return /* @__PURE__ */ React.createElement("div", { className: cls }, icon && /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: "hc-deleted-marker__icon",
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      icon
    ), /* @__PURE__ */ React.createElement("span", null, props.text, stamp ? `\uFF08${stamp}\uFF09` : ""));
  }
  var MARKER_SETTING_KEYS = ["logEdits", "deleteStyle", "showDeletedMarker", "showEditedMarker", "markerIcon", "markerLook", "markerTime"];
  function useMlogSettings() {
    const [, bump] = useState(0);
    useEffect(() => {
      const unsubs = MARKER_SETTING_KEYS.map((key) => settings.subscribe(key, () => bump((n) => n + 1)));
      return () => unsubs.forEach((unsub) => unsub());
    }, []);
  }
  function collectDeletedMedia(attachments, embeds) {
    const out = [];
    for (const a of attachments ?? []) {
      const url = a.proxy_url ?? a.url;
      if (!url) continue;
      const ct = a.content_type ?? "";
      out.push({
        url,
        kind: ct.startsWith("video/") ? "video" : ct.startsWith("image/") ? "image" : "file",
        name: a.filename
      });
    }
    for (const e of embeds ?? []) {
      const img = e?.image?.proxy_url ?? e?.image?.url ?? e?.thumbnail?.proxy_url ?? e?.thumbnail?.url;
      if (typeof img === "string" && img) out.push({ url: img, kind: "image" });
    }
    return out.slice(0, 6);
  }
  function MessageExtras(props) {
    useMlogSettings();
    const s = settings.store;
    const nodes = [];
    if (s.logEdits && props.history && props.history.length > 0) {
      nodes.push(
        /* @__PURE__ */ React.createElement("div", { className: "hc-edit-history", key: "hc-edit-history" }, props.history.map((version2, index) => {
          const time = formatDeletedAt(version2.at, "time");
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `hc-edit-history__version hc-edit-history__version--${s.deleteStyle || "tint"}`,
              key: index
            },
            renderContent(version2.content),
            time ? /* @__PURE__ */ React.createElement("span", { className: "hc-edit-history__time" }, time) : null
          );
        }))
      );
    }
    if (s.showEditedMarker && props.isEdited && !props.isDeleted) {
      nodes.push(/* @__PURE__ */ React.createElement(MessageMarker, { key: "hc-edited-marker", text: "\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91", at: props.editedAt, edited: true }));
    }
    if (s.showDeletedMarker && props.isDeleted) {
      nodes.push(/* @__PURE__ */ React.createElement(MessageMarker, { key: "hc-deleted-marker", text: "\u6B64\u6D88\u606F\u5DF2\u5220\u9664", at: props.deletedAt }));
    }
    if (props.isDeleted && props.media && props.media.length > 0) {
      nodes.push(
        /* @__PURE__ */ React.createElement("div", { className: "hc-deleted-media", key: "hc-deleted-media" }, props.media.map(
          (m, i) => m.kind === "file" ? /* @__PURE__ */ React.createElement(
            "a",
            {
              className: "hc-deleted-media__file",
              key: i,
              href: m.url,
              target: "_blank",
              rel: "noreferrer"
            },
            "\u{1F4CE} ",
            m.name ?? "\u9644\u4EF6"
          ) : /* @__PURE__ */ React.createElement(
            "img",
            {
              className: "hc-deleted-media__thumb",
              key: i,
              src: m.url,
              alt: m.name ?? "",
              loading: "lazy",
              referrerPolicy: "no-referrer"
            }
          )
        ))
      );
    }
    return nodes.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, nodes) : null;
  }
  var DELETE_STYLE_CLASSES = ["tint", "text", "ghost", "strike"];
  function syncDeleteStyleClass() {
    try {
      const root = document.documentElement;
      if (!root) return;
      for (const s of DELETE_STYLE_CLASSES) root.classList.remove(`hc-mlog-${s}`);
      root.classList.add(`hc-mlog-${settings.store.deleteStyle || "tint"}`);
    } catch {
    }
  }
  function reportPatches() {
    const mine = getSourcePatchReport().filter((p) => p.pluginId === "message-logger");
    if (!mine.length) return;
    for (const p of mine) {
      if (p.applied) {
        log13.info(`patch OK   \xB7 ${p.label} (${p.hits} hit${p.hits === 1 ? "" : "s"})`);
      } else {
        log13.warn(`patch MISS \xB7 ${p.label} \u2014 \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA`);
      }
    }
    const missed = mine.filter((p) => !p.applied);
    if (missed.length === 0) {
      log13.info("in-chat patches applied \u2014 \u5168\u90E8\u547D\u4E2D");
    } else {
      log13.warn(
        "\u90E8\u5206 in-chat patch \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA\uFF1A" + missed.map((p) => `"${p.label}"`).join("\u3001") + "\u3002\u5220\u9664\u6D88\u606F\u4ECD\u4F1A\u8BB0\u5F55\u5728\u63D2\u4EF6\u9875\uFF0C\u4F46\u53EF\u80FD\u65E0\u6CD5\u5728\u804A\u5929\u5185\u4FDD\u7559 / \u53D8\u7EA2\u3002"
      );
    }
    const storeMissed = mine.some((p) => p.label === "keep deleted message in store" && !p.applied);
    const recordMissed = mine.some((p) => p.label === "declare deleted field on message record" && !p.applied);
    if (storeMissed || recordMissed) {
      try {
        const forms = ["MESSAGE_DELETE:function", "MESSAGE_DELETE(", "MESSAGE_DELETE_BULK"];
        const dumps = forms.map((needle) => {
          const out = dumpFactorySource(needle, 220);
          return out.startsWith("<no loaded factory") || out.startsWith("<webpack") ? "" : `\u3010${needle}\u3011${out}`;
        }).filter(Boolean);
        const combined = dumps.join("  ||  ").replace(/\s+/g, " ");
        const slice = combined.length > 3800 ? combined.slice(0, 3800) + " \u2026(\u622A\u65AD)" : combined;
        log13.warn(
          "MESSAGE_DELETE \u5904\u7406\u5668\u771F\u5B9E\u6E90\u7801\u5207\u7247\uFF08\u8865\u4E01\u672A\u547D\u4E2D\uFF0C\u7528\u4E8E\u4FEE\u6B63\uFF0C\u8BF7\u6574\u6BB5\u53D1\u7ED9\u5F00\u53D1\u8005\uFF09\uFF1A" + (slice || "\u672A\u5728\u5DF2\u52A0\u8F7D\u6A21\u5757\u4E2D\u627E\u5230 MESSAGE_DELETE \u5904\u7406\u5668\uFF1B\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u9891\u9053\u540E\u518D\u67E5\u770B\u65E5\u5FD7\u3002")
        );
      } catch (err) {
        log13.error("could not dump MESSAGE_DELETE handler shape", err);
      }
    }
  }
  var message_logger_default = definePlugin({
    id: "message-logger",
    name: "\u6D88\u606F\u8BB0\u5F55\u5668",
    description: "\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",
    authors: [{ name: "caitemm" }],
    category: "utility",
    settings,
    page: {
      title: "\u6D88\u606F\u8BB0\u5F55",
      icon: ClockIcon,
      component: LogPage
    },
    /** Diagnostic snapshot for HalcyonAPI.probe() — jump readiness in particular. */
    probe() {
      const jump = JumpActions;
      const router = NavigationRouter;
      let scanRouterFound = false;
      try {
        scanRouterFound = typeof find(
          (x) => typeof x?.transitionTo === "function" && typeof x?.__halcyon_probe__ === "undefined"
        )?.transitionTo === "function";
      } catch {
        scanRouterFound = false;
      }
      return {
        jumpActionsFound: jump != null,
        jumpToMessageIsFn: typeof jump?.jumpToMessage === "function",
        navigationRouterFound: router != null,
        transitionToIsFn: typeof router?.transitionTo === "function",
        scanRouterFound,
        deletedCount: messageLog.getDeleted().length,
        settingsHostEmbedded: getSourcePatchReport().some(
          (p) => p.pluginId === "halcyon-settings" && p.applied
        )
      };
    },
    patches: [
      {
        // The message store drops records when it handles MESSAGE_DELETE /
        // MESSAGE_DELETE_BULK. Instead of letting it, we rebuild the channel
        // cache ourselves: kept messages are re-committed flagged `deleted:true`,
        // everything else is removed exactly as the original would. Without this
        // the row simply vanishes the instant a message is deleted and only
        // reappears (red) on reload via the revive path — precisely the
        // "刷新才有、实时没有" symptom.
        label: "keep deleted message in store",
        // Ported VERBATIM from Vencord's MessageLogger "MessageStore" patch.
        // The module is selected by the store's registered name — the quoted
        // string "MessageStore" the minifier keeps — and the handler is patched
        // by a ZERO-WIDTH insertion right after `MESSAGE_DELETE:function(e){`:
        // the original body stays byte-for-byte intact and merely becomes
        // unreachable after our early `return`. Vencord tracks the current
        // Discord build, so this is the shape that actually ships; the earlier
        // hand-rolled regexes guessed at method-shorthand / multi-dot shapes this
        // client no longer uses, which is exactly why they missed 4×. Vencord's
        // `\i` token is expanded here to its definition [A-Za-z_$][\w$]*.
        find: '"MessageStore"',
        replacement: [
          {
            // Single delete. $1 = raw action param, $2 = store ref (e.g. `d.A`).
            match: /(?<=MESSAGE_DELETE:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,
            replace: "let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!1);$2.commit(cache);return;"
          },
          {
            // Bulk delete.
            match: /(?<=MESSAGE_DELETE_BULK:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,
            replace: "let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!0);$2.commit(cache);return;"
          }
        ]
      },
      {
        // Base message row: append our class to the "li" so kept messages tint
        // red. The find string is a dev assertion that survives minification.
        // The prefix character before `("li",{` can be `)` (a `(0, X.createElement)`
        // style call preserved by some minifiers) OR a plain identifier
        // (`_jsx("li",` in a jsx-runtime build), so match either — the old
        // pattern only accepted `)` and no-op'd on jsx-runtime builds.
        label: "tint deleted message row (base)",
        find: "Message must not be a thread starter message",
        replacement: {
          match: /([)\w$\]])\("li",\{(.+?),className:/,
          replace: '$1("li",{$2,className:($self.deletedClass(arguments[0])||"")+" "+'
        }
      },
      {
        // The message row builds a className. When the record is flagged deleted,
        // append our modifier so it renders tinted. The argument list may carry
        // nested calls/strings, so parens are matched one level deep instead of
        // `[^)]*` (which used to cut mid-expression and produce code that failed
        // to compile).
        label: "tint deleted message row",
        find: "childrenRepliedMessage",
        replacement: {
          match: /(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,
          replace: '$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'
        }
      },
      {
        // Message content renderer: prepend the persisted edit history above the
        // current content, so old versions read top-to-bottom. Located via the
        // ".SEND_FAILED," module; the history comes from OUR persisted store, so
        // it survives client reloads.
        label: "inline edit history",
        find: ".SEND_FAILED,",
        replacement: {
          match: /\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,
          replace: "$&$self.renderEdits(arguments[0]),"
        }
      },
      {
        // Force a live re-render when a message is flagged deleted.
        //
        // This is the fix for "红条只有刷新后才出现". The store patch above keeps a
        // deleted message with `deleted: true` (confirmed live by the self-check
        // log), but Discord wraps each message row in React.memo with a custom
        // comparator that only re-renders when content / state / flags /
        // editedTimestamp change — it never looks at `deleted`. So flipping the
        // flag updates the store but the row is memoized stale and never repaints;
        // the red styling only shows on reload, when the list mounts fresh.
        //
        // We extend that comparator to also compare `deleted`, so the instant we
        // flag a message the row is considered changed and repaints red. The two
        // message variables are captured straight from the tail of the comparator
        // (`X.editedTimestamp?.toString()===Y.editedTimestamp?.toString()`) so we
        // never hardcode minified names. Same module as the edit-history patch
        // (".SEND_FAILED,").
        label: "re-render on deleted flag",
        find: ".SEND_FAILED,",
        replacement: {
          match: /((\w+)\.editedTimestamp\?\.toString\(\)===(\w+)\.editedTimestamp\?\.toString\(\))/,
          replace: "$1&&$2.deleted===$3.deleted"
        }
      },
      {
        // THE fix for "红条只有刷新后才出现". Discord's Message is an Immutable
        // Record with a FIXED field schema. `deleted` is not one of those fields,
        // so `m.set("deleted",true)` stores a value that is readable (the live
        // self-check sees deleted===true) but is invisible to the record's
        // structural equality — and Discord's message list decides whether to
        // repaint a row via that equality. Old record and new record compare
        // "equal" on the schema fields, so the row is never repainted live; only
        // a reload (fresh mount) shows the red styling.
        //
        // Declaring `deleted` (and editHistory / firstEditTimestamp) as real
        // fields on the record class means `.set("deleted",true)` now yields a
        // record that is genuinely not-equal to the original, so the list
        // repaints the instant we flag it. Ported verbatim from Vencord's
        // "Message domain model" patch, which is what makes deletes show live
        // there. Runs in the record constructor, located by `}addReaction(`.
        label: "declare deleted field on message record",
        find: /\}addReaction\(|addReaction\([\w$]+\)\{/,
        replacement: {
          match: /this\.customRenderedContent=(\w+)\.customRenderedContent,/,
          replace: "this.customRenderedContent=$1.customRenderedContent,this.deleted=$1.deleted||!1,this.editHistory=$1.editHistory||[],this.firstEditTimestamp=$1.firstEditTimestamp||this.editedTimestamp||this.timestamp,"
        }
      },
      {
        // Keep `deleted` / editHistory / firstEditTimestamp alive when Discord
        // rebuilds a message record on MESSAGE_UPDATE (edits, reactions, embed
        // unfurls). Without this, any post-delete update to the same message
        // re-derives the record from the server payload and silently drops our
        // flag, so a deleted message that then gets an embed/reaction update
        // would lose its red row. Ported from Vencord's "updated message
        // transformer" patch, located by ".PREMIUM_REFERRAL&&(".
        label: "carry deleted flag through message updates",
        find: /\.PREMIUM_REFERRAL\s*&&\s*\(/,
        replacement: {
          match: /(?<=null!=[\w$]+\.edited_timestamp\)return )[\w$]+\([\w$]+,\{reactions:([\w$]+)\.reactions[\s\S]{0,60}?\}\)/,
          replace: "Object.assign($&,{deleted:$1.deleted,editHistory:$1.editHistory,firstEditTimestamp:$1.firstEditTimestamp})"
        }
      }
    ],
    start() {
      messageLog.load();
      messageLog.setRetention(settings.store.retention);
      unsubscribeRetention = settings.subscribe("retention", (next) => messageLog.setRetention(next));
      syncDeleteStyleClass();
      unsubscribeDeleteStyle = settings.subscribe("deleteStyle", syncDeleteStyleClass);
      unpatchDispatch = attachRecorderEverywhere();
      flushOnUnload = () => messageLog.flush();
      try {
        window.addEventListener("pagehide", flushOnUnload);
        window.addEventListener("beforeunload", flushOnUnload);
      } catch {
      }
      startDomTinter();
      startToolbarButton();
      setTimeout(reportPatches, 4e3);
      setTimeout(() => {
        if (actionsSeen > 0) {
          log13.info(`recorder pulse OK \u2014 ${actionsSeen} message action(s) observed so far`);
        } else {
          log13.error(
            "recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002"
          );
        }
      }, 3e4);
    },
    stop() {
      unpatchDispatch?.();
      unpatchDispatch = void 0;
      unsubscribeRetention?.();
      unsubscribeRetention = void 0;
      unsubscribeDeleteStyle?.();
      unsubscribeDeleteStyle = void 0;
      stopDomTinter();
      stopToolbarButton();
      if (flushOnUnload) {
        try {
          window.removeEventListener("pagehide", flushOnUnload);
          window.removeEventListener("beforeunload", flushOnUnload);
        } catch {
        }
        flushOnUnload = void 0;
      }
      try {
        for (const s of DELETE_STYLE_CLASSES) document.documentElement?.classList.remove(`hc-mlog-${s}`);
      } catch {
      }
      messageLog.flush();
      log13.info("stopped");
    },
    // --- methods the source patches call through `$self` --------------------
    /**
     * Replacement body for the MessageStore's MESSAGE_DELETE(_BULK) handlers.
     * Receives the channel's immutable message cache; returns it with kept
     * messages flagged `deleted: true` (so the row patch tints them) and
     * everything else removed, exactly as the original handler would have.
     * Any surprise falls back to the original handler by returning the cache
     * unchanged only when nothing was touched — a throw here must never take
     * the store down, so the whole body is guarded.
     */
    handleDelete(cache2, action, isBulk) {
      try {
        if (cache2 == null) return cache2;
        if (!isBulk && typeof cache2.has === "function" && !cache2.has(action.id)) return cache2;
        const keepInChat = settings.store.keepDeletedInChat;
        const EPHEMERAL = 64;
        const mutate = (id) => {
          const msg = typeof cache2.get === "function" ? cache2.get(id) : void 0;
          if (!msg) return;
          const keep = keepInChat && !action.mlDeleted && (msg.flags & EPHEMERAL) !== EPHEMERAL && !isIgnored(String(action.channelId ?? action.channel_id ?? msg.channel_id ?? ""), msg.author ?? {});
          if (!keep) {
            cache2 = cache2.remove(id);
          } else {
            cache2 = cache2.update(id, (m) => m.set("deleted", true));
          }
        };
        if (isBulk) {
          for (const id of action.ids ?? []) mutate(id);
        } else {
          mutate(action.id);
        }
      } catch (err) {
        log13.error("handleDelete failed; messages removed normally", err);
      }
      return cache2;
    },
    /**
     * Extra classNames for a message row whose message is deleted. Keyed off the
     * PERSISTED record (not just the in-memory `deleted` flag), so rows stay
     * marked across reloads; the flag remains a fast path for freshly deleted
     * ones. The style modifier comes from settings, so users pick the look.
     * Patched call sites differ in what they pass: the base row patch hands us
     * the component props (message under `.message`), the legacy patch the
     * message itself — accept either.
     */
    deletedClass(propsOrMessage) {
      try {
        const m = propsOrMessage?.message ?? propsOrMessage;
        if (!m) return "";
        const channelId = m.channel_id ?? m.channelId;
        const isDeleted = m.deleted === true || channelId && m.id && messageLog.isDeleted(String(channelId), String(m.id));
        if (!isDeleted) return "";
        return "hc-deleted";
      } catch {
        return "";
      }
    },
    /**
     * Called from the content-renderer patch with the component's props. Renders
     * (a) the persisted edit history above the content and (b) a "deleted at"
     * marker line beneath it, both from the plugin's own store, so both survive
     * reloads. Runs inside Discord's message renderer and must never break it —
     * everything is guarded and returns null on any surprise.
     */
    renderEdits(props) {
      try {
        const message = props?.message;
        const id = message?.id;
        const channelId = message?.channel_id ?? message?.channelId;
        if (!id || !channelId) return null;
        if (isIgnored(String(channelId), message?.author)) return null;
        const entry = messageLog.getEdited().find((e) => e.id === String(id) && e.channelId === String(channelId));
        const record2 = messageLog.findDeleted(String(channelId), String(id));
        const hasHistory = Boolean(entry && entry.history.length > 0);
        const isDeleted = Boolean(record2) || message?.deleted === true;
        const editedTs = message?.edited_timestamp ?? message?.editedTimestamp;
        const isEdited = editedTs != null || hasHistory;
        const editedAt = editedTs != null ? toMillis(editedTs) : entry?.updatedAt;
        if (!hasHistory && !isDeleted && !isEdited) return null;
        return /* @__PURE__ */ React.createElement(
          MessageExtras,
          {
            history: entry?.history,
            deletedAt: record2?.deletedAt,
            editedAt,
            isDeleted,
            isEdited,
            media: isDeleted ? collectDeletedMedia(record2?.attachmentsRich, record2?.embeds) : void 0
          }
        );
      } catch {
        return null;
      }
    }
  });

  // src/plugins/show-username/index.tsx
  var log14 = logger("show-username");
  var settings2 = defineSettings({
    mode: {
      type: "select",
      default: "nick-user",
      label: "\u663E\u793A\u65B9\u5F0F",
      description: "\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",
      options: [
        { value: "nick-user", label: "\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E" },
        { value: "user-nick", label: "\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E" },
        { value: "user-only", label: "\u53EA\u663E\u793A\u7528\u6237\u540D" }
      ]
    },
    style: {
      type: "select",
      default: "muted",
      label: "\u7528\u6237\u540D\u6837\u5F0F",
      description: "\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",
      options: [
        { value: "muted", label: "\u7070\u8272\u5C0F\u5B57" },
        { value: "pill", label: "\u5706\u89D2\u80F6\u56CA" },
        { value: "at", label: "@ \u524D\u7F00" },
        { value: "paren", label: "\u62EC\u53F7\u5305\u88F9" }
      ]
    },
    hideWhenSame: {
      type: "boolean",
      default: true,
      label: "\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",
      description: "\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"
    },
    inReplies: {
      type: "boolean",
      default: false,
      label: "\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",
      description: "\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"
    }
  });
  function Username(props) {
    const { original } = props;
    const s = settings2.store;
    const user = original.userOverride ?? original.message?.author;
    const username = user?.username;
    const nick = original.author?.nick ?? user?.globalName ?? username ?? "";
    const prefix = original.withMentionPrefix ? "@" : "";
    try {
      if (!username) return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, nick);
      if (original.isRepliedMessage && !s.inReplies) return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, nick);
      if (s.hideWhenSame && username.toLowerCase() === nick.toLowerCase()) return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, nick);
      const suffixClass = `hc-username hc-username--${s.style || "muted"}`;
      const decorated = s.style === "at" ? `@${username}` : s.style === "paren" ? `\uFF08${username}\uFF09` : username;
      if (s.mode === "user-only") {
        return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, username);
      }
      if (s.mode === "user-nick") {
        return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, username, " ", /* @__PURE__ */ React.createElement("span", { className: suffixClass }, nick));
      }
      return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, nick, " ", /* @__PURE__ */ React.createElement("span", { className: suffixClass }, decorated));
    } catch (err) {
      log14.error("username render failed; falling back to the nick", err);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, nick);
    }
  }
  var show_username_default = definePlugin({
    id: "show-username",
    name: "\u663E\u793A\u7528\u6237\u540D",
    description: "\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",
    authors: [{ name: "caitemm" }],
    category: "appearance",
    settings: settings2,
    patches: [
      {
        // The message-header module (find string survives minification). The
        // username hook renders `children: <ternary>`; capturing that whole
        // expression is fragile (nested commas/parens — a truncated capture
        // produced unbalanced code), so instead our render becomes the new
        // `children` and the original expression is parked, syntactically
        // intact, under a dummy `_hcOld` prop.
        label: "message header username",
        find: '="SYSTEM_TAG"',
        replacement: {
          match: /(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,
          replace: "$self.renderUsername(arguments[0]),_hcOld:$1?"
        }
      }
    ],
    start() {
      log14.info("appending usernames to message headers");
    },
    stop() {
    },
    /** Called from the patch with the header component's props. */
    renderUsername(props) {
      try {
        return /* @__PURE__ */ React.createElement(Username, { original: props });
      } catch {
        return props?.author?.nick ?? null;
      }
    }
  });

  // src/plugins/guild-monitor/settings.ts
  var settings3 = defineSettings({
    // Toggled from the plugin page (with the full risk note), not the generic
    // form, so it's hidden here — but persisted through the store like any value.
    acknowledgedRisk: {
      type: "boolean",
      default: false,
      label: "\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",
      description: "\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",
      hidden: true
    },
    selectedGuilds: {
      type: "string-list",
      default: [],
      label: "\u76D1\u63A7\u7684\u670D\u52A1\u5668",
      description: "\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",
      itemPlaceholder: "\u670D\u52A1\u5668 ID",
      hidden: true
    }
  });

  // src/plugins/guild-monitor/subscribe.ts
  var log15 = logger("guild-monitor");
  var REFRESH_MS = 5 * 60 * 1e3;
  var timer2;
  var getGuildIds = () => [];
  function textChannelIds(guildId) {
    try {
      const grouped = GuildChannelStore.getChannels(guildId);
      if (!grouped || typeof grouped !== "object") return [];
      const ids = /* @__PURE__ */ new Set();
      for (const value of Object.values(grouped)) {
        if (!Array.isArray(value)) continue;
        for (const item of value) {
          const ch = item?.channel ?? item;
          const id = ch?.id;
          if (id != null && (ch?.type === 0 || ch?.type === 5)) ids.add(String(id));
        }
      }
      return [...ids];
    } catch (err) {
      log15.debug(`could not read channels for guild ${guildId}`, err);
      return [];
    }
  }
  function subscribeGuild(guildId) {
    const api = GuildSubscriptions;
    if (!api) return;
    try {
      if (typeof api.subscribeToChannel === "function") {
        for (const channelId of textChannelIds(guildId)) {
          api.subscribeToChannel(guildId, channelId);
        }
        return;
      }
      if (typeof api.subscribeToGuild === "function") {
        api.subscribeToGuild(guildId);
      }
    } catch (err) {
      log15.warn(`subscribe failed for guild ${guildId}`, err);
    }
  }
  function isSubscriptionSupported() {
    const api = GuildSubscriptions;
    return Boolean(api && (typeof api.subscribeToChannel === "function" || typeof api.subscribeToGuild === "function"));
  }
  function pass() {
    const ids = getGuildIds();
    if (!ids.length) return;
    for (const id of ids) subscribeGuild(id);
    log15.debug(`refreshed subscriptions for ${ids.length} guild(s)`);
  }
  function startSubscribing(resolver) {
    getGuildIds = resolver;
    stopSubscribing();
    if (!isSubscriptionSupported()) {
      log15.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");
      return;
    }
    pass();
    timer2 = setInterval(pass, REFRESH_MS);
  }
  function refreshNow() {
    if (timer2) pass();
  }
  function stopSubscribing() {
    if (timer2) {
      clearInterval(timer2);
      timer2 = void 0;
    }
  }

  // src/plugins/guild-monitor/ui/MonitorPage.tsx
  function readGuilds() {
    try {
      const store = findStore("GuildStore") ?? GuildStore;
      const map = store?.getGuilds?.() ?? {};
      return Object.values(map).map((g2) => ({ id: String(g2?.id ?? ""), name: String(g2?.name ?? g2?.id ?? "\u672A\u77E5\u670D\u52A1\u5668") })).filter((g2) => g2.id).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    } catch {
      return [];
    }
  }
  function MonitorPage() {
    const [guilds, setGuilds] = useState(() => readGuilds());
    const [selected, setSelected] = useState(() => [...settings3.store.selectedGuilds]);
    const [acknowledged, setAcknowledged] = useState(() => settings3.store.acknowledgedRisk === true);
    const supported = isSubscriptionSupported();
    useEffect(() => {
      if (guilds.length === 0) {
        const t = setTimeout(() => setGuilds(readGuilds()), 400);
        return () => clearTimeout(t);
      }
    }, [guilds.length]);
    const persist = (ids) => {
      setSelected(ids);
      settings3.store.selectedGuilds = ids;
      refreshNow();
    };
    const toggleGuild = (id) => {
      persist(selected.includes(id) ? selected.filter((g2) => g2 !== id) : [...selected, id]);
    };
    const setAck = (on) => {
      setAcknowledged(on);
      settings3.store.acknowledgedRisk = on;
      if (!on) persist([]);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stack" }, /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note hc-inline-note--danger" }, /* @__PURE__ */ React.createElement(WarningIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4", /* @__PURE__ */ React.createElement("b", null, "\u8D26\u53F7\u88AB\u5C01\u7981"), "\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")), /* @__PURE__ */ React.createElement("div", { className: "hc-section" }, /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__desc" }, "\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")), /* @__PURE__ */ React.createElement(Toggle, { checked: acknowledged, onChange: setAck, "aria-label": "\u542F\u7528\u4E3B\u52A8\u76D1\u63A7" })))), !supported && /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note" }, /* @__PURE__ */ React.createElement(WarningIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")), /* @__PURE__ */ React.createElement("div", { className: "hc-section" }, /* @__PURE__ */ React.createElement("div", { className: "hc-section__title", style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "\u670D\u52A1\u5668\uFF08", guilds.length, "\uFF09"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-tab",
        onClick: () => setGuilds(readGuilds()),
        style: { height: 20, padding: "0 8px", textTransform: "none" }
      },
      /* @__PURE__ */ React.createElement(RefreshIcon, { size: 12 }),
      " \u5237\u65B0"
    )), guilds.length === 0 ? /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: /* @__PURE__ */ React.createElement(ServerIcon, { size: 48 }),
        title: "\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",
        subtitle: "\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"
      }
    ) : /* @__PURE__ */ React.createElement("div", { className: "hc-section__body", style: { opacity: acknowledged ? 1 : 0.5, pointerEvents: acknowledged ? "auto" : "none" } }, guilds.map((g2) => /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row", key: g2.id }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, g2.name), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__desc" }, g2.id)), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        checked: selected.includes(g2.id),
        onChange: () => toggleGuild(g2.id),
        "aria-label": `\u76D1\u63A7 ${g2.name}`
      }
    ))))), selected.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-savebar" }, /* @__PURE__ */ React.createElement("span", { className: "hc-savebar__label" }, "\u6B63\u5728\u76D1\u63A7 ", selected.length, " \u4E2A\u670D\u52A1\u5668"), /* @__PURE__ */ React.createElement("div", { className: "hc-savebar__actions" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => persist([]) }, "\u5168\u90E8\u53D6\u6D88"))));
  }

  // src/plugins/guild-monitor/index.tsx
  var log16 = logger("guild-monitor");
  function activeGuildIds() {
    if (settings3.store.acknowledgedRisk !== true) return [];
    const ids = settings3.store.selectedGuilds;
    return Array.isArray(ids) ? ids : [];
  }
  var guild_monitor_default = definePlugin({
    id: "guild-monitor",
    name: "\u670D\u52A1\u5668\u76D1\u63A7",
    description: "\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",
    authors: [{ name: "caitemm" }],
    category: "privacy",
    settings: settings3,
    page: {
      title: "\u76D1\u63A7",
      icon: BroadcastIcon,
      component: MonitorPage
    },
    start() {
      startSubscribing(activeGuildIds);
      const n = activeGuildIds().length;
      if (n > 0) log16.info(`monitoring ${n} guild(s)`);
    },
    stop() {
      stopSubscribing();
    }
  });

  // src/plugins/message-cleaner/settings.ts
  var settings4 = defineSettings({
    order: {
      group: "\u9ED8\u8BA4\u53C2\u6570",
      type: "select",
      default: "desc",
      label: "\u6E05\u7406\u65B9\u5411",
      description: "\u53D7\u6761\u6570\u9650\u5236\u65F6\uFF0C\u4F18\u5148\u4ECE\u54EA\u4E00\u7AEF\u5F00\u59CB\u5220\u3002",
      options: [
        { value: "desc", label: "\u4ECE\u65B0\u5230\u8001" },
        { value: "asc", label: "\u4ECE\u8001\u5230\u65B0" }
      ]
    },
    limit: {
      group: "\u9ED8\u8BA4\u53C2\u6570",
      type: "number",
      default: 100,
      label: "\u6700\u591A\u5904\u7406\u6761\u6570",
      description: "\u5355\u6B21\u9884\u89C8 / \u5220\u9664\u7684\u4E0A\u9650\u3002",
      min: 1,
      max: 5e3,
      step: 50
    },
    delayMs: {
      group: "\u9ED8\u8BA4\u53C2\u6570",
      type: "number",
      default: 1600,
      label: "\u5220\u9664\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",
      description: "\u4E24\u6B21\u5220\u9664\u4E4B\u95F4\u7684\u7B49\u5F85\uFF0C\u592A\u5FEB\u4F1A\u89E6\u53D1\u9650\u901F\uFF0C\u5EFA\u8BAE\u4E0D\u4F4E\u4E8E 1000\u3002",
      min: 300,
      max: 3e4,
      step: 100
    },
    confirmBeforeDelete: {
      group: "\u9ED8\u8BA4\u53C2\u6570",
      type: "boolean",
      default: true,
      label: "\u5220\u9664\u524D\u4E8C\u6B21\u786E\u8BA4",
      description: "\u70B9\u300C\u5220\u9664\u300D\u540E\u5F39\u51FA\u786E\u8BA4\u6846\uFF0C\u907F\u514D\u8BEF\u5220\u3002"
    }
  });

  // src/plugins/message-cleaner/cleaner.ts
  var log17 = logger("message-cleaner");
  var API_BASE = "https://discord.com/api/v10";
  var skipList = /* @__PURE__ */ new Set();
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  var EPOCH = 1420070400000n;
  var tsToSf = (d) => String(BigInt(d.getTime()) - EPOCH << 22n);
  function extractToken() {
    try {
      const chunks = window.webpackChunkdiscord_app;
      if (Array.isArray(chunks)) {
        let tok = null;
        chunks.push([[Symbol()], {}, (req) => {
          for (const id of Object.keys(req.m || {})) {
            try {
              for (const m of [req(id), req(id)?.default]) {
                if (m && typeof m.getToken === "function") {
                  const t = m.getToken();
                  if (t && t.length > 20) {
                    tok = t;
                    return;
                  }
                }
              }
            } catch {
            }
          }
        }]);
        if (tok) return tok;
      }
    } catch {
    }
    try {
      const t = window.localStorage.getItem("token");
      if (t) return t.replace(/^"|"$/g, "");
    } catch {
    }
    return null;
  }
  async function apiFetch(token, path, opts = {}, attempt = 0) {
    let res;
    try {
      res = await fetch(API_BASE + path, {
        ...opts,
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          ...opts.headers || {}
        }
      });
    } catch (e) {
      if (attempt < 5) {
        await sleep(3e3);
        return apiFetch(token, path, opts, attempt + 1);
      }
      throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ${e.message}`);
    }
    if (res.status === 429) {
      const j = await res.json().catch(() => ({}));
      const wait = j.retry_after ? Math.ceil(Number(j.retry_after) * 1e3) : Math.pow(2, attempt) * 1e3;
      if (attempt < 5) {
        await sleep(wait + 500);
        return apiFetch(token, path, opts, attempt + 1);
      }
      throw new Error("\u89E6\u53D1\u9650\u901F\u4E14\u91CD\u8BD5\u6B21\u6570\u8017\u5C3D\u3002");
    }
    if (!res.ok) {
      const b = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${b.slice(0, 120)}`);
    }
    return res.status === 204 ? null : res.json();
  }
  async function fetchUserId(token) {
    const me = await apiFetch(token, "/users/@me");
    if (!me?.id) throw new Error("\u65E0\u6CD5\u901A\u8FC7 Token \u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5 Token \u662F\u5426\u6709\u6548\u3002");
    return String(me.id);
  }
  function currentTarget() {
    try {
      const m = location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);
      if (!m) return null;
      return { guildId: m[1], channelId: m[2], serverWide: false };
    } catch {
      return null;
    }
  }
  async function fetchGuilds(token) {
    const guilds = await apiFetch(token, "/users/@me/guilds");
    if (!Array.isArray(guilds)) return [];
    return guilds.map((g2) => ({ id: String(g2.id), name: g2.name ?? "\u672A\u77E5", icon: g2.icon ?? null }));
  }
  async function fetchChannels(token, guildId) {
    if (guildId === "@me") {
      const dms = await apiFetch(token, "/users/@me/channels");
      if (!Array.isArray(dms)) return [];
      return dms.map((c) => {
        const name = c.name || (Array.isArray(c.recipients) ? c.recipients.map((r) => r.global_name || r.username).join("\u3001") : "") || "\u672A\u77E5\u79C1\u804A";
        return { id: String(c.id), name, type: c.type ?? 1 };
      });
    }
    const channels = await apiFetch(token, `/guilds/${guildId}/channels`);
    if (!Array.isArray(channels)) return [];
    return channels.filter((c) => c.type !== 4).map((c) => ({ id: String(c.id), name: c.name ?? "\u672A\u77E5", type: c.type ?? 0 }));
  }
  async function collect(token, opts, meId, onProgress, ctrl) {
    const out = [];
    if (opts.serverWide && opts.guildId && opts.guildId !== "@me") {
      let offset = 0;
      while (out.length < opts.limit) {
        if (ctrl.stopped) break;
        onProgress("\u5168\u670D\u68C0\u7D22\u4E2D", `\u5DF2\u627E\u5230 ${out.length} \u6761\uFF08\u641C\u7D22\u63A5\u53E3\u8F83\u6162\uFF0C\u8BF7\u7A0D\u5019\uFF09`);
        const params = new URLSearchParams({
          author_id: meId,
          offset: String(offset),
          include_nsfw: "true",
          sort_order: opts.order === "asc" ? "asc" : "desc"
        });
        if (opts.after) params.set("min_id", tsToSf(opts.after));
        if (opts.before) params.set("max_id", tsToSf(opts.before));
        let res;
        try {
          res = await apiFetch(token, `/guilds/${opts.guildId}/messages/search?${params}`);
        } catch (e) {
          throw new Error(`\u5168\u670D\u68C0\u7D22\u5931\u8D25\uFF1A${e.message}`);
        }
        if (res?.message === "Indexing") {
          onProgress("\u5EFA\u7ACB\u7D22\u5F15\u4E2D", "Discord \u6B63\u5728\u5EFA\u7ACB\u5168\u670D\u7D22\u5F15\uFF0C10 \u79D2\u540E\u81EA\u52A8\u91CD\u8BD5\u2026");
          await sleep(1e4);
          continue;
        }
        if (!res?.messages || res.messages.length === 0) break;
        for (const group of res.messages) {
          const m = group.find((x) => x?.hit) ?? group.find((x) => x?.author?.id === meId) ?? group[0];
          if (!m || m.author?.id !== meId || skipList.has(m.id)) continue;
          out.push({ id: m.id, channelId: m.channel_id, content: m.content ?? "", timestamp: m.timestamp });
          if (out.length >= opts.limit) break;
        }
        if (res.messages.length < 25) break;
        offset += res.messages.length;
        await sleep(1200);
      }
      return out;
    }
    if (!opts.channelId) throw new Error("\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u5F00\u542F\u300C\u5168\u670D\u626B\u63CF\u300D\u5E76\u586B\u5199\u670D\u52A1\u5668 ID\u3002");
    let boundary = null;
    if (opts.order === "desc") {
      boundary = opts.before ? tsToSf(opts.before) : null;
    } else {
      boundary = opts.after ? tsToSf(opts.after) : "0";
    }
    while (out.length < opts.limit) {
      if (ctrl.stopped) break;
      const params = new URLSearchParams({ limit: "100" });
      if (boundary) params.set(opts.order === "desc" ? "before" : "after", boundary);
      let batch;
      try {
        batch = await apiFetch(token, `/channels/${opts.channelId}/messages?${params}`);
      } catch (e) {
        throw new Error(`\u8BFB\u53D6\u9891\u9053\u6D88\u606F\u5931\u8D25\uFF1A${e.message}`);
      }
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const m of batch) {
        const t = new Date(m.timestamp);
        if (opts.order === "desc" && opts.after && t < opts.after) {
          return out;
        }
        if (opts.order === "asc" && opts.before && t > opts.before) {
          return out;
        }
        const inRange = (!opts.after || t >= opts.after) && (!opts.before || t <= opts.before);
        if (m.author?.id === meId && inRange && !skipList.has(m.id)) {
          out.push({ id: m.id, channelId: m.channel_id ?? opts.channelId, content: m.content ?? "", timestamp: m.timestamp });
          if (out.length >= opts.limit) break;
        }
      }
      boundary = batch[batch.length - 1].id;
      onProgress("\u626B\u63CF\u4E2D", `\u5DF2\u627E\u5230 ${out.length} \u6761`);
      await sleep(150);
    }
    return out;
  }
  async function remove(token, messages, opts, onProgress, ctrl) {
    let deleted = 0;
    let skipped = 0;
    for (const m of messages) {
      if (ctrl.stopped) break;
      const t0 = Date.now();
      try {
        await apiFetch(token, `/channels/${m.channelId || opts.channelId}/messages/${m.id}`, { method: "DELETE" });
        deleted++;
      } catch (e) {
        skipped++;
        if (!String(e?.message ?? "").includes("404")) skipList.add(m.id);
        log17.warn(`skip ${m.id}: ${e?.message ?? e}`);
      }
      onProgress("\u5220\u9664\u4E2D", `\u5DF2\u5220\u9664 ${deleted} / ${messages.length}${skipped ? `\uFF08\u8DF3\u8FC7 ${skipped}\uFF09` : ""}`);
      const elapsed = Date.now() - t0;
      if (elapsed < opts.delayMs) await sleep(opts.delayMs - elapsed);
    }
    return { deleted, skipped };
  }
  async function count(token, target, meId) {
    let url;
    const params = new URLSearchParams({ author_id: meId, include_nsfw: "true" });
    if (target.serverWide && target.guildId && target.guildId !== "@me") {
      url = `/guilds/${target.guildId}/messages/search?${params}`;
    } else if (target.channelId) {
      url = `/channels/${target.channelId}/messages/search?${params}`;
    } else if (target.guildId && target.guildId !== "@me") {
      url = `/guilds/${target.guildId}/messages/search?${params}`;
    } else {
      throw new Error("\u8BF7\u586B\u5199\u670D\u52A1\u5668 ID \u6216\u9891\u9053 ID\u3002");
    }
    const res = await apiFetch(token, url);
    if (res?.message === "Indexing") return { total: 0, indexing: true };
    return { total: res?.total_results ?? 0, indexing: false };
  }

  // src/plugins/message-cleaner/ui/CleanerPage.tsx
  var log18 = logger("message-cleaner");
  function formatTs(ts) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function CleanerPage() {
    const [token, setToken] = useState("");
    const [guildId, setGuildId] = useState("");
    const [channelId, setChannelId] = useState("");
    const [serverWide, setServerWide] = useState(false);
    const [afterStr, setAfterStr] = useState("");
    const [beforeStr, setBeforeStr] = useState("");
    const [order, setOrder] = useState(settings4.store.order);
    const [disclaimer, setDisclaimer] = useState(false);
    const [mode, setMode] = useState("idle");
    const [previewed, setPreviewed] = useState([]);
    const [state, setState] = useState("\u5F85\u673A");
    const [detail, setDetail] = useState("\u5148\u83B7\u53D6 Token\uFF0C\u9009\u597D\u8303\u56F4\u5E76\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5220\u9664\u3002");
    const [statCount, setStatCount] = useState(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerGuilds, setPickerGuilds] = useState([]);
    const [pickerChannels, setPickerChannels] = useState([]);
    const [pickerLevel, setPickerLevel] = useState("guilds");
    const [pickerGuildName, setPickerGuildName] = useState("");
    const [pickerLoading, setPickerLoading] = useState(false);
    const [pickerError, setPickerError] = useState("");
    const ctrlRef = useRef({ stopped: false });
    const running = mode !== "idle";
    useEffect(() => {
      const tok = extractToken();
      if (tok) {
        setToken(tok);
        setState("\u5DF2\u83B7\u53D6 Token");
        setDetail("\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\uFF0C\u6216\u624B\u52A8\u586B\u5199 ID\u3002");
      }
    }, []);
    const progress = (s, d) => {
      setState(s);
      setDetail(d);
    };
    const requireToken = () => {
      const t = token.trim();
      if (!t) throw new Error("\u8BF7\u5148\u83B7\u53D6\u6216\u586B\u5165 Token\u3002");
      return t;
    };
    const buildOptions = () => ({
      guildId: guildId.trim(),
      channelId: serverWide ? "" : channelId.trim(),
      serverWide,
      order,
      limit: settings4.store.limit,
      delayMs: settings4.store.delayMs,
      after: afterStr ? new Date(afterStr) : null,
      before: beforeStr ? new Date(beforeStr) : null
    });
    const onAutoToken = () => {
      const tok = extractToken();
      if (tok) {
        setToken(tok);
        progress("Token \u5DF2\u83B7\u53D6", "\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\u3002");
      } else progress("\u83B7\u53D6\u5931\u8D25", "\u8BF7\u624B\u52A8\u7C98\u8D34 Token\u3002");
    };
    const useCurrent = () => {
      const target = currentTarget();
      if (!target) {
        progress("\u65E0\u6CD5\u8BFB\u53D6", "\u5F53\u524D\u4E0D\u5728\u67D0\u4E2A\u9891\u9053/\u79C1\u4FE1\u9875\u9762\u3002");
        return;
      }
      setGuildId(target.guildId);
      setChannelId(target.channelId);
      setServerWide(false);
      progress("\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053", `\u670D\u52A1\u5668 ${target.guildId} \xB7 \u9891\u9053 ${target.channelId}`);
    };
    const openPicker = async () => {
      let tok;
      try {
        tok = requireToken();
      } catch (e) {
        progress("\u9700\u8981 Token", e.message);
        return;
      }
      setPickerOpen(true);
      setPickerLevel("guilds");
      setPickerChannels([]);
      setPickerError("");
      setPickerLoading(true);
      try {
        const guilds = await fetchGuilds(tok);
        setPickerGuilds([{ id: "@me", name: "\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)", icon: null }, ...guilds]);
      } catch (e) {
        setPickerError(e.message ?? String(e));
      } finally {
        setPickerLoading(false);
      }
    };
    const pickGuild = async (g2) => {
      let tok;
      try {
        tok = requireToken();
      } catch (e) {
        progress("\u9700\u8981 Token", e.message);
        return;
      }
      setPickerGuildName(g2.name);
      setPickerLevel("channels");
      setPickerError("");
      setPickerLoading(true);
      try {
        const channels = await fetchChannels(tok, g2.id);
        const withServerWide = g2.id === "@me" ? channels : [{ id: "", name: "\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500", type: -1 }, ...channels];
        setPickerChannels(withServerWide);
      } catch (e) {
        setPickerError(e.message ?? String(e));
      } finally {
        setPickerLoading(false);
      }
    };
    const pickChannel = (ch) => {
      if (!ch.id) {
        setServerWide(true);
        setChannelId("");
      } else {
        setServerWide(false);
        setChannelId(ch.id);
      }
      setPickerOpen(false);
      progress("\u5DF2\u9009\u62E9", `${pickerGuildName} \u2192 ${ch.name || "\u5168\u670D"}`);
    };
    const syncNow = () => {
      const now = /* @__PURE__ */ new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setBeforeStr(now.toISOString().slice(0, 16));
    };
    const onPreview = async () => {
      let tok;
      try {
        tok = requireToken();
      } catch (e) {
        progress("\u5931\u8D25", e.message);
        return;
      }
      let meId;
      try {
        meId = await fetchUserId(tok);
      } catch (e) {
        progress("\u5931\u8D25", e.message);
        return;
      }
      const opts = buildOptions();
      if (opts.serverWide && (!opts.guildId || opts.guildId === "@me")) {
        progress("\u5931\u8D25", "\u5168\u670D\u626B\u63CF\u9700\u8981\u586B\u5199\u670D\u52A1\u5668 ID\u3002");
        return;
      }
      if (!opts.serverWide && !opts.channelId) {
        progress("\u5931\u8D25", "\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u6539\u7528\u5168\u670D\u626B\u63CF\u3002");
        return;
      }
      if (opts.after && opts.before && opts.after >= opts.before) {
        progress("\u5931\u8D25", "\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");
        return;
      }
      ctrlRef.current = { stopped: false };
      setMode("previewing");
      setPreviewed([]);
      progress("\u9884\u89C8\u4E2D", "\u6B63\u5728\u626B\u63CF\u4F60\u7684\u6D88\u606F\u2026");
      try {
        const found = await collect(tok, opts, meId, progress, ctrlRef.current);
        setPreviewed(found);
        progress(ctrlRef.current.stopped ? "\u5DF2\u505C\u6B62" : "\u9884\u89C8\u5B8C\u6210", `\u627E\u5230 ${found.length} \u6761\u4F60\u7684\u6D88\u606F\u3002`);
      } catch (err) {
        progress("\u5931\u8D25", err.message ?? String(err));
        log18.error("preview failed", err);
      } finally {
        setMode("idle");
      }
    };
    const onDelete = async () => {
      if (previewed.length === 0) {
        progress("\u8BF7\u5148\u9884\u89C8", "");
        return;
      }
      if (settings4.store.confirmBeforeDelete) {
        const ok = window.confirm(`\u5C06\u5220\u9664 ${previewed.length} \u6761\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u8BA4\u7EE7\u7EED\uFF1F`);
        if (!ok) return;
      }
      let tok;
      try {
        tok = requireToken();
      } catch (e) {
        progress("\u5931\u8D25", e.message);
        return;
      }
      const opts = buildOptions();
      ctrlRef.current = { stopped: false };
      setMode("deleting");
      progress("\u5220\u9664\u4E2D", `0 / ${previewed.length}`);
      try {
        const result = await remove(tok, previewed, opts, progress, ctrlRef.current);
        progress(
          ctrlRef.current.stopped ? "\u5DF2\u505C\u6B62" : "\u5B8C\u6210",
          `\u5DF2\u5220\u9664 ${result.deleted} \u6761${result.skipped ? `\uFF0C\u8DF3\u8FC7 ${result.skipped} \u6761` : ""}\u3002`
        );
        setPreviewed([]);
      } catch (err) {
        progress("\u5931\u8D25", err.message ?? String(err));
        log18.error("delete failed", err);
      } finally {
        setMode("idle");
      }
    };
    const onStop = () => {
      ctrlRef.current.stopped = true;
      progress("\u505C\u6B62\u4E2D", "\u7B49\u5F85\u5F53\u524D\u8BF7\u6C42\u7ED3\u675F\u2026");
    };
    const onCount = async () => {
      let tok;
      try {
        tok = requireToken();
      } catch (e) {
        progress("\u5931\u8D25", e.message);
        return;
      }
      let meId;
      try {
        meId = await fetchUserId(tok);
      } catch (e) {
        progress("\u5931\u8D25", e.message);
        return;
      }
      const target = { guildId: guildId.trim(), channelId: serverWide ? "" : channelId.trim(), serverWide };
      setStatCount(null);
      progress("\u7EDF\u8BA1\u4E2D", "\u8C03\u7528\u641C\u7D22\u63A5\u53E3\u2026");
      try {
        const result = await count(tok, target, meId);
        if (result.indexing) {
          progress("\u5EFA\u7ACB\u7D22\u5F15\u4E2D", "Discord \u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002");
          return;
        }
        setStatCount(result.total);
        progress("\u7EDF\u8BA1\u5B8C\u6210", `\u5171 ${result.total} \u6761\u53D1\u8A00\u3002`);
      } catch (err) {
        progress("\u5931\u8D25", err.message ?? String(err));
      }
    };
    if (pickerOpen) {
      return /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-head" }, pickerLevel === "channels" && /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: () => setPickerLevel("guilds") }, "\u2190 \u8FD4\u56DE"), /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__picker-title" }, pickerLevel === "guilds" ? "\u9009\u62E9\u670D\u52A1\u5668" : pickerGuildName), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: () => setPickerOpen(false) }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-list" }, pickerLoading ? /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-empty" }, "\u6B63\u5728\u52A0\u8F7D\u2026") : pickerError ? /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-empty hc-cleaner__picker-empty--error" }, "\u52A0\u8F7D\u5931\u8D25\uFF1A", pickerError) : pickerLevel === "guilds" ? pickerGuilds.map((g2) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: g2.id,
          className: "hc-cleaner__picker-item",
          onClick: () => pickGuild(g2),
          role: "button",
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === "Enter") pickGuild(g2);
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-icon" }, g2.icon ? /* @__PURE__ */ React.createElement("img", { src: `https://cdn.discordapp.com/icons/${g2.id}/${g2.icon}.png?size=64`, alt: "" }) : g2.name.charAt(0)),
        /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-name" }, g2.name)
      )) : pickerChannels.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-empty" }, "\u6B64\u670D\u52A1\u5668\u6682\u65E0\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002") : pickerChannels.map((ch) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: ch.id || "server-wide",
          className: "hc-cleaner__picker-item",
          onClick: () => pickChannel(ch),
          role: "button",
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === "Enter") pickChannel(ch);
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-icon" }, ch.id ? "#" : "\u{1F310}"),
        /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-name" }, ch.name)
      ))));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner" }, /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note hc-inline-note--danger" }, /* @__PURE__ */ React.createElement(WarningIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u4E14\u53EA\u4F1A\u5220\u9664", /* @__PURE__ */ React.createElement("strong", null, "\u4F60\u81EA\u5DF1"), "\u53D1\u9001\u7684\u6D88\u606F\u3002\u8BF7\u52A1\u5FC5\u5148\u9884\u89C8\u786E\u8BA4\u3002")), /* @__PURE__ */ React.createElement(Section, { title: "Token" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "Discord Token"), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__desc" }, "\u4EE3\u8868\u4F60\u7684\u8D26\u53F7\u6743\u9650\uFF0C\u4E0D\u8981\u6CC4\u9732\u7ED9\u4EFB\u4F55\u4EBA\u3002")), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: /* @__PURE__ */ React.createElement(RefreshIcon, { size: 16 }), onClick: onAutoToken }, "\u81EA\u52A8")), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(TextInput, { value: token, onChange: setToken, placeholder: "\u81EA\u52A8\u586B\u5165\u6216\u624B\u52A8\u7C98\u8D34", type: "password" })))), /* @__PURE__ */ React.createElement(Section, { title: "\u8303\u56F4" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u5168\u670D\u626B\u63CF"), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__desc" }, "\u5FFD\u7565\u9891\u9053\uFF0C\u626B\u63CF\u6574\u4E2A\u670D\u52A1\u5668\uFF08\u8D70\u641C\u7D22\u63A5\u53E3\uFF0C\u8F83\u6162\uFF09\u3002")), /* @__PURE__ */ React.createElement(Toggle, { checked: serverWide, onChange: setServerWide, "aria-label": "\u5168\u670D\u626B\u63CF" })), /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u670D\u52A1\u5668 ID"))), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(TextInput, { value: guildId, onChange: setGuildId, placeholder: "\u670D\u52A1\u5668 ID" }))), !serverWide && /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u9891\u9053 ID"))), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement(TextInput, { value: channelId, onChange: setChannelId, placeholder: "\u9891\u9053 ID" }))), /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row", style: { gap: "var(--hc-space-2)" } }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: /* @__PURE__ */ React.createElement(ServerIcon, { size: 16 }), onClick: openPicker, disabled: running }, "\u5217\u8868"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: /* @__PURE__ */ React.createElement(ListIcon, { size: 16 }), onClick: useCurrent, disabled: running }, "\u5F53\u524D"))), /* @__PURE__ */ React.createElement(Section, { title: "\u65F6\u95F4\u8303\u56F4", note: "\u53EF\u9009\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u9650\u5236\u8BE5\u65B9\u5411\u3002" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u8D77\u59CB\u65F6\u95F4"))), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement("input", { className: "hc-input", type: "datetime-local", value: afterStr, onChange: (e) => setAfterStr(e.currentTarget.value) }))), /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u7ED3\u675F\u65F6\u95F4")), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: syncNow }, "\u540C\u6B65\u6700\u65B0")), /* @__PURE__ */ React.createElement("div", { className: "hc-cell__control" }, /* @__PURE__ */ React.createElement("input", { className: "hc-input", type: "datetime-local", value: beforeStr, onChange: (e) => setBeforeStr(e.currentTarget.value) })))), /* @__PURE__ */ React.createElement(Section, { title: "\u65B9\u5411" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u6E05\u7406\u65B9\u5411")), /* @__PURE__ */ React.createElement(
      Select,
      {
        value: order,
        onChange: setOrder,
        options: [
          { value: "desc", label: "\u4ECE\u65B0\u5230\u8001" },
          { value: "asc", label: "\u4ECE\u8001\u5230\u65B0" }
        ]
      }
    ))), /* @__PURE__ */ React.createElement(Section, { title: "\u786E\u8BA4", note: "\u5220\u9664\u662F\u4E0D\u53EF\u9006\u64CD\u4F5C\uFF0C\u8BF7\u5148\u9884\u89C8\u518D\u5220\u9664\u3002" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cell--row" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__main" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell__label" }, "\u6211\u786E\u8BA4\u53EA\u5220\u9664\u81EA\u5DF1\u7684\u6D88\u606F\uFF0C\u4E14\u660E\u767D\u4E0D\u53EF\u6062\u590D")), /* @__PURE__ */ React.createElement(Toggle, { checked: disclaimer, onChange: setDisclaimer, "aria-label": "\u786E\u8BA4" }))), /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__actions" }, mode === "previewing" ? /* @__PURE__ */ React.createElement(Button, { variant: "destructive", onClick: onStop }, "\u505C\u6B62\u9884\u89C8") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: /* @__PURE__ */ React.createElement(SearchIcon, { size: 16 }), disabled: running, onClick: onPreview }, "\u9884\u89C8"), mode === "deleting" ? /* @__PURE__ */ React.createElement(Button, { variant: "destructive", onClick: onStop }, "\u505C\u6B62\u5220\u9664") : /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "destructive",
        icon: /* @__PURE__ */ React.createElement(TrashIcon, { size: 16 }),
        disabled: running || !disclaimer || previewed.length === 0,
        onClick: onDelete
      },
      "\u5220\u9664\u9884\u89C8\uFF08",
      previewed.length,
      "\uFF09"
    )), /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status-state" }, state), detail && /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status-detail" }, detail)), previewed.length > 0 && /* @__PURE__ */ React.createElement(Section, { title: `\u9884\u89C8\u7ED3\u679C\uFF08${previewed.length}\uFF09` }, /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__list" }, previewed.slice(0, 50).map((m) => /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__item", key: m.id }, /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__item-time" }, formatTs(m.timestamp)), /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__item-text" }, m.content.trim() || "\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09"))), previewed.length > 50 && /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__more" }, "\u2026\u8FD8\u6709 ", previewed.length - 50, " \u6761\u672A\u5C55\u793A"))), /* @__PURE__ */ React.createElement(Section, { title: "\u7EDF\u8BA1", note: "\u7EDF\u8BA1\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u5386\u53F2\u53D1\u8A00\u603B\u6570\uFF08\u8C03\u7528\u641C\u7D22\u63A5\u53E3\uFF09\u3002" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: /* @__PURE__ */ React.createElement(SearchIcon, { size: 16 }), disabled: running, onClick: onCount }, "\u7EDF\u8BA1\u6211\u7684\u53D1\u8A00\u6570")), statCount != null && /* @__PURE__ */ React.createElement("div", { className: "hc-cell hc-cleaner__stat" }, /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__stat-num" }, statCount), /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__stat-unit" }, "\u6761"))));
  }

  // src/plugins/message-cleaner/index.tsx
  var log19 = logger("message-cleaner");
  var message_cleaner_default = definePlugin({
    id: "message-cleaner",
    name: "\u6D88\u606F\u6E05\u7406",
    description: "\u6279\u91CF\u5220\u9664\u4F60\u81EA\u5DF1\u5728\u67D0\u4E2A\u9891\u9053\u6216\u6574\u4E2A\u670D\u52A1\u5668\u7684\u5386\u53F2\u6D88\u606F\uFF08\u81EA\u52A9\u51B2\u6C34\u673A\uFF09\u3002\u5148\u9884\u89C8\u518D\u5220\u9664\uFF0C\u4EC5\u9650\u672C\u4EBA\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\u3002",
    authors: [{ name: "caitemm" }, { name: "catie" }],
    category: "privacy",
    settings: settings4,
    page: {
      title: "\u6E05\u7406",
      icon: TrashIcon,
      component: CleanerPage
    },
    start() {
      log19.info("message-cleaner ready");
    },
    stop() {
    }
  });

  // src/plugins/fake-nitro/index.ts
  var log20 = logger("fake-nitro");
  var settings5 = defineSettings({
    enableEmojiBypass: {
      group: "\u8868\u60C5",
      type: "boolean",
      default: true,
      label: "\u7ED5\u8FC7\u8868\u60C5\u9650\u5236",
      description: "\u53D1\u9001\u4F60\u6CA1\u6709 Nitro \u6743\u9650\u7684\u81EA\u5B9A\u4E49\u8868\u60C5\uFF08\u8DE8\u670D / \u52A8\u6001\u8868\u60C5\uFF09\u65F6\uFF0C\u81EA\u52A8\u6539\u4E3A\u53D1\u9001\u8BE5\u8868\u60C5\u7684\u56FE\u7247\u94FE\u63A5\u3002"
    },
    emojiSize: {
      group: "\u8868\u60C5",
      type: "select",
      default: "48",
      label: "\u8868\u60C5\u56FE\u7247\u5C3A\u5BF8",
      description: "\u5185\u8054\u8868\u60C5\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002\u8D8A\u5927\u8D8A\u6E05\u6670\u3001\u5360\u7528\u8D8A\u5927\u3002",
      options: [
        { value: "32", label: "32" },
        { value: "48", label: "48\uFF08\u9ED8\u8BA4\uFF09" },
        { value: "64", label: "64" },
        { value: "128", label: "128" },
        { value: "256", label: "256" },
        { value: "512", label: "512" }
      ]
    },
    enableStickerBypass: {
      group: "\u8D34\u7EB8",
      type: "boolean",
      default: true,
      label: "\u7ED5\u8FC7\u8D34\u7EB8\u9650\u5236",
      description: "\u53D1\u9001\u9501\u5B9A\u7684\u8D34\u7EB8\u65F6\u6539\u4E3A\u53D1\u9001\u8D34\u7EB8\u56FE\u7247\u94FE\u63A5\u3002Lottie\uFF08\u77E2\u91CF\uFF09\u8D34\u7EB8\u65E0\u6CD5\u5185\u8054\uFF0C\u4F1A\u8DF3\u8FC7\u3002"
    },
    stickerSize: {
      group: "\u8D34\u7EB8",
      type: "select",
      default: "160",
      label: "\u8D34\u7EB8\u56FE\u7247\u5C3A\u5BF8",
      description: "\u5185\u8054\u8D34\u7EB8\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002",
      options: [
        { value: "32", label: "32" },
        { value: "64", label: "64" },
        { value: "128", label: "128" },
        { value: "160", label: "160\uFF08\u9ED8\u8BA4\uFF09" },
        { value: "256", label: "256" },
        { value: "512", label: "512" }
      ]
    },
    enableStreamQualityBypass: {
      group: "\u76F4\u64AD",
      type: "boolean",
      default: true,
      label: "\u89E3\u9501\u76F4\u64AD\u753B\u8D28",
      description: "\u5141\u8BB8\u4EE5 Nitro \u753B\u8D28\u8FDB\u884C\u5C4F\u5E55\u5171\u4EAB\u76F4\u64AD\uFF08\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u751F\u6548\uFF0C\u56E0\u4E3A\u8FD9\u662F\u6E90\u7801\u7EA7 patch\uFF09\u3002"
    }
  });
  var EmojiStore2 = lazy((m) => m?.getName?.() === "EmojiStore");
  var StickersStore2 = lazy((m) => m?.getName?.() === "StickersStore");
  var GuildMemberStore = lazy((m) => m?.getName?.() === "GuildMemberStore");
  var PermissionStore2 = lazy((m) => m?.getName?.() === "PermissionStore" && typeof m?.can === "function");
  var PERM = {
    USE_EXTERNAL_EMOJIS: 1n << 18n,
    USE_EXTERNAL_STICKERS: 1n << 37n,
    EMBED_LINKS: 1n << 14n
  };
  var STICKER_LOTTIE = StickerFormat.LOTTIE;
  var INTENT_CHAT = 3;
  var INTENT_STICKER_EMOJI = 4;
  function currentPremiumType() {
    try {
      return UserStore.getCurrentUser?.()?.premiumType ?? 0;
    } catch {
      return 0;
    }
  }
  var canUseEmotesNatively = () => currentPremiumType() > 0;
  var canUseStickersNatively = () => currentPremiumType() > 1;
  function hasPermission(channelId, bit) {
    try {
      const channel = ChannelStore.getChannel?.(channelId);
      if (!channel || channel.isPrivate?.()) return true;
      return PermissionStore2.can?.(bit, channel) ?? true;
    } catch {
      return true;
    }
  }
  function guildIdOfChannel(channelId) {
    try {
      const channel = ChannelStore.getChannel?.(channelId);
      return channel?.guild_id ?? channel?.getGuildId?.() ?? void 0;
    } catch {
      return void 0;
    }
  }
  function canUseEmote(emoji, channelId, guildId) {
    if (emoji?.type === 0) return true;
    if (emoji?.available === false) return false;
    let usableManaged = false;
    if (emoji?.managed && emoji?.guildId) {
      const myRoles = GuildMemberStore.getSelfMember?.(emoji.guildId)?.roles ?? [];
      usableManaged = Array.isArray(emoji?.roles) && emoji.roles.some((r) => myRoles.includes(r));
    }
    if (canUseEmotesNatively() || usableManaged) {
      return emoji.guildId === guildId || hasPermission(channelId, PERM.USE_EXTERNAL_EMOJIS);
    }
    return !emoji?.animated && emoji?.guildId === guildId;
  }
  function emojiSize() {
    return Number(settings5.store.emojiSize) || 48;
  }
  function emojiUrl(emoji) {
    return emojiCdnUrl(String(emoji?.id), Boolean(emoji?.animated), emojiSize());
  }
  function stickerUrl(sticker) {
    const url = new URL(stickerCdnUrl(String(sticker?.id), sticker?.format_type, Number(settings5.store.stickerSize) || 160));
    if (sticker?.name) url.searchParams.set("name", String(sticker.name));
    return url.toString();
  }
  function wordBoundary(str, offset) {
    return !str[offset] || /\s/.test(str[offset]) ? "" : " ";
  }
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function findMessageArg(args) {
    const m = args[1];
    if (m && typeof m === "object" && typeof m.content === "string") return m;
    return args.find((a) => a && typeof a === "object" && typeof a.content === "string");
  }
  function findOptionsArg(args) {
    for (let i = 2; i < args.length; i++) {
      const a = args[i];
      if (a && typeof a === "object" && "stickerIds" in a) return a;
    }
    return args[3] && typeof args[3] === "object" ? args[3] : void 0;
  }
  function rewriteStickers(channelId, message, options, guildId) {
    if (!settings5.store.enableStickerBypass) return false;
    const ids = options?.stickerIds;
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const sticker = StickersStore2.getStickerById?.(ids[0]);
    if (!sticker) return false;
    if ("pack_id" in sticker) return false;
    const canUse = canUseStickersNatively() && hasPermission(channelId, PERM.USE_EXTERNAL_STICKERS);
    if (sticker.available !== false && (canUse || sticker.guild_id === guildId)) return false;
    if (sticker.format_type === STICKER_LOTTIE) {
      log20.warn("Lottie \u8D34\u7EB8\u65E0\u6CD5\u4F5C\u4E3A\u56FE\u7247\u5185\u8054\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A", sticker.name);
      return false;
    }
    const url = stickerUrl(sticker);
    message.content = `${message.content ?? ""}${wordBoundary(message.content ?? "", (message.content ?? "").length - 1)}${url}`;
    ids.length = 0;
    return true;
  }
  var EMOJI_TOKEN_RE = /(?<!\\)<(a)?:(\w+):(\d+)>/gi;
  function rewriteEmojis(channelId, message, guildId) {
    if (!settings5.store.enableEmojiBypass) return false;
    let changed = false;
    const emojis = message?.validNonShortcutEmojis;
    if (Array.isArray(emojis) && emojis.length > 0) {
      for (const emoji of emojis) {
        if (canUseEmote(emoji, channelId, guildId)) continue;
        const token = `<${emoji.animated ? "a" : ""}:${emoji.originalName || emoji.name}:${emoji.id}>`;
        const url = emojiUrl(emoji);
        const re = new RegExp(escapeRegExp(token), "g");
        message.content = String(message.content ?? "").replace(
          re,
          (match, offset, str) => {
            changed = true;
            return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + match.length)}`;
          }
        );
      }
    }
    const before = String(message.content ?? "");
    EMOJI_TOKEN_RE.lastIndex = 0;
    if (before.length > 0 && EMOJI_TOKEN_RE.test(before)) {
      EMOJI_TOKEN_RE.lastIndex = 0;
      const rewritten = before.replace(
        EMOJI_TOKEN_RE,
        (tokenStr, animatedFlag, _name, emojiId, offset, str) => {
          const cached2 = EmojiStore2.getCustomEmojiById?.(emojiId);
          if (cached2 && canUseEmote(cached2, channelId, guildId)) return tokenStr;
          changed = true;
          const url = emojiUrlFromParts(emojiId, Boolean(animatedFlag));
          return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + tokenStr.length)}`;
        }
      );
      if (rewritten !== before) message.content = rewritten;
    }
    return changed;
  }
  function emojiUrlFromParts(id, animated) {
    return emojiCdnUrl(id, animated, emojiSize());
  }
  var unpatchSend;
  var unpatchEdit;
  function onSendMessage(ctx) {
    try {
      const args = ctx.args;
      const channelId = args[0];
      const message = findMessageArg(args);
      if (!message) return;
      if (message.__fakeNitroRewritten) return;
      if (typeof message.content !== "string") message.content = String(message.content ?? "");
      const options = findOptionsArg(args);
      const guildId = guildIdOfChannel(channelId);
      if (options) rewriteStickers(channelId, message, options, guildId);
      rewriteEmojis(channelId, message, guildId);
    } catch (err) {
      log20.error("send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001", err);
    }
  }
  function onEditMessage(ctx) {
    try {
      if (!settings5.store.enableEmojiBypass) return;
      const args = ctx.args;
      const channelId = args[0];
      const message = findMessageArg(args);
      if (!message || typeof message.content !== "string") return;
      const guildId = guildIdOfChannel(channelId);
      message.content = message.content.replace(
        EMOJI_TOKEN_RE,
        (tokenStr, animatedFlag, _name, emojiId, offset, str) => {
          const cached2 = EmojiStore2.getCustomEmojiById?.(emojiId);
          if (cached2 && canUseEmote(cached2, channelId, guildId)) return tokenStr;
          const url = emojiUrlFromParts(emojiId, Boolean(animatedFlag));
          return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + tokenStr.length)}`;
        }
      );
    } catch (err) {
      log20.error("edit \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u4FDD\u5B58", err);
    }
  }
  function reportPatches2() {
    const mine = getSourcePatchReport().filter((p) => p.pluginId === "fake-nitro");
    if (!mine.length) {
      log20.warn(
        "\u672C\u63D2\u4EF6\u6CA1\u6709\u6CE8\u518C\u4EFB\u4F55\u6E90\u7801 patch \u2014\u2014 \u542F\u52A8\u65F6\u5B83\u5904\u4E8E\u5173\u95ED\u72B6\u6001\u3002\u5728\u8BBE\u7F6E\u91CC\u6253\u5F00\u201C\u5047 Nitro\u201D\u540E\u5FC5\u987B\u5237\u65B0\u9875\u9762\uFF1A\u6E90\u7801 patch \u53EA\u5728\u6A21\u5757\u52A0\u8F7D\u90A3\u4E00\u523B\u751F\u6548\uFF0C\u4E2D\u9014\u5F00\u542F\u4E0D\u4F1A\u8865\u4E0A\u3002"
      );
      return;
    }
    const name = (p) => p.count > 1 ? `\u201C${p.label}\u201D \u7B2C ${p.index}/${p.count} \u5904` : `\u201C${p.label}\u201D`;
    const missed = mine.filter((p) => !p.applied && !p.optional);
    const degraded = mine.filter((p) => !p.applied && p.optional);
    if (missed.length === 0) {
      log20.info(`\u8868\u60C5 / \u8D34\u7EB8\u89E3\u9501\u7684\u6E90\u7801 patch \u5747\u5DF2\u5728\u5F53\u524D Discord \u7248\u672C\u751F\u6548\uFF08\u5171 ${mine.length} \u5904\u66FF\u6362\uFF09`);
    } else {
      const stale = missed.filter((p) => p.seen > 0);
      const unseen = missed.filter((p) => p.seen === 0);
      if (stale.length > 0) {
        log20.warn(
          "\u4EE5\u4E0B patch \u627E\u5230\u4E86\u76EE\u6807\u6A21\u5757\uFF0C\u4F46\u66FF\u6362\u6B63\u5219\u5DF2\u5BF9\u4E0D\u4E0A\u5F53\u524D Discord \u7248\u672C\uFF08\u9700\u8981\u91CD\u951A\uFF09\uFF1A" + stale.map(name).join("\u3001")
        );
      }
      if (unseen.length > 0) {
        log20.warn(
          "\u4EE5\u4E0B patch \u4ECE\u672A\u62FF\u5230\u76EE\u6807\u6A21\u5757 \u2014\u2014 \u6A21\u5757\u8FD8\u6CA1\u52A0\u8F7D\uFF0C\u6216 find \u5DF2\u5931\u6548\uFF1A" + unseen.map(name).join("\u3001") + "\u3002\u82E5\u76F8\u5173\u754C\u9762\uFF08\u8868\u60C5\u9009\u62E9\u5668\u7B49\uFF09\u5DF2\u7ECF\u6253\u5F00\u8FC7\u4ECD\u662F\u8FD9\u6837\uFF0C\u5C31\u662F find \u9700\u8981\u66F4\u65B0\u3002"
        );
      }
    }
    if (degraded.length > 0) {
      log20.info("\u4EE5\u4E0B\u53EF\u9009 patch \u672A\u5339\u914D\uFF08\u4EC5\u5F71\u54CD\u9644\u5E26\u529F\u80FD\uFF0C\u4E0D\u5F71\u54CD\u8868\u60C5 / \u8D34\u7EB8\uFF09\uFF1A" + degraded.map(name).join("\u3001"));
    }
  }
  var IS_BYPASSEABLE_INTENTION = `[${INTENT_CHAT},${INTENT_STICKER_EMOJI}].includes(fakeNitroIntention)`;
  var fake_nitro_default = definePlugin({
    id: "fake-nitro",
    name: "\u5047 Nitro",
    description: "\u65E0\u9700 Nitro \u4E5F\u80FD\u4F7F\u7528\u9700\u8981 Nitro \u7684\u81EA\u5B9A\u4E49\u8868\u60C5\u4E0E\u8D34\u7EB8\uFF1A\u89E3\u9501\u9009\u62E9\u5668\uFF0C\u5E76\u5728\u53D1\u9001\u65F6\u628A\u9501\u5B9A\u7684\u8868\u60C5 / \u8D34\u7EB8\u81EA\u52A8\u6539\u5199\u4E3A\u56FE\u7247\u94FE\u63A5\uFF0C\u5BF9\u65B9\u770B\u5230\u7684\u5C31\u662F\u5185\u8054\u56FE\u7247\u3002\u4FEE\u6539\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "chat",
    settings: settings5,
    patches: [
      // 0. THE send-time fix — pre-send rewrite, same seam as Vencord's
      //    MessageEventsAPI (find: ".handleSendMessage,onResize:"), but the match
      //    is re-anchored to THIS build's `handleSendMessage`, verified against
      //    the dumped module source. Vencord's upstream regex expects
      //    `parse(channel,...).getSendMessageOptions({...});` back-to-back; this
      //    build instead reads:
      //
      //      let w=X.Y.parse(h,t);            // w = parsed draft (validNonShortcutEmojis)
      //      w.tts=...; ...
      //      let I={...Z.getSendMessageOptions({content:t,channelId:h.id,...}),
      //             location:...};            // I = send options (stickerIds)
      //      if(...) <send>
      //
      //    So we capture w (message), h (channel), I (options) and splice our
      //    rewrite in right after `let I={...};` — before the send, and before
      //    the client-side "该表情符号为动态表情" check that otherwise aborts an
      //    animated / cross-server emoji locally. By then the `<a:name:id>` token
      //    is already a CDN URL, so the check sees a plain link and lets it through.
      //
      //    Hooking MessageActions.sendMessage (the old approach) fired AFTER that
      //    block already killed the send — which is why the emoji came back
      //    "无法使用" no matter what.
      //
      //    NOTE (verified against the current bundle): this patch is no longer
      //    load-bearing. Discord's `_sendMessage` does NOT abort on locked
      //    emoji — it posts a local Clyde notice and sends anyway — and once the
      //    picker patch below lands, `isEmojiPremiumLocked` returns false for
      //    CHAT, so `parse()` files these emoji under validNonShortcutEmojis and
      //    `invalidEmojis` comes back empty. The runtime sendMessage hook is
      //    therefore enough on its own; this patch just gets the rewrite in
      //    earlier. If the boot report says it missed, sending still works.
      {
        label: "message pre-send rewrite",
        find: /handleSendMessage[\s\S]{0,200}onResize|getSendMessageOptions[\s\S]{0,500}handleSendMessage/,
        replacement: {
          match: /let ([\w$]+)=[\w$]+\.[\w$]+\.parse\(([\w$]+),[\w$]+\);.+?let ([\w$]+)=\{\.\.\.[\w$]+\.[\w$]+\.getSendMessageOptions\(\{.+?\}\),location:[^}]*\};/,
          replace: (m, msg, channel, options) => `${m}if($self.handlePreSend(${channel}.id,${msg},${options}))return{shouldClear:false,shouldRefocus:true};`
        }
      },
      // 1. Premium predicate bypass. The `canUse…` helpers under PremiumUtils
      //    gate every "is this a premium feature?" check in the client. Rewrite
      //    each function body to just `return true;` so the picker, sticker
      //    dropdowns, and stream-quality options all show as usable.
      {
        label: "premium predicates return true",
        find: "canUseCustomStickersEverywhere:",
        replacement: [
          {
            match: /(?<=canUseCustomStickersEverywhere:function\([\w$]+\)\{)/,
            replace: "return true;"
          },
          {
            match: /(?<=canUseHighVideoUploadQuality:function\([\w$]+\)\{)/,
            replace: "return true;"
          },
          {
            match: /(?<=canStreamQuality:function\([\w$]+,[\w$]+\)\{)/,
            replace: "return true;"
          },
          {
            match: /(?<=canUseClientThemes:function\([\w$]+\)\{)/,
            replace: "return true;"
          },
          {
            match: /(?<=canUsePremiumAppIcons:function\([\w$]+\)\{)/,
            replace: "return true;"
          }
        ]
      },
      // 2. Voice-call emoji picker keeps its native (server-side) restriction:
      //    fake-nitro shouldn't try to bypass emoji use in voice channels where
      //    the intention isn't CHAT. Vencord swaps the CHAT constant for STATUS
      //    at this exact call site so our picker patches leave voice alone.
      {
        label: "voice call emoji stays native",
        find: '.getByName("fork_and_knife")',
        replacement: {
          match: /\.CHAT/,
          replace: ".STATUS"
        }
      },
      // 3. Emoji picker unlock. The module that produces the "why is this emoji
      //    disabled?" enum has multiple gates: DISALLOW_EXTERNAL,
      //    GUILD_SUBSCRIPTION_UNAVAILABLE, premium-locked, animated-locked.
      //    Widen each so intentions CHAT (3) and GUILD_STICKER_RELATED_EMOJI (4)
      //    pass, giving the picker "usable" for anything we're about to rewrite
      //    into a URL anyway.
      {
        label: "emoji picker unlock",
        find: ".GUILD_SUBSCRIPTION_UNAVAILABLE;",
        replacement: [
          // Introduce `fakeNitroIntention`, bound to Discord's own intention
          // variable, so the widenings below can key off it.
          //
          // Vencord anchors this on the literal `intention:` token — but that
          // token is ABSENT in the current build (verified against the dumped
          // module source): the intention is a bare minified variable, e.g.
          // `d`, compared as `d===X.EmojiIntention.STATUS`. Anchoring on the
          // (present) `.USE_EXTERNAL_EMOJIS,x);` statement boundary and reading
          // the intention variable out of the nearby
          // `isExternalEmojiAllowedForIntention(d)` call is what actually lands.
          //
          // This one MUST match: patches #2–#5 below all reference
          // `fakeNitroIntention`, so if this fails while they apply, the emoji
          // function throws ReferenceError on every call and the picker greys
          // out everything — which is exactly the "全是锁" symptom this fixes.
          {
            match: /(?<=\.USE_EXTERNAL_EMOJIS,[\w$]+\);)(?=.{0,300}?isExternalEmojiAllowedForIntention\)\(([\w$]+)\))/,
            replace: "const fakeNitroIntention=$1;"
          },
          // DISALLOW_EXTERNAL: bypass for our intentions.
          {
            match: /&&![\w$]+&&![\w$]+(?=\)return [\w$]+\.[\w$]+\.DISALLOW_EXTERNAL;)/,
            replace: `$&&&!${IS_BYPASSEABLE_INTENTION}`
          },
          // GUILD_SUBSCRIPTION_UNAVAILABLE: bypass for our intentions.
          {
            match: /![\w$]+\.available(?=\)return [\w$]+\.[\w$]+\.GUILD_SUBSCRIPTION_UNAVAILABLE;)/,
            replace: `$&&&!${IS_BYPASSEABLE_INTENTION}`
          },
          // "You need premium for cross-server emoji". THIS is the one Discord's
          // update broke, and the one that shows as 跨服务器表情全部上锁 with the
          // 获取 Nitro banner: the gate used to read
          //
          //   if(!X.canUseEmojisEverywhere(user)&&!sameGuild){…PREMIUM_LOCKED}
          //
          // and now reads
          //
          //   if(!(bypassEntitlement||X.canUseEmojisEverywhere(user))&&!sameGuild)
          //
          // so a regex anchored on a `!` sitting directly against the call no
          // longer matches. Rather than re-pin to the new shape (and break again
          // on the next reshuffle) match the CALL and widen it in place, keeping
          // whatever negation wrapper it sits in. `(call||bypassable)` inside
          // `!(…)` and inside a bare `!…` both collapse to "not locked", so this
          // holds for either shape.
          {
            match: /!\(?(?:[\w$]+\|\|)?([\w$]+\.[\w$]+\.canUseEmojisEverywhere\([\w$]+\))/,
            replace: (m, call) => m.replace(call, `(${call}||${IS_BYPASSEABLE_INTENTION})`)
          },
          // "You need premium for animated emoji": pretend we can, for our intentions.
          {
            match: /(?<=\|\|)[\w$]+\.[\w$]+\.canUseAnimatedEmojis\([\w$]+\)/,
            replace: `($&||${IS_BYPASSEABLE_INTENTION})`
          }
        ]
      },
      // 4. Subscription-locked (role-benefit) emoji unlock. A guarded predicate
      //    returns false when the current user lacks admin on the role-benefit
      //    guild. Route calls that WE make (with a fakeNitroOriginal=true tail
      //    arg) through the original, and let everyone else's calls (i.e. the
      //    picker's own probe) short-circuit to "usable".
      {
        label: "subscription emoji unlock",
        find: ".getUserIsAdmin(",
        replacement: {
          match: /(function [\w$]+\([\w$]+,[\w$]+)\)\{(.{0,250}\.getUserIsAdmin\(.+?return!1\})/,
          replace: "$1,fakeNitroOriginal){if(!fakeNitroOriginal)return false;$2"
        }
      },
      // 5. Sticker always "SENDABLE". Same trick: rewrite the availability
      //    predicate at the sticker send-affordance site so the picker doesn't
      //    grey out locked stickers before our runtime send hook can rewrite
      //    them into image links.
      {
        label: "stickers always sendable",
        find: '"SENDABLE"',
        replacement: {
          match: /[\w$]+\.available\?/,
          replace: "true?"
        }
      },
      // 6. Stream quality: drop the `guildPremiumTier: TIER_x,` requirements
      //    from the stream FPS / resolution options so all quality tiers are
      //    picker-visible regardless of the server's boost level.
      //
      //    NOTE: Vencord's find is the intl macro `#{intl::STREAM_FPS_OPTION}`,
      //    which its build step rewrites into the real (hashed) runtime lookup.
      //    This runtime has no such transform, so that literal never appears in
      //    Discord's code. We fall back to the bare `STREAM_FPS_OPTION` token as
      //    a best effort; if the build hashes it away this patch simply no-ops
      //    (stream quality is a minor extra — it never blocks emoji/sticker use).
      {
        label: "stream quality tiers removed",
        find: "STREAM_FPS_OPTION",
        all: true,
        optional: true,
        replacement: {
          match: /guildPremiumTier:[\w$]+\.[\w$]+\.TIER_\d,?/,
          replace: ""
        }
      },
      // 7. Custom desktop app icons — the picker checks `isPremium(currentUser)`.
      //    Force true. Small quality-of-life patch that comes free with the
      //    premium-bypass mood.
      {
        label: "custom app icons",
        find: "getCurrentDesktopIcon(),",
        replacement: {
          match: /[\w$]+\.[\w$]+\.isPremium\([\w$]+\.[\w$]+\.getCurrentUser\(\)\)/,
          replace: "true"
        }
      },
      // 8. Custom client themes — a `isTier2Above` gate on the custom-theme
      //    editor. Force true so the editor unlocks for the user.
      {
        label: "custom client themes",
        find: '("custom_themes_editor_footer")',
        all: true,
        optional: true,
        replacement: {
          match: /\(0,[\w$]+\.[\w$]+\)\([\w$]+\.[\w$]+\.TIER_2\)(?=,|;)/,
          replace: "true"
        }
      },
      // 9. Soundboard sounds — `available` fields arrive as false for locked
      //    sounds on non-Nitro accounts. Force them to true on the ingest
      //    reducers so the picker treats them as usable.
      {
        label: "soundboard sounds available",
        find: 'type:"GUILD_SOUNDBOARD_SOUND_CREATE"',
        all: true,
        replacement: {
          match: /(?<=type:"(?:SOUNDBOARD_SOUNDS_RECEIVED|GUILD_SOUNDBOARD_SOUND_CREATE|GUILD_SOUNDBOARD_SOUND_UPDATE|GUILD_SOUNDBOARD_SOUNDS_UPDATE)".+?available:)[\w$]+\.available/,
          replace: "true"
        }
      }
    ],
    start() {
      const messageActions = findByProps("sendMessage", "editMessage", "deleteMessage");
      if (messageActions) {
        if (typeof messageActions.sendMessage === "function") {
          try {
            unpatchSend = patcher.before(messageActions, "sendMessage", onSendMessage);
          } catch (err) {
            log20.error("\u6302\u63A5 sendMessage \u5931\u8D25", err);
          }
        }
        if (typeof messageActions.editMessage === "function") {
          try {
            unpatchEdit = patcher.before(messageActions, "editMessage", onEditMessage);
          } catch (err) {
            log20.error("\u6302\u63A5 editMessage \u5931\u8D25", err);
          }
        }
        log20.info("MessageActions \u5DF2\u6302\u63A5\uFF08\u53D1\u9001 / \u7F16\u8F91\u6539\u5199\u5C31\u7EEA\uFF1B\u82E5 pre-send \u8865\u4E01\u5DF2\u751F\u6548\u5219\u6B64 hook \u4EC5\u4F5C fallback\uFF09");
      } else {
        log20.warn(
          "\u672A\u627E\u5230 MessageActions \u2014\u2014 \u9009\u62E9\u5668\u89E3\u9501\u5DF2\u901A\u8FC7\u6E90\u7801 patch \u751F\u6548\uFF0C\u4F46\u53D1\u9001\u65F6\u7684 URL \u6539\u5199\u4E0D\u53EF\u7528\u3002\u91CD\u542F\u5BA2\u6237\u7AEF\u540E\u518D\u8BD5\uFF1B\u82E5\u4ECD\u672A\u627E\u5230\uFF0C\u8BF4\u660E\u8BE5 Discord \u7248\u672C\u7684 MessageActions \u5F62\u72B6\u6709\u53D8\u3002"
        );
      }
      setTimeout(reportPatches2, 4e3);
    },
    stop() {
      unpatchSend?.();
      unpatchEdit?.();
      unpatchSend = void 0;
      unpatchEdit = void 0;
    },
    /**
     * Called from the pre-send source patch (#0) with Discord's freshly parsed
     * draft — at the exact point Vencord's MessageEventsAPI fires, after parse
     * and before send. Rewrites locked sticker ids and emoji tokens in
     * `messageObj` IN PLACE into CDN URLs. Returns false so the send is never
     * cancelled: we've already mutated the draft, there's nothing to abort.
     * Guarded end-to-end — a throw here must never break the send box.
     */
    handlePreSend(channelId, messageObj, options) {
      try {
        if (typeof messageObj?.content !== "string") {
          messageObj.content = String(messageObj?.content ?? "");
        }
        const guildId = guildIdOfChannel(channelId);
        if (options) rewriteStickers(channelId, messageObj, options, guildId);
        rewriteEmojis(channelId, messageObj, guildId);
        messageObj.__fakeNitroRewritten = true;
      } catch (err) {
        log20.error("pre-send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001", err);
      }
      return false;
    }
  });

  // src/plugins/console-cleaner/index.ts
  var log21 = logger("console-cleaner");
  var settings6 = defineSettings({
    hideSelfXss: {
      group: "\u5185\u7F6E\u89C4\u5219",
      type: "boolean",
      default: true,
      label: "\u5C4F\u853D\u81EA\u6211 XSS \u8B66\u544A",
      description: "Discord \u90A3\u6761\u6BCF\u79D2\u91CD\u5237\u7684\u7EA2\u8272\u201C\u7B49\u4E00\u4E0B\uFF01/ Stop!\u201D\u7C98\u8D34\u8B66\u544A\u3002"
    },
    hideLocaleSpam: {
      group: "\u5185\u7F6E\u89C4\u5219",
      type: "boolean",
      default: true,
      label: "\u5C4F\u853D\u672C\u5730\u5316\u7F3A\u5931\u5237\u5C4F",
      description: "\u201C\u2026 does not have a value in the requested locale \u2026\u201D\uFF0C\u5BA2\u6237\u7AEF mod \u8BA2\u9605\u4E8B\u4EF6\u65F6\u4F1A\u75AF\u72C2\u5237\u3002"
    },
    hideRiveSpam: {
      group: "\u5185\u7F6E\u89C4\u5219",
      type: "boolean",
      default: true,
      label: "\u5C4F\u853D Rive \u52A8\u753B\u62A5\u9519",
      description: "\u201CCould not find a View Model linked to Artboard \u2026\u201D\uFF0C\u9644\u5E26\u8D85\u957F wasm \u5806\u6808\u3002"
    },
    hidePreloadWarnings: {
      group: "\u5185\u7F6E\u89C4\u5219",
      type: "boolean",
      default: true,
      label: "\u5C4F\u853D\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A",
      description: "\u201Cresource was preloaded using link preload but not used \u2026\u201D\u3002\u89C1\u4E0B\u65B9\u8BF4\u660E\uFF1A\u90E8\u5206\u6B64\u7C7B\u8B66\u544A\u7531\u6D4F\u89C8\u5668\u76F4\u63A5\u4EA7\u751F\uFF0C\u65E0\u6CD5\u62E6\u622A\u3002"
    },
    customPatterns: {
      group: "\u81EA\u5B9A\u4E49",
      type: "string-list",
      default: [],
      label: "\u81EA\u5B9A\u4E49\u5C4F\u853D\u5173\u952E\u8BCD",
      description: "\u4EFB\u4F55\u4E00\u6761 console \u6D88\u606F\u53EA\u8981\u5305\u542B\u8FD9\u91CC\u7684\u67D0\u4E2A\u5B50\u4E32\uFF0C\u5C31\u4F1A\u88AB\u4E22\u5F03\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09\u3002",
      itemPlaceholder: "\u8981\u5C4F\u853D\u7684\u6587\u5B57\u7247\u6BB5"
    }
  });
  var SELF_XSS_NEEDLES = [
    "\u7B49\u4E00\u4E0B",
    "\u5728\u8FD9\u91CC\u7C98\u8D34",
    "\u5982\u679C\u6709\u4EBA\u544A\u8BC9\u60A8",
    "\u8BF7\u5173\u95ED\u6B64\u7A97\u53E3",
    "Stop!",
    "self-XSS",
    "browser feature intended for developers",
    "This is a browser feature",
    "Nicht so schnell",
    "Attends",
    "Alto",
    "\u3061\u3087\u3063\u3068\u5F85\u3063\u3066",
    "\uC7A0\uAE50"
  ];
  var LOCALE_NEEDLES = ["does not have a value in the requested locale"];
  var RIVE_NEEDLES = [
    "Could not find a View Model linked to Artboard",
    "BaseGlowRemapped"
  ];
  var PRELOAD_NEEDLES = [
    "was preloaded using link preload",
    "preloaded intentionally"
  ];
  var METHODS = ["log", "info", "warn", "error", "debug"];
  function textOf(args) {
    let out = "";
    for (const a of args) {
      if (typeof a === "string") out += a + " ";
      else if (typeof a === "number" || typeof a === "boolean") out += String(a) + " ";
    }
    return out;
  }
  function anyNeedle(text, needles) {
    for (const n of needles) if (n && text.includes(n)) return true;
    return false;
  }
  function shouldSuppress(args) {
    if (typeof args[0] === "string" && args[0].startsWith("%cHalcyon")) return false;
    const text = textOf(args);
    if (text === "") return false;
    const s = settings6.store;
    if (s.hideSelfXss && anyNeedle(text, SELF_XSS_NEEDLES)) return true;
    if (s.hideLocaleSpam && anyNeedle(text, LOCALE_NEEDLES)) return true;
    if (s.hideRiveSpam && anyNeedle(text, RIVE_NEEDLES)) return true;
    if (s.hidePreloadWarnings && anyNeedle(text, PRELOAD_NEEDLES)) return true;
    if (s.customPatterns.length && anyNeedle(text, s.customPatterns)) return true;
    return false;
  }
  var unpatchers = [];
  var suppressedCount = 0;
  function makeHook() {
    return (ctx) => {
      try {
        if (shouldSuppress(ctx.args)) {
          suppressedCount++;
          return void 0;
        }
      } catch {
      }
      return ctx.callOriginal();
    };
  }
  var console_cleaner_default = definePlugin({
    id: "console-cleaner",
    name: "\u63A7\u5236\u53F0\u51C0\u5316",
    description: "\u5C4F\u853D Discord \u5728\u5F00\u53D1\u8005\u63A7\u5236\u53F0\u91CC\u5237\u5C4F\u7684\u65E0\u7528\u4FE1\u606F\uFF08\u81EA\u6211 XSS \u8B66\u544A\u3001Rive \u52A8\u753B\u62A5\u9519\u3001\u672C\u5730\u5316\u7F3A\u5931\u3001\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A\uFF09\uFF0C\u652F\u6301\u81EA\u5B9A\u4E49\u5173\u952E\u8BCD\u3002\u5173\u95ED\u63D2\u4EF6\u5373\u6062\u590D\u539F\u59CB console\u3002",
    authors: [{ name: "caitemm" }, { name: "catie" }],
    category: "utility",
    settings: settings6,
    start() {
      const con = globalThis.console;
      if (!con) {
        log21.warn("\u672A\u627E\u5230 console \u5BF9\u8C61\uFF0C\u63D2\u4EF6\u65E0\u4E8B\u53EF\u505A");
        return;
      }
      suppressedCount = 0;
      const hook = makeHook();
      for (const method of METHODS) {
        if (typeof con[method] === "function") {
          try {
            unpatchers.push(patcher.instead(con, method, hook));
          } catch (err) {
            log21.error(`\u6302\u63A5 console.${method} \u5931\u8D25`, err);
          }
        }
      }
      log21.info(
        `\u5DF2\u51C0\u5316 console\uFF08\u62E6\u622A ${unpatchers.length} \u4E2A\u65B9\u6CD5\uFF09\u3002\u6CE8\u610F\uFF1A\u6D4F\u89C8\u5668\u81EA\u8EAB\u4EA7\u751F\u7684\u8B66\u544A\uFF08\u5982\u67D0\u4E9B preload \u63D0\u793A\uFF09\u65E0\u6CD5\u901A\u8FC7 JS \u62E6\u622A\u3002`
      );
    },
    stop() {
      for (const undo of unpatchers) {
        try {
          undo();
        } catch {
        }
      }
      unpatchers = [];
      log21.info(`\u5DF2\u6062\u590D\u539F\u59CB console\uFF08\u672C\u6B21\u5171\u5C4F\u853D ${suppressedCount} \u6761\u6D88\u606F\uFF09`);
    }
  });

  // src/plugins/emote-cloner/clone.ts
  var log22 = logger("emote-cloner");
  var MAX_EMOJI_SIZE_BYTES = 256 * 1024;
  var MAX_STICKER_SIZE_BYTES = 512 * 1024;
  var uploadEmojiAction = null;
  function getUploadEmoji() {
    if (uploadEmojiAction) return uploadEmojiAction;
    uploadEmojiAction = findByCode(".GUILD_EMOJIS(", "EMOJI_UPLOAD_START") ?? null;
    return uploadEmojiAction;
  }
  function sanitizeEmojiName(name) {
    let n = (name || "emoji").split("~")[0].replace(/[^\w]/g, "_");
    if (n.length < 2) n = `${n}_e`;
    return n.slice(0, 32);
  }
  function stickerExt(formatType) {
    if (formatType === 4) return "gif";
    if (formatType === 3) return "json";
    return "png";
  }
  function emojiUrl2(id, size) {
    return `https://cdn.discordapp.com/emojis/${id}.webp?size=${size}&lossless=true&animated=true`;
  }
  function stickerUrl2(id, ext, size) {
    return `https://media.discordapp.net/stickers/${id}.${ext}?size=${size}&lossless=true&animated=true`;
  }
  async function fetchBlobUnderLimit(makeUrl, maxBytes) {
    for (let size = 4096; size >= 16; size /= 2) {
      const url = makeUrl(size);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25\uFF1AHTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size <= maxBytes) return blob;
    }
    throw new Error(`\u56FE\u7247\u8D85\u51FA\u5927\u5C0F\u9650\u5236\uFF08${Math.round(maxBytes / 1024)}KB\uFF09`);
  }
  function blobToDataUri(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25"));
      reader.readAsDataURL(blob);
    });
  }
  function resPayload(res) {
    if (res == null) return null;
    if (res.body != null && !(typeof res.body === "object" && Object.keys(res.body).length === 0)) {
      return res.body;
    }
    if (typeof res.text === "string" && res.text) {
      try {
        return JSON.parse(res.text);
      } catch {
      }
    }
    return res.body ?? null;
  }
  function restErrorMessage(err) {
    const body = err?.body ?? err?.response?.body;
    if (body) {
      try {
        const walk = (o) => {
          if (!o || typeof o !== "object") return void 0;
          if (Array.isArray(o._errors) && o._errors[0]?.message) return o._errors[0].message;
          for (const k of Object.keys(o)) {
            const hit = walk(o[k]);
            if (hit) return hit;
          }
          return void 0;
        };
        const specific = walk(body.errors);
        if (specific) return specific;
      } catch {
      }
      if (typeof body.message === "string") return body.message;
    }
    if (typeof err?.text === "string") {
      try {
        const parsed = JSON.parse(err.text);
        if (parsed?.message) return parsed.message;
      } catch {
      }
    }
    return err?.message ? String(err.message) : "\u672A\u77E5\u9519\u8BEF";
  }
  async function cloneEmoji(guildId, emoji) {
    const blob = await fetchBlobUnderLimit((size) => emojiUrl2(emoji.id, size), MAX_EMOJI_SIZE_BYTES);
    const image = await blobToDataUri(blob);
    const name = sanitizeEmojiName(emoji.name);
    const upload = getUploadEmoji();
    if (typeof upload === "function") {
      try {
        await upload({ guildId, name, image });
        return;
      } catch (err) {
        log22.error("emoji \u4E0A\u4F20\uFF08action\uFF09\u5931\u8D25", err);
        throw new Error(restErrorMessage(err));
      }
    }
    try {
      await RestAPI.post({ url: `/guilds/${guildId}/emojis`, body: { image, name, roles: [] } });
    } catch (err) {
      log22.error("emoji \u4E0A\u4F20\uFF08REST\uFF09\u5931\u8D25", err);
      throw new Error(restErrorMessage(err));
    }
  }
  async function fetchStickerInfo(id) {
    try {
      const cached2 = StickersStore.getStickerById?.(id);
      if (cached2) return cached2;
    } catch {
    }
    try {
      const res = await RestAPI.get({ url: `/stickers/${id}` });
      const body = resPayload(res);
      if (body) {
        try {
          getDispatcher()?.dispatch({ type: "STICKER_FETCH_SUCCESS", sticker: body });
        } catch {
        }
      }
      return body;
    } catch (err) {
      log22.warn("could not fetch sticker info; using fallbacks", err);
      return null;
    }
  }
  async function cloneSticker(guildId, sticker) {
    const info = await fetchStickerInfo(sticker.id);
    if (info?.format_type === 3) {
      throw new Error("\u8FD9\u662F Lottie \u52A8\u6001\u8D34\u7EB8\uFF0C\u65E0\u6CD5\u590D\u5236");
    }
    const name = (info?.name || sticker.name || "sticker").slice(0, 30);
    const tags = sticker.tags || info?.tags || "\u{1F642}";
    const description = (sticker.description ?? info?.description ?? "").slice(0, 100);
    const ext = stickerExt(info?.format_type);
    const blob = await fetchBlobUnderLimit(
      (size) => stickerUrl2(sticker.id, ext, size),
      MAX_STICKER_SIZE_BYTES
    );
    const form = new FormData();
    form.append("name", name);
    form.append("tags", tags);
    form.append("description", description);
    form.append("file", new File([blob], `sticker.${ext}`, { type: ext === "gif" ? "image/gif" : "image/png" }));
    const url = Constants?.Endpoints?.GUILD_STICKER_PACKS?.(guildId) ?? `/guilds/${guildId}/stickers`;
    let created;
    try {
      const res = await RestAPI.post({ url, body: form });
      created = resPayload(res);
      if (created && !created.id && created.sticker?.id) created = created.sticker;
    } catch (err) {
      log22.error("sticker \u4E0A\u4F20\u5931\u8D25", err);
      throw new Error(restErrorMessage(err));
    }
    log22.info("sticker uploaded", { id: created?.id, name: created?.name });
    try {
      getDispatcher()?.dispatch({
        type: "GUILD_STICKERS_CREATE_SUCCESS",
        guildId,
        sticker: { ...created, user: UserStore.getCurrentUser?.() }
      });
    } catch {
    }
  }

  // src/plugins/emote-cloner/resolve.ts
  var log23 = logger("emote-cloner");
  var SNOWFLAKE = /^\d{5,25}$/;
  var EMOJI_NAME = /^\w{1,32}(?:~\d+)?$/;
  function emojiName(raw) {
    if (typeof raw !== "string") return void 0;
    const n = raw.replace(/:/g, "").trim();
    return EMOJI_NAME.test(n) ? n : void 0;
  }
  function stickerName(raw) {
    if (typeof raw !== "string") return void 0;
    const n = raw.trim();
    return n && n.length <= 30 && !n.includes("\n") ? n : void 0;
  }
  function isGifUrl(url) {
    if (!url) return false;
    try {
      const u = new URL(url, location.href);
      return u.pathname.endsWith(".gif") || u.searchParams.get("animated") === "true";
    } catch {
      return /\.gif(\?|$)/.test(url) || url.includes("animated=true");
    }
  }
  function parseEmojiUrl(src) {
    const m = src.match(/\/emojis\/(\d+)\.(\w+)/);
    if (!m) return null;
    let name;
    try {
      const raw = new URL(src, location.href).searchParams.get("name");
      name = raw ? decodeURIComponent(raw) : void 0;
    } catch {
    }
    return { id: m[1], isAnimated: m[2] === "gif" || /animated=true/.test(src), name };
  }
  function parseStickerUrl(src) {
    const m = src.match(/\/stickers\/(\d+)\./);
    return m ? { id: m[1] } : null;
  }
  function isLottie(el) {
    return String(el?.className ?? "").toLowerCase().includes("lottie");
  }
  function gatherImages(target) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    const add = (el) => {
      if (el && el.tagName === "IMG" && !seen.has(el)) {
        seen.add(el);
        out.push(el);
      }
    };
    add(target);
    target.querySelectorAll?.("img").forEach(add);
    let cur = target.parentElement;
    for (let depth = 0; depth < 4 && cur; depth++, cur = cur.parentElement) {
      add(cur);
      cur.querySelectorAll?.(":scope > img").forEach(add);
    }
    return out;
  }
  function selfAndAncestors(target, depth = 5) {
    const out = [];
    let cur = target;
    for (let i = 0; cur && i <= depth; i++, cur = cur.parentElement) out.push(cur);
    return out;
  }
  var SCAN_MAX_DEPTH = 5;
  var SCAN_MAX_NODES = 900;
  function findRecordById(root, id) {
    let budget = SCAN_MAX_NODES;
    const seen = /* @__PURE__ */ new Set();
    const walk = (value, depth) => {
      if (value == null || typeof value !== "object") return null;
      if (depth > SCAN_MAX_DEPTH || budget-- <= 0) return null;
      if (seen.has(value)) return null;
      seen.add(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          const hit = walk(item, depth + 1);
          if (hit) return hit;
        }
        return null;
      }
      if (value.$$typeof != null || value.nodeType != null || value.stateNode != null) return null;
      try {
        if (String(value.id ?? "") === id && typeof value.name === "string") {
          return { name: value.name, animated: Boolean(value.animated ?? value.isAnimated) };
        }
        if (typeof value.emojiName === "string" && String(value.emojiId ?? "") === id) {
          return { name: value.emojiName, animated: Boolean(value.animated ?? value.isAnimated) };
        }
      } catch {
      }
      let keys;
      try {
        keys = Object.keys(value);
      } catch {
        return null;
      }
      for (const key of keys) {
        if (key.charCodeAt(0) === 95) continue;
        let child;
        try {
          child = value[key];
        } catch {
          continue;
        }
        if (child == null || typeof child !== "object") continue;
        const hit = walk(child, depth + 1);
        if (hit) return hit;
      }
      return null;
    };
    return walk(root, 0);
  }
  function recordFromFiber(target, id) {
    for (const props of getFiberPropsChain(target)) {
      const hit = findRecordById(props, id);
      if (hit) return hit;
    }
    return null;
  }
  function messageFromDom(target) {
    const el = target.closest?.(
      "[id^='chat-messages-'],[data-list-item-id*='chat-messages']"
    );
    if (!el) return null;
    const raw = el.id || el.dataset?.listItemId || "";
    const ids = raw.match(/\d{5,25}/g);
    if (!ids || ids.length === 0) return null;
    const messageId = ids[ids.length - 1];
    let channelId = ids.length > 1 ? ids[ids.length - 2] : void 0;
    try {
      channelId ??= SelectedChannelStore.getChannelId?.();
    } catch {
    }
    if (!channelId) return null;
    try {
      return MessageStore.getMessage?.(channelId, messageId) ?? null;
    } catch {
      return null;
    }
  }
  function messagesNear(target) {
    const out = [];
    for (const props of getFiberPropsChain(target)) {
      const msg = props?.message;
      if (msg && typeof msg === "object" && typeof msg.content === "string") {
        out.push(msg);
        break;
      }
    }
    const fromDom = messageFromDom(target);
    if (fromDom && typeof fromDom === "object" && fromDom !== out[0]) out.push(fromDom);
    return out;
  }
  function emojiNameFromMessages(target, id) {
    if (!SNOWFLAKE.test(id)) return void 0;
    const inContent = new RegExp(`<a?:(\\w+)(?:~\\d+)?:${id}>`);
    for (const msg of messagesNear(target)) {
      try {
        const m = typeof msg.content === "string" ? inContent.exec(msg.content) : null;
        const fromContent = emojiName(m?.[1]);
        if (fromContent) return fromContent;
        const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
        for (const r of reactions) {
          if (String(r?.emoji?.id ?? "") === id) {
            const hit = emojiName(r.emoji.name);
            if (hit) return hit;
          }
        }
      } catch {
      }
    }
    return void 0;
  }
  function stickerNameFromMessages(target, id) {
    for (const msg of messagesNear(target)) {
      try {
        const items = Array.isArray(msg.stickerItems) ? msg.stickerItems : Array.isArray(msg.stickers) ? msg.stickers : [];
        for (const s of items) {
          if (String(s?.id ?? "") === id) {
            const hit = stickerName(s.name);
            if (hit) return hit;
          }
        }
      } catch {
      }
    }
    return void 0;
  }
  function emojiNameFromStore(id) {
    const store = EmojiStore;
    const tries = [
      () => store.getCustomEmojiById?.(id),
      () => store.getUsableCustomEmojiById?.(id),
      () => store.getDisambiguatedEmojiContext?.()?.getById?.(id)
    ];
    for (const attempt of tries) {
      try {
        const hit = emojiName(attempt()?.name);
        if (hit) return hit;
      } catch {
      }
    }
    return void 0;
  }
  var NAME_ATTRS = ["data-name", "alt", "aria-label", "title"];
  function emojiNameFromDom(elements) {
    for (const el of elements) {
      for (const attr of NAME_ATTRS) {
        const hit = emojiName(el.getAttribute?.(attr));
        if (hit) return hit;
      }
    }
    return void 0;
  }
  function locate(target) {
    const dataEl = target.closest?.("[data-type='emoji'],[data-type='sticker']");
    if (dataEl) {
      const { id, name, type } = dataEl.dataset;
      const img = dataEl.tagName === "IMG" ? dataEl : dataEl.querySelector("img");
      if (id && SNOWFLAKE.test(id) && type === "emoji") {
        return {
          kind: "emoji",
          id,
          domName: name,
          img,
          isAnimated: isGifUrl(img?.currentSrc || img?.src)
        };
      }
      if (id && SNOWFLAKE.test(id) && type === "sticker" && !isLottie(dataEl)) {
        return { kind: "sticker", id, domName: name, img, isAnimated: false };
      }
    }
    for (const img of gatherImages(target)) {
      const src = img.currentSrc || img.src || "";
      const emoji = parseEmojiUrl(src);
      if (emoji) {
        return {
          kind: "emoji",
          id: emoji.id,
          domName: emoji.name,
          img,
          isAnimated: emoji.isAnimated || isGifUrl(src)
        };
      }
      const sticker = parseStickerUrl(src);
      if (sticker) {
        if (isLottie(img)) return null;
        return { kind: "sticker", id: sticker.id, domName: img.alt, img, isAnimated: false };
      }
    }
    return null;
  }
  function resolveExpression(target) {
    if (!target) return null;
    const found = locate(target);
    if (!found) return null;
    const elements = selfAndAncestors(target);
    if (found.img && !elements.includes(found.img)) elements.push(found.img);
    if (found.kind === "sticker") {
      const record3 = recordFromFiber(target, found.id);
      const name = stickerName(record3?.name) ?? stickerNameFromMessages(target, found.id) ?? stickerName(found.domName) ?? stickerName(found.img?.alt);
      return { kind: "sticker", id: found.id, name };
    }
    const record2 = recordFromFiber(target, found.id);
    const resolved = emojiName(record2?.name) ?? emojiNameFromMessages(target, found.id) ?? emojiNameFromStore(found.id) ?? emojiNameFromDom(elements) ?? emojiName(found.domName);
    if (!resolved) {
      log23.warn(`could not resolve this emoji's name; falling back to "emoji"`, { id: found.id });
    } else {
      log23.debug("resolved emoji", { id: found.id, name: resolved });
    }
    return {
      kind: "emoji",
      id: found.id,
      name: resolved ?? "emoji",
      isAnimated: record2?.animated ?? found.isAnimated
    };
  }

  // src/plugins/emote-cloner/picker.tsx
  var log24 = logger("emote-cloner");
  function iconUrl(g2) {
    const ext = g2.icon && g2.icon.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/icons/${g2.id}/${g2.icon}.${ext}?size=64`;
  }
  var host3 = null;
  var unmount3 = null;
  var keyHandler2 = null;
  function closeGuildPicker() {
    if (keyHandler2) {
      document.removeEventListener("keydown", keyHandler2);
      keyHandler2 = null;
    }
    if (unmount3) {
      try {
        unmount3();
      } catch {
      }
      unmount3 = null;
    }
    if (host3) {
      host3.remove();
      host3 = null;
    }
  }
  function openGuildPicker(opts) {
    injectStyles();
    closeGuildPicker();
    host3 = document.createElement("div");
    host3.className = "halcyon";
    document.body.appendChild(host3);
    keyHandler2 = (event) => {
      if (event.key === "Escape") closeGuildPicker();
    };
    document.addEventListener("keydown", keyHandler2);
    try {
      unmount3 = mountDetached(
        React.createElement(PickerModal, {
          title: opts.title,
          guilds: opts.guilds,
          onPick: opts.onPick,
          onClose: closeGuildPicker
        }),
        host3
      );
    } catch (err) {
      log24.error("could not open guild picker", err);
      closeGuildPicker();
    }
  }
  function PickerModal({
    title,
    guilds,
    onPick,
    onClose
  }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState({ state: "idle" });
    const q = query.trim().toLowerCase();
    const filtered = q ? guilds.filter((g2) => g2.name.toLowerCase().includes(q)) : guilds;
    const pick = (g2) => {
      setStatus({ state: "working", guild: g2.name });
      Promise.resolve().then(() => onPick(g2.id)).then(() => {
        setStatus({ state: "done", guild: g2.name });
        setTimeout(onClose, 1e3);
      }).catch((err) => {
        log24.error("clone failed", err);
        setStatus({ state: "error", guild: g2.name, message: err?.message ?? String(err) });
      });
    };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "hc-overlay",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        onMouseDown: (e) => {
          if (e.target === e.currentTarget && status.state !== "working") onClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker" }, /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__head" }, /* @__PURE__ */ React.createElement("span", { className: "hc-emote-picker__title" }, title), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "hc-emote-picker__close",
          onClick: onClose,
          "aria-label": "\u5173\u95ED",
          disabled: status.state === "working"
        },
        "\u2715"
      )), status.state === "idle" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__search" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "hc-input",
          placeholder: "\u641C\u7D22\u670D\u52A1\u5668\u2026",
          value: query,
          autoFocus: true,
          onChange: (e) => setQuery(e.currentTarget.value)
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__list" }, filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__empty" }, guilds.length === 0 ? "\u6CA1\u6709\u53EF\u7BA1\u7406\u8868\u60C5\u7684\u670D\u52A1\u5668" : "\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668") : filtered.map((g2) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: g2.id,
          className: "hc-emote-picker__item",
          role: "button",
          tabIndex: 0,
          onClick: () => pick(g2),
          onKeyDown: (e) => {
            if (e.key === "Enter") pick(g2);
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__icon" }, g2.icon ? /* @__PURE__ */ React.createElement("img", { src: iconUrl(g2), alt: "" }) : g2.name.charAt(0).toUpperCase()),
        /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__name" }, g2.name)
      )))) : /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__status", "data-state": status.state }, /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__status-icon" }, status.state === "working" ? "\u23F3" : status.state === "done" ? "\u2713" : "\u2715"), /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__status-title" }, status.state === "working" ? `\u6B63\u5728\u590D\u5236\u5230 ${status.guild}\u2026` : status.state === "done" ? `\u5DF2\u590D\u5236\u5230 ${status.guild}` : "\u590D\u5236\u5931\u8D25"), status.state === "error" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hc-emote-picker__status-detail" }, status.message), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "hc-btn hc-btn--secondary hc-btn--sm",
          onClick: () => setStatus({ state: "idle" })
        },
        "\u8FD4\u56DE\u5217\u8868"
      ))))
    );
  }

  // src/plugins/emote-cloner/index.tsx
  var log25 = logger("emote-cloner");
  var PERM2 = {
    CREATE_GUILD_EXPRESSIONS: 1n << 43n,
    MANAGE_GUILD_EXPRESSIONS: 1n << 40n,
    MANAGE_EMOJIS_AND_STICKERS: 1n << 30n
  };
  function canManageExpressions(guild) {
    try {
      return Boolean(
        PermissionStore.can?.(PERM2.CREATE_GUILD_EXPRESSIONS, guild) || PermissionStore.can?.(PERM2.MANAGE_GUILD_EXPRESSIONS, guild) || PermissionStore.can?.(PERM2.MANAGE_EMOJIS_AND_STICKERS, guild)
      );
    } catch {
      return false;
    }
  }
  function eligibleGuilds() {
    try {
      const map = GuildStore.getGuilds?.() ?? {};
      return Object.values(map).filter((g2) => canManageExpressions(g2)).map((g2) => ({
        id: String(g2?.id ?? ""),
        name: String(g2?.name ?? g2?.id ?? "\u672A\u77E5\u670D\u52A1\u5668"),
        icon: g2?.icon ? String(g2.icon) : null
      })).filter((g2) => g2.id).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    } catch {
      return [];
    }
  }
  function pickServerAndClone(hit) {
    const isEmoji = hit.kind === "emoji";
    openGuildPicker({
      title: isEmoji ? "\u590D\u5236\u8868\u60C5\u5230\u670D\u52A1\u5668" : "\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668",
      guilds: eligibleGuilds(),
      onPick: (guildId) => isEmoji ? cloneEmoji(guildId, hit) : cloneSticker(guildId, hit)
    });
  }
  function cloneMenuPatch(children) {
    const hit = resolveExpression(getContextMenuTarget());
    if (!hit) return;
    const MenuItem = getMenuItemComponent();
    if (!MenuItem) {
      log25.warn("MenuItem component not learned yet; skipping clone item this open");
      return;
    }
    const label = hit.kind === "emoji" ? `\u590D\u5236\u8868\u60C5 :${hit.name}: \u5230\u670D\u52A1\u5668` : hit.name ? `\u590D\u5236\u8D34\u7EB8 ${hit.name} \u5230\u670D\u52A1\u5668` : "\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668";
    children.push(
      React.createElement(MenuItem, {
        id: hit.kind === "emoji" ? "halcyon-clone-emoji" : "halcyon-clone-sticker",
        label,
        action: () => pickServerAndClone(hit)
      })
    );
  }
  var unpatchers2 = [];
  var emote_cloner_default = definePlugin({
    id: "emote-cloner",
    name: "\u8868\u60C5\u514B\u9686",
    description: "\u53F3\u952E\u4EFB\u610F\u81EA\u5B9A\u4E49\u8868\u60C5\u6216\u8D34\u7EB8\uFF0C\u5373\u53EF\u628A\u5B83\u590D\u5236\u5230\u4F60\u6709\u7BA1\u7406\u6743\u9650\u7684\u670D\u52A1\u5668\uFF08\u4FDD\u7559\u539F\u540D\uFF09\u3002\u652F\u6301\u6D88\u606F\u91CC\u7684\u8868\u60C5 / \u8868\u60C5\u56DE\u5E94 / \u8D34\u7EB8\uFF0C\u4EE5\u53CA\u8868\u60C5\u9009\u62E9\u5668\u91CC\u7684\u9879\u76EE\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "utility",
    start() {
      unpatchers2.push(addContextMenuPatch(["message", "expression-picker"], cloneMenuPatch));
      log25.info("emote-cloner ready \u2014 right-click an emoji or sticker");
    },
    stop() {
      for (const un of unpatchers2) {
        try {
          un();
        } catch {
        }
      }
      unpatchers2 = [];
    }
  });

  // src/core/flux/index.ts
  var log26 = logger("flux");
  var listenersByType = /* @__PURE__ */ new Map();
  var dispatcherHandlers = /* @__PURE__ */ new Map();
  function dispatcher() {
    const d = getDispatcher();
    if (!d) log26.error("dispatcher unavailable; flux subscriptions are inert");
    return d;
  }
  function ensureBridge(type) {
    if (dispatcherHandlers.has(type)) return;
    const handler = (action) => {
      const set = listenersByType.get(type);
      if (!set) return;
      for (const listener of set) {
        try {
          listener(action);
        } catch (err) {
          log26.error(`listener for ${type} threw`, err);
        }
      }
    };
    const d = dispatcher();
    try {
      d?.subscribe(type, handler);
      dispatcherHandlers.set(type, handler);
    } catch (err) {
      log26.error(`could not subscribe to ${type}`, err);
    }
  }
  function teardownBridge(type) {
    const set = listenersByType.get(type);
    if (set && set.size) return;
    const handler = dispatcherHandlers.get(type);
    if (!handler) return;
    try {
      dispatcher()?.unsubscribe(type, handler);
    } catch (err) {
      log26.error(`could not unsubscribe from ${type}`, err);
    }
    dispatcherHandlers.delete(type);
    listenersByType.delete(type);
  }
  var flux = {
    /**
     * Listen for a dispatched action by type. Returns an unsubscribe function.
     * The callback runs synchronously on dispatch; keep it fast and side-effect free.
     */
    subscribe(type, listener) {
      let set = listenersByType.get(type);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        listenersByType.set(type, set);
      }
      set.add(listener);
      ensureBridge(type);
      let live = true;
      return () => {
        if (!live) return;
        live = false;
        set.delete(listener);
        teardownBridge(type);
      };
    },
    /** Dispatch an action. Use sparingly; most plugins only ever listen. */
    dispatch(action) {
      try {
        dispatcher()?.dispatch(action);
      } catch (err) {
        log26.error("dispatch failed", action?.type, err);
      }
    }
  };

  // src/plugins/mark-all-read/mark.ts
  var log27 = logger("mark-all-read");
  var shapeLogged = false;
  function channelIdOf(entry) {
    return entry?.channel?.id ?? entry?.id;
  }
  function collectUnread() {
    const channels = [];
    const guildsWithUnread = /* @__PURE__ */ new Set();
    const guilds = GuildStore.getGuilds?.() ?? {};
    for (const guildId of Object.keys(guilds)) {
      let grouped;
      try {
        grouped = GuildChannelStore.getChannels?.(guildId);
      } catch (err) {
        log27.warn(`could not read channels for guild ${guildId}`, err);
        continue;
      }
      if (!grouped) continue;
      const ackIfUnread = (id) => {
        if (!id) return false;
        try {
          if (!ReadStateStore.hasUnread?.(id)) return false;
        } catch {
          return false;
        }
        channels.push({
          channelId: id,
          messageId: ReadStateStore.lastMessageId?.(id) ?? null,
          readStateType: 0
        });
        return true;
      };
      if (!shapeLogged) {
        shapeLogged = true;
        try {
          const desc = Object.keys(grouped).map((k) => {
            const v = grouped[k];
            if (Array.isArray(v)) return `${k}:array(${v.length})`;
            return `${k}:${typeof v}`;
          }).join(", ");
          log27.info(`getChannels shape for guild ${guildId} \u2014 { ${desc} }`);
          for (const k of Object.keys(grouped)) {
            const v = grouped[k];
            if (Array.isArray(v) && v.length > 0) {
              log27.info(`  first "${k}" entry keys=[${Object.keys(v[0]).join(",")}]`);
              break;
            }
          }
        } catch (err) {
          log27.warn("could not describe getChannels shape", err);
        }
      }
      const buckets = [grouped.SELECTABLE, grouped.VOCAL].filter(Array.isArray);
      for (const bucket of buckets) {
        for (const entry of bucket) {
          if (ackIfUnread(channelIdOf(entry))) guildsWithUnread.add(guildId);
        }
      }
      try {
        const threadGroups = ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild?.(guildId);
        if (threadGroups && typeof threadGroups === "object") {
          for (const group of Object.values(threadGroups)) {
            if (!group || typeof group !== "object") continue;
            for (const thread of Object.values(group)) {
              if (ackIfUnread(thread?.channel?.id ?? thread?.id)) guildsWithUnread.add(guildId);
            }
          }
        }
      } catch (err) {
        log27.warn(`could not read joined threads for guild ${guildId}`, err);
      }
    }
    return { channels, guilds: guildsWithUnread.size };
  }
  function diagnoseStores() {
    const probe2 = (label, method) => `${label}=${typeof method === "function" ? "ok" : "MISSING"}`;
    log27.info(
      "store check \u2014 " + [
        probe2("GuildStore.getGuilds", GuildStore.getGuilds),
        probe2("GuildChannelStore.getChannels", GuildChannelStore.getChannels),
        probe2("ReadStateStore.hasUnread", ReadStateStore.hasUnread),
        probe2("ReadStateStore.lastMessageId", ReadStateStore.lastMessageId),
        probe2(
          "ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild",
          ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild
        )
      ].join(", ")
    );
  }
  function markAllRead() {
    diagnoseStores();
    const guildCount = Object.keys(GuildStore.getGuilds?.() ?? {}).length;
    const { channels, guilds } = collectUnread();
    log27.info(`scanned ${guildCount} guild(s); found ${channels.length} unread channel(s)`);
    if (channels.length === 0) {
      log27.info("nothing unread; skipping BULK_ACK");
      return { channels: 0, guilds: 0 };
    }
    flux.dispatch({
      type: "BULK_ACK",
      context: "APP",
      channels
    });
    log27.info(`BULK_ACK dispatched for ${channels.length} channel(s) across ${guilds} guild(s)`);
    return { channels: channels.length, guilds };
  }

  // src/plugins/mark-all-read/ui/MarkAllReadPage.tsx
  var log28 = logger("mark-all-read");
  function MarkAllReadPage() {
    const [busy, setBusy] = useState(false);
    const [state, setState] = useState("\u5F85\u673A");
    const [detail, setDetail] = useState("\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\uFF0C\u628A\u6240\u6709\u670D\u52A1\u5668\u91CC\u7684\u672A\u8BFB\u4E00\u6B21\u6027\u6E05\u7A7A\u3002");
    const onMark = () => {
      if (busy) return;
      setBusy(true);
      setState("\u5904\u7406\u4E2D");
      setDetail("\u6B63\u5728\u6536\u96C6\u672A\u8BFB\u9891\u9053\u2026");
      try {
        const result = markAllRead();
        if (result.channels === 0) {
          setState("\u5DF2\u662F\u6700\u65B0");
          setDetail("\u6CA1\u6709\u627E\u5230\u4EFB\u4F55\u672A\u8BFB\uFF0C\u65E0\u9700\u64CD\u4F5C\u3002");
          showToast("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F", "info");
        } else {
          setState("\u5B8C\u6210");
          setDetail(`\u5DF2\u6E05\u7A7A ${result.guilds} \u4E2A\u670D\u52A1\u5668\u4E2D\u7684 ${result.channels} \u4E2A\u9891\u9053\u3002`);
          showToast(`\u5DF2\u6807\u8BB0 ${result.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`, "success");
        }
      } catch (err) {
        setState("\u5931\u8D25");
        setDetail(err?.message ?? String(err));
        showToast("\u6807\u8BB0\u5931\u8D25", "failure");
        log28.error("mark all read failed", err);
      } finally {
        setBusy(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stack" }, /* @__PURE__ */ React.createElement("div", { className: "hc-inline-note" }, /* @__PURE__ */ React.createElement(InfoIcon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "\u4E00\u6B21\u6027\u628A", /* @__PURE__ */ React.createElement("strong", null, "\u6240\u6709\u670D\u52A1\u5668"), "\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u4EFB\u4F55\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002")), /* @__PURE__ */ React.createElement(Section, { title: "\u64CD\u4F5C" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cell" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: /* @__PURE__ */ React.createElement(MessageCheckIcon, { size: 16 }), disabled: busy, onClick: onMark }, "\u5168\u90E8\u6807\u4E3A\u5DF2\u8BFB"))), /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status-state" }, state), detail && /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__status-detail" }, detail)));
  }

  // src/plugins/mark-all-read/index.tsx
  var log29 = logger("mark-all-read");
  function runMark() {
    try {
      const result = markAllRead();
      if (result.channels === 0) {
        showToast("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F", "info");
      } else {
        showToast(`\u5DF2\u6807\u8BB0 ${result.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`, "success");
      }
    } catch (err) {
      showToast("\u6807\u8BB0\u5931\u8D25", "failure");
      log29.error("mark all read failed", err);
    }
  }
  function RailButton() {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-rail-item" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-rail-btn",
        "aria-label": "\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",
        title: "\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",
        onClick: runMark
      },
      /* @__PURE__ */ React.createElement(MessageCheckIcon, { size: 24 })
    ));
  }
  function QuestRailButton() {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-rail-item" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "hc-rail-btn hc-quest-btn",
        "aria-label": "\u4EFB\u52A1\u4E2D\u5FC3",
        title: "\u4EFB\u52A1\u4E2D\u5FC3",
        onClick: () => {
          history.pushState(null, "", "/quest-home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      },
      /* @__PURE__ */ React.createElement(QuestIcon, { size: 24 })
    ));
  }
  var GUILD_MENUS = ["guild-context", "guild-header-popout"];
  var patchGuildMenu = (children) => {
    const MenuItem = getMenuItemComponent();
    if (!MenuItem) return;
    const already = children.some((c) => c?.props?.id === "hc-mark-all-read");
    if (already) return;
    children.push(
      React.createElement(MenuItem, {
        id: "hc-mark-all-read",
        label: "\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",
        action: runMark
      })
    );
  };
  var mark_all_read_default = definePlugin({
    id: "mark-all-read",
    name: "\u4E00\u952E\u5DF2\u8BFB",
    description: "\u5728\u670D\u52A1\u5668\u5217\u8868\u7684\u597D\u53CB\u6309\u94AE\u4E0B\u65B9\u52A0\u4E00\u4E2A\u6309\u94AE\uFF0C\u4E00\u952E\u628A\u6240\u6709\u670D\u52A1\u5668\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u4E5F\u53EF\u53F3\u952E\u4EFB\u610F\u670D\u52A1\u5668\uFF0C\u6216\u5728\u672C\u9875\u70B9\u51FB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002",
    authors: [{ name: "caitemm" }, { name: "Vencord" }],
    category: "utility",
    dependencies: ["context-menu-api"],
    // Same target and transform Vencord's ServerListAPI uses for
    // ServerListRenderPosition.Above, but anchored on the plain runtime string
    // `tutorialId:"friends-list"` instead of Vencord's build-time intl-hash macro
    // (which we can't reproduce). It wraps the friends-button element the guild
    // nav returns into an array and concatenates our button, letting Discord's own
    // SVG layout give it a real slot right after friends.
    patches: [
      {
        label: "read-all-rail-button",
        find: 'tutorialId:"friends-list"',
        replacement: {
          match: /return(\(.{0,200}?tutorialId:"friends-list".+?\}\))(?=\}function)/,
          replace: "return[$1].concat($self.renderRailButton())"
        }
      }
    ],
    /** Called from the patched guild-nav render (via `$self`). Returns the button
     *  as a keyed single-element array so it slots in right after friends. */
    renderRailButton() {
      return [
        React.createElement(RailButton, { key: "hc-mark-all-read-rail" }),
        React.createElement(QuestRailButton, { key: "hc-quest-indicator-rail" })
      ];
    },
    page: {
      title: "\u4E00\u952E\u5DF2\u8BFB",
      icon: MessageCheckIcon,
      component: MarkAllReadPage
    },
    start() {
      injectStyles();
      addContextMenuPatch(GUILD_MENUS, patchGuildMenu);
      log29.info("mark-all-read ready");
    },
    stop() {
      removeContextMenuPatch(GUILD_MENUS, patchGuildMenu);
    }
  });

  // src/plugins/silent-typing/index.ts
  var log30 = logger("silent-typing");
  var settings7 = defineSettings({
    scope: {
      group: "\u8303\u56F4",
      type: "select",
      default: "all",
      label: "\u5728\u54EA\u91CC\u9759\u9ED8",
      description: "\u53EA\u5728\u90E8\u5206\u573A\u666F\u9690\u85CF\u8F93\u5165\u72B6\u6001\u65F6\uFF0C\u5176\u4F59\u573A\u666F\u4ECD\u6309 Discord \u9ED8\u8BA4\u884C\u4E3A\u53D1\u9001\u3002",
      options: [
        { value: "all", label: "\u6240\u6709\u9891\u9053\u4E0E\u79C1\u804A" },
        { value: "guilds", label: "\u53EA\u5728\u670D\u52A1\u5668\u9891\u9053" },
        { value: "dms", label: "\u53EA\u5728\u79C1\u804A / \u7FA4\u804A" }
      ]
    },
    allowChannels: {
      group: "\u4F8B\u5916",
      type: "string-list",
      default: [],
      label: "\u4F8B\u5916\u9891\u9053 ID",
      description: "\u8FD9\u4E9B\u9891\u9053 / \u79C1\u804A\u91CC\u7167\u5E38\u53D1\u9001\u8F93\u5165\u72B6\u6001\u3002\u53F3\u952E\u9891\u9053 \u2192 \u590D\u5236\u9891\u9053 ID\uFF08\u9700\u5148\u5F00\u542F\u5F00\u53D1\u8005\u6A21\u5F0F\uFF09\u3002",
      itemPlaceholder: "\u9891\u9053 ID\uFF08\u7EAF\u6570\u5B57\uFF09"
    },
    silenceStop: {
      group: "\u9AD8\u7EA7",
      type: "boolean",
      default: false,
      label: "\u540C\u65F6\u62E6\u622A\u201C\u505C\u6B62\u8F93\u5165\u201D",
      description: "\u9ED8\u8BA4\u5173\u95ED\u3002stopTyping \u662F\u7528\u6765\u6E05\u9664\u5DF2\u7ECF\u53D1\u51FA\u53BB\u7684\u8F93\u5165\u72B6\u6001\u7684\uFF0C\u62E6\u622A\u5B83\u53CD\u800C\u53EF\u80FD\u8BA9\u6B8B\u7559\u72B6\u6001\u591A\u6302\u51E0\u79D2\uFF0C\u53EA\u6709\u5728\u4F60\u786E\u8BA4\u4ECE\u4E0D\u53D1\u9001\u65F6\u624D\u9700\u8981\u5F00\u542F\u3002"
    }
  });
  var active = false;
  var typingModule;
  var unpatchStart;
  var unpatchStop;
  var suppressed = 0;
  function isPrivateChannel(channelId) {
    try {
      const channel = ChannelStore.getChannel?.(channelId);
      if (!channel) return false;
      if (typeof channel.isPrivate === "function") return Boolean(channel.isPrivate());
      if (channel.guild_id) return false;
      return channel.type === 1 || channel.type === 3;
    } catch {
      return false;
    }
  }
  function silenceFor(channelId) {
    if (!active) return false;
    const id = channelId == null ? "" : String(channelId);
    const s = settings7.store;
    if (id && s.allowChannels.includes(id)) return false;
    if (s.scope === "guilds") return !isPrivateChannel(id);
    if (s.scope === "dms") return isPrivateChannel(id);
    return true;
  }
  function onStartTyping(ctx) {
    try {
      if (silenceFor(ctx.args[0])) {
        suppressed++;
        return void 0;
      }
    } catch (err) {
      log30.error("\u5224\u65AD\u662F\u5426\u9759\u9ED8\u65F6\u51FA\u9519\uFF0C\u672C\u6B21\u6309 Discord \u9ED8\u8BA4\u884C\u4E3A\u5904\u7406", err);
    }
    return ctx.callOriginal();
  }
  function onStopTyping(ctx) {
    try {
      if (settings7.store.silenceStop && silenceFor(ctx.args[0])) return void 0;
    } catch {
    }
    return ctx.callOriginal();
  }
  function clearCurrentTyping() {
    try {
      const channelId = SelectedChannelStore.getChannelId?.();
      if (channelId && typeof typingModule?.stopTyping === "function") {
        typingModule.stopTyping(channelId);
      }
    } catch {
    }
  }
  function reportPatch() {
    const mine = getSourcePatchReport().filter((p) => p.pluginId === "silent-typing");
    if (mine.length === 0) return;
    if (mine.every((p) => p.applied)) {
      log30.info("\u6E90\u7801 patch \u5DF2\u751F\u6548\uFF08\u8F93\u5165\u72B6\u6001\u5728\u6E90\u5934\u5C31\u88AB\u62E6\u6389\uFF09");
    } else {
      log30.warn(
        "\u6E90\u7801 patch \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\uFF0C\u5DF2\u6539\u7528\u8FD0\u884C\u65F6 hook \u515C\u5E95\u3002\u82E5\u53D1\u73B0\u522B\u4EBA\u4ECD\u80FD\u770B\u5230\u4F60\u7684\u8F93\u5165\u72B6\u6001\uFF0C\u8BF7\u53CD\u9988\u8FD9\u6761\u65E5\u5FD7\u3002"
      );
    }
  }
  var silent_typing_default = definePlugin({
    id: "silent-typing",
    name: "\u9759\u9ED8\u8F93\u5165",
    description: "\u4E0D\u518D\u5411\u522B\u4EBA\u53D1\u9001\u201C\u6B63\u5728\u8F93\u5165\u2026\u201D\u72B6\u6001\u3002\u53EF\u4EE5\u53EA\u5728\u670D\u52A1\u5668\u6216\u53EA\u5728\u79C1\u804A\u751F\u6548\uFF0C\u4E5F\u80FD\u4E3A\u6307\u5B9A\u9891\u9053\u5F00\u4F8B\u5916\u3002\u522B\u4EBA\u7684\u8F93\u5165\u72B6\u6001\u7167\u5E38\u663E\u793A\uFF0C\u5173\u95ED\u63D2\u4EF6\u7ACB\u5373\u6062\u590D\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "privacy",
    settings: settings7,
    patches: [
      {
        // The module that owns Discord's typing actions, identified by the local
        // action it dispatches. The replacement is a pure insertion at the top of
        // `startTyping`'s body: the whole match is a zero-width lookbehind, so no
        // existing character is consumed or moved and the code cannot become
        // unbalanced. The `:function` / `async` alternatives cover the shapes
        // Discord's minifier emits for the same method across builds.
        label: "startTyping guard",
        find: '"TYPING_START_LOCAL"',
        replacement: {
          match: /(?<=\bstartTyping\s*(?:[:=]\s*)?(?:async\s+)?(?:function\s*)?\(\s*(\w+)\s*\)\s*(?:=>\s*)?\{)/,
          replace: "if($self.shouldSilence($1))return;"
        }
      }
    ],
    start() {
      suppressed = 0;
      active = true;
      typingModule = findByProps("startTyping", "stopTyping");
      if (!typingModule || typeof typingModule.startTyping !== "function") {
        log30.warn(
          "\u672A\u627E\u5230 Discord \u7684\u8F93\u5165\u72B6\u6001\u6A21\u5757\uFF08startTyping / stopTyping\uFF09\uFF0C\u8FD0\u884C\u65F6\u515C\u5E95\u4E0D\u53EF\u7528\uFF1B\u4ECD\u4F9D\u8D56\u6E90\u7801 patch\u3002\u6253\u5F00\u4EFB\u610F\u9891\u9053\u540E\u91CD\u65B0\u542F\u7528\u63D2\u4EF6\u53EF\u518D\u8BD5\u4E00\u6B21\u3002"
        );
      } else {
        active = false;
        clearCurrentTyping();
        active = true;
        try {
          unpatchStart = patcher.instead(typingModule, "startTyping", onStartTyping);
        } catch (err) {
          log30.warn("\u6302\u63A5 startTyping \u5931\u8D25\uFF0C\u4EC5\u4F9D\u8D56\u6E90\u7801 patch", err);
        }
        if (typeof typingModule.stopTyping === "function") {
          try {
            unpatchStop = patcher.instead(typingModule, "stopTyping", onStopTyping);
          } catch (err) {
            log30.warn("\u6302\u63A5 stopTyping \u5931\u8D25\uFF0C\u201C\u540C\u65F6\u62E6\u622A\u505C\u6B62\u8F93\u5165\u201D\u5F00\u5173\u5C06\u65E0\u6548", err);
          }
        }
      }
      log30.info(`\u5DF2\u62E6\u622A\u8F93\u5165\u72B6\u6001\u4E0A\u62A5\uFF08\u8303\u56F4\uFF1A${settings7.store.scope}\uFF09`);
      setTimeout(reportPatch, 4e3);
    },
    stop() {
      active = false;
      unpatchStart?.();
      unpatchStop?.();
      unpatchStart = void 0;
      unpatchStop = void 0;
      typingModule = void 0;
      log30.info(`\u5DF2\u6062\u590D\u8F93\u5165\u72B6\u6001\u4E0A\u62A5\uFF08\u672C\u6B21\u5171\u62E6\u622A ${suppressed} \u6B21\uFF09`);
    },
    /**
     * Called from the source patch at the top of `startTyping`. Returns true to
     * abort the call. Guarded end to end: a throw here would break the compose
     * box, and the patch stays in the module until the client restarts, so this
     * must keep answering sanely even while the plugin is switched off.
     */
    shouldSilence(channelId) {
      try {
        if (!active) return false;
        if (silenceFor(channelId)) {
          suppressed++;
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
    probe() {
      const module = typingModule ?? findByProps("startTyping", "stopTyping");
      return {
        active,
        suppressed,
        scope: settings7.store.scope,
        typingModuleFound: module != null,
        startTypingIsFunction: typeof module?.startTyping === "function",
        /** True once our wrapper is installed on the module. */
        runtimeHookInstalled: unpatchStart != null,
        sourcePatches: getSourcePatchReport().filter((p) => p.pluginId === "silent-typing"),
        currentChannelWouldBeSilenced: (() => {
          try {
            return silenceFor(SelectedChannelStore.getChannelId?.());
          } catch {
            return null;
          }
        })()
      };
    }
  });

  // src/core/dom-probe.ts
  function describe(el) {
    let box = "n/a";
    try {
      const r = el.getBoundingClientRect();
      box = `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top)}`;
    } catch {
    }
    return {
      tag: el.tagName.toLowerCase(),
      classes: typeof el.className === "string" ? el.className : String(el.className ?? ""),
      childCount: el.children.length,
      box
    };
  }
  function probeSelector(selector, limit = 3) {
    try {
      const found = document.querySelectorAll(selector);
      const samples = [];
      for (let i = 0; i < found.length && i < limit; i++) samples.push(describe(found[i]));
      return { selector, count: found.length, samples };
    } catch {
      return { selector, count: -1, samples: [] };
    }
  }
  function probeSelectors(selectors, limit = 2) {
    return selectors.map((s) => probeSelector(s, limit));
  }
  function classNamesContaining(needle, limit = 24) {
    const out = /* @__PURE__ */ new Set();
    try {
      const nodes = document.querySelectorAll(`[class*="${needle}"]`);
      for (let i = 0; i < nodes.length && out.size < limit; i++) {
        const raw = nodes[i].className;
        if (typeof raw !== "string") continue;
        for (const name of raw.split(/\s+/)) {
          if (name.includes(needle)) out.add(name);
          if (out.size >= limit) break;
        }
      }
    } catch {
    }
    return [...out];
  }

  // src/plugins/member-count/settings.ts
  var settings8 = defineSettings({
    placement: {
      group: "\u4F4D\u7F6E",
      type: "select",
      default: "header",
      label: "\u663E\u793A\u4F4D\u7F6E",
      description: "\u9891\u9053\u9876\u680F\u662F\u6A2A\u5411\u5DE5\u5177\u6761\uFF0C\u63D2\u4E00\u4E2A\u5C0F\u6807\u7B7E\u6700\u7A33\uFF0C\u4E5F\u662F Discord \u6CA1\u63D0\u4F9B\u6570\u5B57\u7684\u4F4D\u7F6E\uFF1B\u6210\u5458\u5217\u8868\u9876\u90E8 Discord \u81EA\u5DF1\u5DF2\u7ECF\u663E\u793A\u4E86\u300C\u5728\u7EBF X \xB7 \u5171 Y\u300D\uFF0C\u672C\u63D2\u4EF6\u5728\u90A3\u91CC\u663E\u793A\u53EA\u662F\u8986\u76D6\u540C\u4E00\u4EFD\u4FE1\u606F\uFF0C\u9009\u5B83\u524D\u8BF7\u77E5\u6089\u3002",
      options: [
        { value: "header", label: "\u9891\u9053\u9876\u680F" },
        { value: "member-list", label: "\u6210\u5458\u5217\u8868\u9876\u90E8" },
        { value: "both", label: "\u4E24\u5904\u90FD\u663E\u793A" }
      ]
    },
    showOnline: {
      group: "\u5185\u5BB9",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u5728\u7EBF\u4EBA\u6570",
      description: "\u5728\u7EBF\u4EBA\u6570\u6765\u81EA\u6210\u5458\u5217\u8868\u7684\u5206\u7EC4\u7EDF\u8BA1\uFF0C\u53EA\u6709\u6210\u5458\u5217\u8868\u6253\u5F00\u8FC7\u624D\u6709\u6570\u636E\uFF1B\u62FF\u4E0D\u5230\u65F6\u81EA\u52A8\u9690\u85CF\u3002"
    },
    showTotal: {
      group: "\u5185\u5BB9",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u603B\u6210\u5458\u6570",
      description: "\u670D\u52A1\u5668\u7684\u603B\u6210\u5458\u6570\uFF08\u542B\u79BB\u7EBF\uFF09\u3002"
    },
    abbreviate: {
      group: "\u5185\u5BB9",
      type: "boolean",
      default: false,
      label: "\u7F29\u5199\u5927\u6570\u5B57",
      description: "12,345 \u663E\u793A\u4E3A 12.3k\u3002\u5173\u95ED\u5219\u663E\u793A\u5E26\u5343\u4F4D\u5206\u9694\u7684\u5B8C\u6574\u6570\u5B57\u3002"
    },
    showLabels: {
      group: "\u5185\u5BB9",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u6587\u5B57\u6807\u7B7E",
      description: "\u663E\u793A\u201C\u5728\u7EBF / \u5171\u201D\u8FD9\u6837\u7684\u524D\u7F00\u3002\u5173\u95ED\u540E\u53EA\u5269\u6570\u5B57\u4E0E\u5706\u70B9\uFF0C\u66F4\u7D27\u51D1\u3002"
    },
    preloadCounts: {
      group: "\u9AD8\u7EA7",
      type: "boolean",
      default: true,
      label: "\u7F3A\u6570\u636E\u65F6\u8BF7\u6C42\u52A0\u8F7D",
      description: "\u5728\u7EBF\u4EBA\u6570\u4F9D\u8D56\u670D\u52A1\u5668\u7684\u6210\u5458\u5217\u8868\u6570\u636E\uFF1B\u5982\u679C\u8FD9\u6B21\u542F\u52A8\u540E\u4ECE\u6CA1\u5C55\u5F00\u8FC7\u6210\u5458\u5217\u8868\uFF0CDiscord \u6839\u672C\u6CA1\u62C9\u8FC7\u8FD9\u4EFD\u6570\u636E\u3002\u5F00\u542F\u540E\uFF0C\u9047\u5230\u7F3A\u6570\u5B57\u7684\u670D\u52A1\u5668\u4F1A\u8C03\u7528 Discord \u81EA\u5DF1\u7684\u9891\u9053\u9884\u52A0\u8F7D\uFF08\u548C\u4F60\u70B9\u8FDB\u670D\u52A1\u5668\u65F6\u4E00\u6837\u7684\u52A8\u4F5C\uFF09\uFF0C\u6BCF\u4E2A\u670D\u52A1\u5668\u6BCF\u6B21\u542F\u52A8\u53EA\u505A\u4E00\u6B21\u3002\u5173\u95ED\u5219\u53EA\u663E\u793A\u5DF2\u6709\u7684\u6570\u5B57\u3002"
    }
  });

  // src/plugins/member-count/counts.ts
  var log31 = logger("member-count");
  function memo(resolve) {
    let cached2;
    return () => cached2 ??= resolve();
  }
  var memberCountStore = memo(
    () => findStoreByName("GuildMemberCountStore") ?? findStoreWithMethods("getMemberCount")
  );
  var channelMemberStore = memo(() => findStoreByName("ChannelMemberStore"));
  var channelActions = memo(
    () => find((m) => typeof m?.preload === "function" && typeof m?.preloadAllGuilds === "function") ?? find(
      (m) => typeof m?.preload === "function" && // Reject Discord's answer-everything intl proxy.
      typeof m?.__halcyon_probe__ === "undefined"
    )
  );
  var EMPTY_COUNTS = { total: null, online: null };
  function asCount(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  }
  function guildIdOfChannel2(channelId) {
    if (!channelId) return null;
    try {
      const channel = ChannelStore.getChannel?.(channelId);
      const guildId = channel?.guild_id ?? channel?.getGuildId?.();
      return guildId ? String(guildId) : null;
    } catch {
      return null;
    }
  }
  var onlineByGuild = /* @__PURE__ */ new Map();
  var totalByGuild = /* @__PURE__ */ new Map();
  var unsubscribes = [];
  function sumGroups(groups) {
    if (!Array.isArray(groups) || groups.length === 0) return null;
    if (groups.length === 1 && groups[0]?.id === "unknown") return null;
    let sum = 0;
    let sawAny = false;
    for (const group of groups) {
      if (group?.id === "offline") continue;
      const count2 = asCount(group?.count);
      if (count2 == null) continue;
      sum += count2;
      sawAny = true;
    }
    return sawAny ? sum : null;
  }
  function startCountTracking() {
    stopCountTracking();
    const remember2 = (map, guildId, value) => {
      const count2 = asCount(value);
      if (guildId != null && count2 != null) map.set(String(guildId), count2);
    };
    unsubscribes = [
      flux.subscribe("GUILD_MEMBER_LIST_UPDATE", (action) => {
        const a = action;
        const sum = sumGroups(a?.groups);
        if (a?.guildId != null && sum != null) onlineByGuild.set(String(a.guildId), sum);
        remember2(totalByGuild, a?.guildId, a?.memberCount ?? a?.member_count);
      }),
      flux.subscribe("ONLINE_GUILD_MEMBER_COUNT_UPDATE", (action) => {
        remember2(onlineByGuild, action?.guildId, action?.count);
      }),
      flux.subscribe("GUILD_CREATE", (action) => {
        const guild = action?.guild;
        remember2(totalByGuild, guild?.id, guild?.member_count ?? guild?.memberCount);
      }),
      flux.subscribe("GUILD_UPDATE", (action) => {
        const guild = action?.guild;
        remember2(totalByGuild, guild?.id, guild?.member_count ?? guild?.memberCount);
      })
    ];
  }
  function stopCountTracking() {
    for (const off of unsubscribes) {
      try {
        off();
      } catch {
      }
    }
    unsubscribes = [];
    onlineByGuild.clear();
    totalByGuild.clear();
    nudged.clear();
  }
  var nudged = /* @__PURE__ */ new Set();
  function nudge(guildId, channelId) {
    if (!settings8.store.preloadCounts) return;
    if (nudged.has(guildId)) return;
    nudged.add(guildId);
    try {
      const api = channelActions();
      if (typeof api?.preload !== "function") return;
      const target = GuildChannelStore.getDefaultChannel?.(guildId)?.id ?? channelId;
      api.preload(guildId, target);
      log31.debug(`\u5DF2\u8BF7\u6C42\u52A0\u8F7D ${guildId} \u7684\u6210\u5458\u5217\u8868\u6570\u636E`);
    } catch (err) {
      log31.debug("preload \u8C03\u7528\u5931\u8D25\uFF0C\u5FFD\u7565", err);
    }
  }
  function readTotal(guildId) {
    try {
      const fromStore = asCount(memberCountStore()?.getMemberCount?.(guildId));
      if (fromStore != null) return fromStore;
    } catch {
    }
    try {
      const guild = GuildStore.getGuild?.(guildId);
      const fromRecord = asCount(guild?.memberCount) ?? asCount(guild?.approximateMemberCount);
      if (fromRecord != null) return fromRecord;
    } catch {
    }
    return totalByGuild.get(guildId) ?? null;
  }
  function readOnline(guildId, channelId) {
    try {
      const fromStore = sumGroups(channelMemberStore()?.getProps?.(guildId, channelId)?.groups);
      if (fromStore != null) return fromStore;
    } catch {
    }
    return onlineByGuild.get(guildId) ?? null;
  }
  function readCounts(channelId) {
    const guildId = guildIdOfChannel2(channelId);
    if (!guildId || !channelId) return EMPTY_COUNTS;
    const counts = {
      total: readTotal(guildId),
      online: readOnline(guildId, String(channelId))
    };
    if (counts.total == null || counts.online == null) nudge(guildId, String(channelId));
    return counts;
  }
  function countsDiagnostics(channelId) {
    const guildId = guildIdOfChannel2(channelId);
    const safe = (fn) => {
      try {
        return fn();
      } catch (err) {
        return `threw: ${String(err)}`;
      }
    };
    return {
      channelId: channelId ?? null,
      guildId,
      stores: {
        memberCountStore: safe(() => memberCountStore()?.getName?.() ?? null),
        memberCountStoreHasMethod: safe(() => typeof memberCountStore()?.getMemberCount === "function"),
        memberCountRaw: safe(() => guildId ? memberCountStore()?.getMemberCount?.(guildId) : null),
        channelMemberStore: safe(() => channelMemberStore()?.getName?.() ?? null),
        rawGroups: safe(
          () => guildId && channelId ? channelMemberStore()?.getProps?.(guildId, String(channelId))?.groups ?? null : null
        ),
        channelActionsFound: safe(() => typeof channelActions()?.preload === "function")
      },
      guildRecord: safe(() => {
        if (!guildId) return null;
        const guild = GuildStore.getGuild?.(guildId);
        if (!guild) return null;
        return {
          memberCount: guild.memberCount ?? null,
          approximateMemberCount: guild.approximateMemberCount ?? null,
          keys: Object.keys(guild).slice(0, 30)
        };
      }),
      captured: {
        total: guildId ? totalByGuild.get(guildId) ?? null : null,
        online: guildId ? onlineByGuild.get(guildId) ?? null : null,
        trackingActive: unsubscribes.length > 0,
        nudged: [...nudged]
      },
      /** Every store this client registered whose name mentions a count/member. */
      storeNameHints: safe(
        () => storeNames().filter((n) => /member|count|presence|session/i.test(n))
      ),
      resolved: readCounts(channelId)
    };
  }
  function formatCount(value, abbreviate) {
    if (!abbreviate) return value.toLocaleString("en-US");
    if (value < 1e3) return String(value);
    if (value < 1e6) {
      const k = value / 1e3;
      return `${k < 10 ? k.toFixed(1) : Math.round(k)}k`;
    }
    const m = value / 1e6;
    return `${m < 10 ? m.toFixed(1) : Math.round(m)}m`;
  }

  // src/plugins/member-count/ui/MemberCountChip.tsx
  var WATCHED_ACTIONS = [
    "CHANNEL_SELECT",
    "GUILD_MEMBER_LIST_UPDATE",
    "GUILD_UPDATE",
    "GUILD_CREATE",
    "THREAD_MEMBER_LIST_UPDATE"
  ];
  var POLL_MS = 5e3;
  function sameCounts(a, b) {
    return a.total === b.total && a.online === b.online;
  }
  function useMemberCounts() {
    const [counts, setCounts] = useState(EMPTY_COUNTS);
    useEffect(() => {
      let live = true;
      const refresh = () => {
        if (!live) return;
        let next;
        try {
          next = readCounts(SelectedChannelStore.getChannelId?.());
        } catch {
          next = EMPTY_COUNTS;
        }
        setCounts((prev) => sameCounts(prev, next) ? prev : next);
      };
      refresh();
      const unsubscribes3 = WATCHED_ACTIONS.map((type) => flux.subscribe(type, refresh));
      const timer3 = setInterval(refresh, POLL_MS);
      return () => {
        live = false;
        clearInterval(timer3);
        for (const off of unsubscribes3) off();
      };
    }, []);
    return counts;
  }
  function MemberCountChip({ variant }) {
    const { total, online } = useMemberCounts();
    const s = settings8.store;
    const showOnline = s.showOnline && online != null;
    const showTotal = s.showTotal && total != null;
    if (!showOnline && !showTotal) return null;
    const parts = [];
    if (showOnline) parts.push(`\u5728\u7EBF ${online.toLocaleString("en-US")}`);
    if (showTotal) parts.push(`\u603B\u6210\u5458 ${total.toLocaleString("en-US")}`);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `hc-membercount hc-membercount--${variant}`,
        title: parts.join(" \xB7 "),
        "aria-label": parts.join("\uFF0C")
      },
      /* @__PURE__ */ React.createElement(PeopleIcon, { size: 14, className: "hc-membercount__icon" }),
      showOnline && /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__part" }, /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__dot" }), s.showLabels && /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__label" }, "\u5728\u7EBF"), /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__value" }, formatCount(online, s.abbreviate))),
      showOnline && showTotal && /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__sep" }, "\xB7"),
      showTotal && /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__part" }, s.showLabels && /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__label" }, "\u5171"), /* @__PURE__ */ React.createElement("span", { className: "hc-membercount__value" }, formatCount(total, s.abbreviate)))
    );
  }

  // src/plugins/member-count/index.tsx
  var log32 = logger("member-count");
  var ANCHORS = {
    header: [
      'section[class*="title_"] [class*="toolbar_"]',
      'section[class*="title"] [class*="toolbar"]',
      '[class*="upperContainer"] [class*="toolbar"]',
      '[class*="chat_"] [class*="toolbar_"]',
      '[class*="toolbar_"]'
    ],
    // Most-specific first. The two "scroller" entries are what the chip should
    // actually attach to — inside the member list, above the first group header —
    // so the row reads as a natural roster header instead of floating in the
    // aside above everything. The outer `membersWrap` / `aside[class*="members"]`
    // fallbacks are kept in case a build renames the scroller, but they anchor
    // OUTSIDE the scrollable content, which is what produced the "chip floats in
    // empty space above the roster" symptom on the current build.
    list: [
      '[class*="membersWrap"] [class*="members_"]',
      'aside[class*="members"] [class*="members_"]',
      '[class*="members_"]:not([class*="membersWrap"])',
      '[class*="memberList"]',
      '[class*="membersWrap"]',
      'aside[class*="members"]'
    ]
  };
  var ENSURE_MS2 = 1e3;
  var mounted2 = /* @__PURE__ */ new Map();
  var ensureTimer;
  var selfCheckTimer;
  var unsubscribePlacement;
  var lastSelector = /* @__PURE__ */ new Map();
  var warnedNoAnchor = false;
  function firstMatch(selectors) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) return { element: el, selector };
      } catch {
      }
    }
    return null;
  }
  function wantedVariants() {
    const placement = settings8.store.placement;
    const want = /* @__PURE__ */ new Set();
    if (placement === "header" || placement === "both") want.add("header");
    if (placement === "member-list" || placement === "both") want.add("list");
    return want;
  }
  function teardown2(variant) {
    const entry = mounted2.get(variant);
    if (!entry) return;
    mounted2.delete(variant);
    try {
      entry.unmount();
    } catch {
    }
    entry.host.remove();
  }
  function attach2(variant, hit) {
    const host5 = document.createElement("div");
    host5.className = "hc-membercount-host";
    host5.setAttribute("data-hc-plugin", "member-count");
    try {
      hit.element.insertBefore(host5, hit.element.firstChild);
    } catch (err) {
      log32.debug(`\u65E0\u6CD5\u5728 ${variant} \u4F4D\u7F6E\u63D2\u5165\u5BBF\u4E3B\u8282\u70B9`, err);
      return;
    }
    try {
      const unmount5 = mountDetached(React.createElement(MemberCountChip, { variant }), host5);
      mounted2.set(variant, { host: host5, unmount: unmount5, selector: hit.selector });
      if (lastSelector.get(variant) !== hit.selector) {
        lastSelector.set(variant, hit.selector);
        log32.info(`\u5DF2\u6302\u8F7D\u5230 ${variant}\uFF1A${hit.selector}`);
      }
    } catch (err) {
      host5.remove();
      log32.error(`\u6302\u8F7D\u6210\u5458\u6570\u6807\u7B7E\u5931\u8D25\uFF08${variant}\uFF09`, err);
    }
  }
  function ensureMounted2() {
    const want = wantedVariants();
    for (const [variant, entry] of [...mounted2]) {
      if (!want.has(variant) || !document.contains(entry.host)) teardown2(variant);
    }
    let anyAnchor = false;
    for (const variant of want) {
      if (mounted2.has(variant)) {
        anyAnchor = true;
        continue;
      }
      const hit = firstMatch(ANCHORS[variant]);
      if (!hit) continue;
      anyAnchor = true;
      attach2(variant, hit);
    }
    if (!anyAnchor && !warnedNoAnchor && mounted2.size === 0) {
      warnedNoAnchor = true;
      log32.warn(
        "\u627E\u4E0D\u5230\u53EF\u63D2\u5165\u7684\u4F4D\u7F6E\uFF08\u9891\u9053\u9876\u680F / \u6210\u5458\u5217\u8868\uFF09\u3002\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u670D\u52A1\u5668\u9891\u9053\uFF1B\u82E5\u5DF2\u7ECF\u6253\u5F00\u8FD8\u662F\u6CA1\u6709\uFF0C\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u5E76\u628A\u8F93\u51FA\u53D1\u56DE\u6765 \u2014\u2014 \u8BF4\u660E\u8FD9\u4E2A Discord \u7248\u672C\u7684\u5BB9\u5668\u7C7B\u540D\u53D8\u4E86\u3002"
      );
    }
  }
  function currentChannelId() {
    try {
      return SelectedChannelStore.getChannelId?.() ?? null;
    } catch {
      return null;
    }
  }
  function selfCheck() {
    const channelId = currentChannelId();
    if (!guildIdOfChannel2(channelId)) return;
    const { total, online } = readCounts(channelId);
    if (total != null || online != null) return;
    log32.warn(
      "\u5DF2\u6302\u8F7D\u4F46\u62FF\u4E0D\u5230\u6210\u5458\u6570\uFF08\u6240\u6709\u6570\u636E\u6E90\u90FD\u662F\u7A7A\uFF09\u3002\u4E0B\u9762\u662F\u6BCF\u4E2A\u6765\u6E90\u7684\u5B9E\u9645\u7ED3\u679C\uFF1B\u4E5F\u53EF\u4EE5\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u62FF\u5230\u5B8C\u6574\u62A5\u544A\u3002",
      countsDiagnostics(channelId)
    );
  }
  var member_count_default = definePlugin({
    id: "member-count",
    name: "\u6210\u5458\u6570\u663E\u793A",
    description: "\u5728\u9891\u9053\u9876\u680F\u6216\u6210\u5458\u5217\u8868\u9876\u90E8\u663E\u793A\u5F53\u524D\u670D\u52A1\u5668\u7684\u5728\u7EBF\u4EBA\u6570\u4E0E\u603B\u6210\u5458\u6570\u3002\u6570\u5B57\u53D6\u81EA Discord \u81EA\u5DF1\u7684 store\uFF1B\u82E5\u67D0\u670D\u52A1\u5668\u8FD8\u6CA1\u6709\u6210\u5458\u5217\u8868\u6570\u636E\uFF0C\u4F1A\u8C03\u7528\u4E00\u6B21 Discord \u81EA\u8EAB\u7684\u9891\u9053\u9884\u52A0\u8F7D\u6765\u53D6\uFF08\u53EF\u5728\u8BBE\u7F6E\u91CC\u5173\u95ED\uFF09\u3002\u5207\u6362\u670D\u52A1\u5668\u81EA\u52A8\u66F4\u65B0\u3002",
    authors: [{ name: "caitemm" }],
    category: "utility",
    settings: settings8,
    start() {
      injectStyles();
      warnedNoAnchor = false;
      lastSelector.clear();
      startCountTracking();
      ensureMounted2();
      ensureTimer = setInterval(ensureMounted2, ENSURE_MS2);
      unsubscribePlacement = settings8.subscribe("placement", () => {
        warnedNoAnchor = false;
        ensureMounted2();
      });
      selfCheckTimer = setTimeout(selfCheck, 8e3);
      log32.info(`\u6210\u5458\u6570\u6807\u7B7E\u5DF2\u542F\u7528\uFF08\u4F4D\u7F6E\uFF1A${settings8.store.placement}\uFF09`);
    },
    stop() {
      if (ensureTimer) {
        clearInterval(ensureTimer);
        ensureTimer = void 0;
      }
      if (selfCheckTimer) {
        clearTimeout(selfCheckTimer);
        selfCheckTimer = void 0;
      }
      unsubscribePlacement?.();
      unsubscribePlacement = void 0;
      stopCountTracking();
      for (const variant of [...mounted2.keys()]) teardown2(variant);
      lastSelector.clear();
      log32.info("\u6210\u5458\u6570\u6807\u7B7E\u5DF2\u79FB\u9664");
    },
    /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
    probe() {
      const channelId = currentChannelId();
      return {
        placement: settings8.store.placement,
        mounted: [...mounted2.entries()].map(([variant, entry]) => ({
          variant,
          selector: entry.selector,
          attached: document.contains(entry.host),
          renderedHtml: entry.host.innerHTML.slice(0, 200)
        })),
        anchors: {
          header: probeSelectors(ANCHORS.header),
          list: probeSelectors(ANCHORS.list)
        },
        classHints: {
          toolbar: classNamesContaining("toolbar"),
          members: classNamesContaining("members"),
          title: classNamesContaining("title_")
        },
        data: countsDiagnostics(channelId)
      };
    }
  });

  // src/plugins/who-reacted/settings.ts
  var settings9 = defineSettings({
    inlineAvatars: {
      group: "\u5E38\u9A7B\u663E\u793A",
      type: "boolean",
      default: false,
      label: "\u76F4\u63A5\u5728\u8868\u60C5\u65C1\u663E\u793A\u5934\u50CF",
      description: "\u6BCF\u4E2A\u53CD\u5E94\u5185\u5D4C\u4E00\u5C0F\u884C\u5934\u50CF\u3002\u65B0\u7248 Discord \u684C\u9762\u5BA2\u6237\u7AEF\u5DF2\u7ECF\u539F\u751F\u663E\u793A\uFF0C\u7EDD\u5927\u591A\u6570\u60C5\u51B5\u4E0B\u8FD9\u4E00\u9879\u5E94\u5173\u95ED\uFF1B\u53EA\u6709\u5F53\u4F60\u7684 Discord \u7248\u672C\u6CA1\u6709\u539F\u751F\u7684\u53CD\u5E94\u8005\u5934\u50CF\u9884\u89C8\u65F6\u624D\u5F00\u542F\uFF0C\u5426\u5219\u4F1A\u91CD\u590D\u3002"
    },
    inlineAvatarCount: {
      group: "\u5E38\u9A7B\u663E\u793A",
      type: "number",
      default: 3,
      label: "\u6700\u591A\u663E\u793A\u51E0\u4E2A\u5934\u50CF",
      description: "\u53CD\u5E94\u5185\u6700\u591A\u8D34\u51E0\u5F20\u5934\u50CF\u3002\u591A\u4F59\u7684\u4EBA\u4EE5\u300C+N\u300D\u5F62\u5F0F\u6298\u53E0\u3002",
      min: 1,
      max: 6,
      step: 1
    },
    hoverPopout: {
      group: "\u60AC\u505C\u6D6E\u5C42",
      type: "boolean",
      default: false,
      label: "\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355",
      description: "\u9F20\u6807\u505C\u5728\u53CD\u5E94\u4E0A\u65F6\u5F39\u51FA\u5B8C\u6574\u53CD\u5E94\u8005\u5217\u8868\uFF08\u5E26\u540D\u5B57\u3001\u53EF\u9009 ID\uFF09\u3002\u5E38\u9A7B\u5934\u50CF\u5DF2\u7ECF\u591F\u7528\u65F6\u53EF\u4EE5\u5173\u6389\u3002"
    },
    trigger: {
      group: "\u60AC\u505C\u6D6E\u5C42",
      type: "select",
      default: "hover",
      label: "\u89E6\u53D1\u65B9\u5F0F",
      description: "\u60AC\u505C\u5373\u67E5\u4F1A\u5728\u4F60\u5212\u8FC7\u8868\u60C5\u65F6\u5C31\u8BF7\u6C42\u4E00\u6B21\u540D\u5355\uFF1B\u6309\u4F4F Alt \u60AC\u505C\u66F4\u514B\u5236\uFF0C\u9002\u5408\u4E0D\u60F3\u9891\u7E41\u89E6\u53D1\u7684\u573A\u666F\u3002\u4EC5\u5728\u300C\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355\u300D\u5F00\u542F\u65F6\u751F\u6548\u3002",
      options: [
        { value: "hover", label: "\u60AC\u505C\u5373\u67E5" },
        { value: "alt-hover", label: "\u6309\u4F4F Alt \u60AC\u505C" }
      ]
    },
    delay: {
      group: "\u60AC\u505C\u6D6E\u5C42",
      type: "number",
      default: 120,
      label: "\u60AC\u505C\u5EF6\u8FDF\uFF08\u6BEB\u79D2\uFF09",
      description: "\u9F20\u6807\u505C\u7559\u591A\u4E45\u624D\u5F39\u51FA\u540D\u5355\u3002\u592A\u77ED\u4F1A\u5728\u5212\u8FC7\u4E00\u6392\u8868\u60C5\u65F6\u8FDE\u7EED\u53D1\u8BF7\u6C42\u3002\u4EC5\u5728\u300C\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355\u300D\u5F00\u542F\u65F6\u751F\u6548\u3002",
      min: 0,
      max: 2e3,
      step: 50
    },
    maxUsers: {
      group: "\u663E\u793A",
      type: "number",
      default: 20,
      label: "\u6700\u591A\u663E\u793A\u4EBA\u6570",
      description: "\u8D85\u51FA\u7684\u90E8\u5206\u6298\u53E0\u4E3A\u201C\u8FD8\u6709 N \u4EBA\u201D\u3002Discord \u5355\u6B21\u6700\u591A\u8FD4\u56DE 100 \u4EBA\u3002",
      min: 1,
      max: 100,
      step: 5
    },
    showAvatars: {
      group: "\u663E\u793A",
      type: "boolean",
      default: true,
      label: "\u663E\u793A\u5934\u50CF",
      description: "\u5173\u95ED\u540E\u53EA\u663E\u793A\u540D\u5B57\uFF0C\u4E0D\u4F1A\u52A0\u8F7D\u4EFB\u4F55\u5934\u50CF\u56FE\u7247\u3002"
    },
    showIds: {
      group: "\u663E\u793A",
      type: "boolean",
      default: false,
      label: "\u663E\u793A\u7528\u6237 ID",
      description: "\u5728\u540D\u5B57\u540E\u9762\u9644\u4E0A\u7528\u6237 ID\uFF0C\u4FBF\u4E8E\u4E3E\u62A5\u6216\u62C9\u9ED1\u65F6\u590D\u5236\u3002"
    }
  });

  // src/plugins/who-reacted/reactors.ts
  var log33 = logger("who-reacted");
  var CACHE_TTL_MS = 3e4;
  function resolveReaction(node) {
    for (const props of getFiberPropsChain(node, 14)) {
      const emoji = props?.emoji;
      const message = props?.message;
      if (emoji == null || message == null) continue;
      const messageId = message.id;
      const channelId = message.channel_id ?? message.channelId;
      if (!messageId || !channelId) continue;
      if (!emoji.id && !emoji.name) continue;
      return {
        channelId: String(channelId),
        messageId: String(messageId),
        emoji,
        count: typeof props.count === "number" ? props.count : null,
        type: props.type === 1 ? 1 : 0
      };
    }
    return null;
  }
  function emojiParam(emoji) {
    const name = emoji.name ?? "";
    return emoji.id ? `${name}:${emoji.id}` : name;
  }
  function cacheKey(target) {
    return `${target.channelId}/${target.messageId}/${emojiParam(target.emoji)}/${target.type}`;
  }
  function emojiLabel(emoji) {
    if (emoji.id) return `:${emoji.name ?? "emoji"}:`;
    return emoji.name ?? "";
  }
  function defaultAvatar(userId) {
    let index = 0;
    try {
      index = Number((BigInt(userId) >> 22n) % 6n);
    } catch {
      index = 0;
    }
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  function avatarUrl(user) {
    const id = user?.id ? String(user.id) : null;
    if (!id) return null;
    const hash = user?.avatar;
    if (typeof hash !== "string" || hash.length === 0) return defaultAvatar(id);
    const ext = hash.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=32`;
  }
  function toReactor(user) {
    const id = user?.id ? String(user.id) : null;
    if (!id) return null;
    const name = typeof user.global_name === "string" && user.global_name || typeof user.username === "string" && user.username || id;
    return { id, name, avatarUrl: avatarUrl(user), bot: user?.bot === true };
  }
  var cache = /* @__PURE__ */ new Map();
  var inFlight = /* @__PURE__ */ new Map();
  function cachedReactors(target) {
    const entry = cache.get(cacheKey(target));
    if (!entry) return null;
    if (Date.now() - entry.at > CACHE_TTL_MS) {
      cache.delete(cacheKey(target));
      return null;
    }
    return entry.reactors;
  }
  function clearCache() {
    cache.clear();
    inFlight.clear();
  }
  function fetchReactors(target, limit) {
    const key = cacheKey(target);
    const fresh = cachedReactors(target);
    if (fresh) return Promise.resolve(fresh);
    const pending = inFlight.get(key);
    if (pending) return pending;
    const capped = Math.max(1, Math.min(100, Math.trunc(limit) || 20));
    const url = `/channels/${target.channelId}/messages/${target.messageId}/reactions/${encodeURIComponent(emojiParam(target.emoji))}?limit=${capped}` + (target.type === 1 ? "&type=1" : "");
    const request = (async () => {
      const api = RestAPI;
      if (typeof api?.get !== "function") {
        throw new Error("\u672A\u627E\u5230 Discord \u7684 REST \u6A21\u5757");
      }
      const response = await api.get({ url, oldFormErrors: true });
      const body = response?.body;
      if (!Array.isArray(body)) throw new Error("\u8FD4\u56DE\u5185\u5BB9\u4E0D\u662F\u7528\u6237\u5217\u8868");
      const reactors = [];
      for (const user of body) {
        const reactor = toReactor(user);
        if (reactor) reactors.push(reactor);
      }
      cache.set(key, { at: Date.now(), reactors });
      return reactors;
    })();
    const guarded = request.catch((err) => {
      log33.debug("\u62C9\u53D6 reaction \u540D\u5355\u5931\u8D25", err);
      throw err;
    });
    inFlight.set(key, guarded);
    void guarded.catch(() => void 0).then(() => inFlight.delete(key));
    return guarded;
  }

  // src/plugins/who-reacted/ui/ReactorCard.tsx
  function customEmojiUrl(emoji) {
    return emojiCdnUrl(String(emoji.id), Boolean(emoji.animated), 32);
  }
  function EmojiPreview({ emoji }) {
    if (emoji.id) {
      return /* @__PURE__ */ React.createElement(
        "img",
        {
          className: "hc-whoreacted__emoji-img",
          src: customEmojiUrl(emoji),
          alt: emojiLabel(emoji),
          width: 18,
          height: 18
        }
      );
    }
    return /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__emoji-char" }, emoji.name ?? "");
  }
  function ReactorCard({ target }) {
    const s = settings9.store;
    const [state, setState] = useState(() => {
      const cached2 = cachedReactors(target);
      return cached2 ? { kind: "ready", reactors: cached2 } : { kind: "loading" };
    });
    useEffect(() => {
      let live = true;
      fetchReactors(target, s.maxUsers).then((reactors) => {
        if (live) setState({ kind: "ready", reactors });
      }).catch((err) => {
        if (!live) return;
        const message = err instanceof Error ? err.message : typeof err === "string" ? err : "\u672A\u77E5\u9519\u8BEF";
        setState({ kind: "error", message });
      });
      return () => {
        live = false;
      };
    }, []);
    const shown = state.kind === "ready" ? state.reactors.slice(0, s.maxUsers) : [];
    const total = target.count ?? (state.kind === "ready" ? state.reactors.length : null);
    const hidden = state.kind === "ready" && total != null ? Math.max(0, total - shown.length) : 0;
    return /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted" }, /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__head" }, /* @__PURE__ */ React.createElement(EmojiPreview, { emoji: target.emoji }), /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__title" }, "\u8C01\u70B9\u4E86\u8FD9\u4E2A\u8868\u60C5"), total != null && /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__count" }, total)), state.kind === "loading" && /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__hint" }, "\u6B63\u5728\u67E5\u8BE2\u2026"), state.kind === "error" && /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__hint hc-whoreacted__hint--error" }, "\u67E5\u8BE2\u5931\u8D25\uFF1A", state.message), state.kind === "ready" && shown.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__hint" }, "\u6CA1\u6709\u4EBA\uFF08\u53EF\u80FD\u521A\u521A\u88AB\u53D6\u6D88\uFF09"), shown.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__list" }, shown.map((reactor) => /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__row", key: reactor.id }, s.showAvatars && reactor.avatarUrl && /* @__PURE__ */ React.createElement(
      "img",
      {
        className: "hc-whoreacted__avatar",
        src: reactor.avatarUrl,
        alt: "",
        width: 20,
        height: 20
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__name" }, reactor.name), reactor.bot && /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__tag" }, "BOT"), s.showIds && /* @__PURE__ */ React.createElement("span", { className: "hc-whoreacted__id" }, reactor.id))), hidden > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-whoreacted__more" }, "\u8FD8\u6709 ", hidden, " \u4EBA")));
  }

  // src/plugins/who-reacted/inline-avatars.ts
  var log34 = logger("who-reacted");
  var DECORATED = /* @__PURE__ */ new WeakSet();
  var HOST_ATTR = "data-hc-reactors";
  var scanTimer;
  var mutationObserver;
  var REACTION_SELECTOR = '[class*="reactionInner"], [class*="reaction_"]';
  function makeHost() {
    const host5 = document.createElement("span");
    host5.className = "hc-inline-reactors";
    host5.setAttribute(HOST_ATTR, "1");
    return host5;
  }
  function fillHost(host5, reactors, totalHint) {
    const max = Math.max(1, Math.min(6, Math.trunc(settings9.store.inlineAvatarCount) || 3));
    const shown = reactors.slice(0, max);
    const total = totalHint ?? reactors.length;
    const overflow = Math.max(0, total - shown.length);
    host5.textContent = "";
    for (const reactor of shown) {
      const img = document.createElement("img");
      img.className = "hc-inline-reactors__avatar";
      if (reactor.avatarUrl) img.src = reactor.avatarUrl;
      img.alt = "";
      img.loading = "lazy";
      img.title = reactor.name;
      img.referrerPolicy = "no-referrer";
      host5.appendChild(img);
    }
    if (shown.length > 0 && overflow > 0) {
      const more = document.createElement("span");
      more.className = "hc-inline-reactors__more";
      more.textContent = `+${overflow}`;
      host5.appendChild(more);
    }
  }
  function pillHasNativePreview(pill) {
    return pill.querySelector('img[src*="cdn.discordapp.com/avatars/"]') != null || pill.querySelector('img[src*="cdn.discordapp.com/embed/avatars/"]') != null;
  }
  async function decorate(pill) {
    if (DECORATED.has(pill)) return;
    if (pillHasNativePreview(pill)) {
      DECORATED.add(pill);
      return;
    }
    DECORATED.add(pill);
    const target = resolveReaction(pill);
    if (!target) return;
    if (target.count != null && target.count <= 0) return;
    const host5 = makeHost();
    try {
      pill.appendChild(host5);
    } catch {
      return;
    }
    try {
      const wanted = Math.min(12, Math.max(6, (settings9.store.inlineAvatarCount || 3) + 3));
      const reactors = await fetchReactors(target, wanted);
      if (!host5.isConnected) return;
      if (reactors.length === 0) {
        host5.remove();
        DECORATED.delete(pill);
        return;
      }
      if (pillHasNativePreview(pill)) {
        host5.remove();
        return;
      }
      fillHost(host5, reactors, target.count);
    } catch (err) {
      log34.debug("inline avatars: fetch failed", err);
      host5.remove();
      DECORATED.delete(pill);
    }
  }
  function scan() {
    if (!settings9.store.inlineAvatars) return;
    let pills;
    try {
      pills = document.querySelectorAll(REACTION_SELECTOR);
    } catch {
      return;
    }
    pills.forEach((pill) => {
      if (!pill.isConnected) return;
      if (DECORATED.has(pill) && !pill.querySelector(`[${HOST_ATTR}]`)) DECORATED.delete(pill);
      void decorate(pill);
    });
  }
  function startInlineAvatars() {
    if (!settings9.store.inlineAvatars) return;
    stopInlineAvatars();
    scan();
    scanTimer = setInterval(scan, 1500);
    if (typeof MutationObserver === "function") {
      mutationObserver = new MutationObserver((records) => {
        for (const record2 of records) {
          record2.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (node.matches?.(REACTION_SELECTOR)) void decorate(node);
            node.querySelectorAll?.(REACTION_SELECTOR).forEach((pill) => void decorate(pill));
          });
        }
      });
      try {
        mutationObserver.observe(document.body, { childList: true, subtree: true });
      } catch {
      }
    }
    log34.info("inline reactor avatars: enabled");
  }
  function stopInlineAvatars() {
    if (scanTimer) {
      clearInterval(scanTimer);
      scanTimer = void 0;
    }
    if (mutationObserver) {
      try {
        mutationObserver.disconnect();
      } catch {
      }
      mutationObserver = void 0;
    }
    try {
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((host5) => host5.remove());
    } catch {
    }
  }

  // src/plugins/who-reacted/index.tsx
  var log35 = logger("who-reacted");
  var REACTION_SELECTOR2 = '[class*="reactionInner"], [class*="reaction_"]';
  var HIDE_GRACE_MS = 140;
  var ANCHOR_CHECK_MS = 500;
  var host4 = null;
  var unmount4 = null;
  var anchor = null;
  var observer = null;
  var anchorTimer;
  var hovered = null;
  var showTimer;
  var hideTimer;
  var altDown = false;
  var inlineToggleUnsub;
  var inlineCountUnsub;
  var hoverToggleUnsub;
  var hoverListenersAttached = false;
  function reposition() {
    if (!host4 || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = host4.offsetWidth || 220;
    const height = host4.offsetHeight || 110;
    const margin = 8;
    let left = rect.left + rect.width / 2 - width / 2;
    let top = rect.top - height - margin;
    if (top < margin) top = rect.bottom + margin;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    host4.style.left = `${Math.round(left)}px`;
    host4.style.top = `${Math.round(top)}px`;
  }
  function hide() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = void 0;
    }
    if (anchorTimer) {
      clearInterval(anchorTimer);
      anchorTimer = void 0;
    }
    if (observer) {
      try {
        observer.disconnect();
      } catch {
      }
      observer = null;
    }
    if (unmount4) {
      try {
        unmount4();
      } catch {
      }
      unmount4 = null;
    }
    if (host4) {
      host4.remove();
      host4 = null;
    }
    anchor = null;
  }
  function scheduleHide() {
    if (!host4 || hideTimer) return;
    hideTimer = setTimeout(() => {
      hideTimer = void 0;
      hide();
    }, HIDE_GRACE_MS);
  }
  function cancelHide() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = void 0;
    }
  }
  function show(element, target) {
    hide();
    host4 = document.createElement("div");
    host4.className = "halcyon hc-whoreacted-host";
    host4.setAttribute("data-hc-plugin", "who-reacted");
    document.body.appendChild(host4);
    anchor = element;
    try {
      unmount4 = mountDetached(React.createElement(ReactorCard, { target }), host4);
    } catch (err) {
      log35.error("\u65E0\u6CD5\u663E\u793A reaction \u540D\u5355", err);
      hide();
      return;
    }
    reposition();
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(() => reposition());
      observer.observe(host4);
    } else {
      setTimeout(reposition, 120);
      setTimeout(reposition, 400);
    }
    anchorTimer = setInterval(() => {
      if (!anchor || !document.contains(anchor)) hide();
    }, ANCHOR_CHECK_MS);
  }
  function triggerOpen() {
    return settings9.store.trigger !== "alt-hover" || altDown;
  }
  function tryShow(element) {
    if (!triggerOpen()) return;
    const target = resolveReaction(element);
    if (!target) return;
    show(element, target);
  }
  function clearShowTimer() {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = void 0;
    }
  }
  function onMouseOver(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pill = target.closest(REACTION_SELECTOR2);
    if (!pill) {
      hovered = null;
      clearShowTimer();
      scheduleHide();
      return;
    }
    if (pill === hovered) {
      cancelHide();
      return;
    }
    hovered = pill;
    clearShowTimer();
    cancelHide();
    const delay = Math.max(0, Math.min(2e3, settings9.store.delay));
    showTimer = setTimeout(() => {
      showTimer = void 0;
      if (hovered === pill && document.contains(pill)) tryShow(pill);
    }, delay);
  }
  function onMouseLeaveWindow() {
    hovered = null;
    clearShowTimer();
    hide();
  }
  function onKeyDown2(event) {
    if (!event.altKey) return;
    altDown = true;
    if (settings9.store.trigger === "alt-hover" && hovered && !host4) {
      if (document.contains(hovered)) tryShow(hovered);
    }
  }
  function onKeyUp(event) {
    if (event.key === "Alt" || !event.altKey) {
      altDown = false;
      if (settings9.store.trigger === "alt-hover") hide();
    }
  }
  function onScrollOrResize() {
    if (host4) hide();
  }
  function onWindowBlur() {
    altDown = false;
  }
  function attachHoverListeners() {
    if (hoverListenersAttached) return;
    hoverListenersAttached = true;
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseleave", onMouseLeaveWindow);
    document.addEventListener("keydown", onKeyDown2, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("blur", onWindowBlur);
  }
  function detachHoverListeners() {
    if (!hoverListenersAttached) return;
    hoverListenersAttached = false;
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("mouseleave", onMouseLeaveWindow);
    document.removeEventListener("keydown", onKeyDown2, true);
    document.removeEventListener("keyup", onKeyUp, true);
    document.removeEventListener("scroll", onScrollOrResize, true);
    window.removeEventListener("resize", onScrollOrResize);
    window.removeEventListener("blur", onWindowBlur);
    clearShowTimer();
    hovered = null;
    altDown = false;
    hide();
  }
  var who_reacted_default = definePlugin({
    id: "who-reacted",
    name: "\u8C01\u70B9\u4E86\u8868\u60C5",
    description: "\u5728\u6BCF\u4E2A\u53CD\u5E94\u56DE\u5E94\u5185\u5D4C\u4E00\u5C0F\u884C\u5934\u50CF\uFF08\u524D\u51E0\u4E2A\u53CD\u5E94\u8005\uFF09\uFF0C\u50CF Discord \u684C\u9762\u8FD1\u7248\u7684 Reaction Preview \u4E00\u6837\uFF0C\u4E0D\u7528\u60AC\u505C\u5C31\u770B\u5F97\u5230\u3002\u540D\u5355\u6309\u9700\u67E5\u8BE2\u3001\u7F13\u5B58 30 \u79D2\u3002\u60AC\u505C\u5B8C\u6574\u540D\u5355\u6D6E\u5C42\u9ED8\u8BA4\u5173\u95ED\uFF0C\u9700\u8981\u65F6\u53EF\u5728\u8BBE\u7F6E\u91CC\u5F00\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "utility",
    settings: settings9,
    start() {
      injectStyles();
      clearCache();
      startInlineAvatars();
      inlineToggleUnsub = settings9.subscribe("inlineAvatars", (on) => {
        if (on) startInlineAvatars();
        else stopInlineAvatars();
      });
      inlineCountUnsub = settings9.subscribe("inlineAvatarCount", () => {
        stopInlineAvatars();
        startInlineAvatars();
      });
      if (settings9.store.hoverPopout) attachHoverListeners();
      hoverToggleUnsub = settings9.subscribe("hoverPopout", (on) => {
        if (on) attachHoverListeners();
        else detachHoverListeners();
      });
      log35.info(
        `\u5DF2\u542F\u7528\uFF08\u5185\u5D4C\u5934\u50CF\uFF1A${settings9.store.inlineAvatars ? "\u5F00" : "\u5173"}\uFF0C\u60AC\u505C\u6D6E\u5C42\uFF1A${settings9.store.hoverPopout ? "\u5F00" : "\u5173"}\uFF09`
      );
    },
    stop() {
      detachHoverListeners();
      inlineToggleUnsub?.();
      inlineToggleUnsub = void 0;
      inlineCountUnsub?.();
      inlineCountUnsub = void 0;
      hoverToggleUnsub?.();
      hoverToggleUnsub = void 0;
      stopInlineAvatars();
      clearShowTimer();
      hovered = null;
      altDown = false;
      hide();
      clearCache();
      log35.info("\u5DF2\u505C\u7528");
    },
    /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
    probe() {
      let nodes = null;
      try {
        nodes = document.querySelectorAll(REACTION_SELECTOR2);
      } catch {
        nodes = null;
      }
      let sample = null;
      if (nodes && nodes.length > 0) {
        const target = resolveReaction(nodes[0]);
        sample = target ? {
          channelId: target.channelId,
          messageId: target.messageId,
          emoji: { id: target.emoji.id ?? null, name: target.emoji.name ?? null },
          count: target.count,
          type: target.type
        } : "fiber props \u91CC\u6CA1\u6709 message + emoji \u2014\u2014 \u8BF4\u660E\u8FD9\u4E2A\u7248\u672C\u7684 reaction \u7EC4\u4EF6 props \u53D8\u4E86";
      }
      return {
        trigger: settings9.store.trigger,
        cardShown: host4 != null,
        reactionNodes: nodes?.length ?? -1,
        sample,
        anchors: probeSelectors([REACTION_SELECTOR2, '[class*="reactionInner"]', '[class*="reaction_"]']),
        classHints: classNamesContaining("reaction"),
        restApiAvailable: (() => {
          try {
            return typeof RestAPI?.get === "function";
          } catch {
            return false;
          }
        })()
      };
    }
  });

  // src/plugins/platform-indicators/platforms.ts
  var PresenceStore = lazy((m) => m?.getName?.() === "PresenceStore");
  var SessionsStore = lazy((m) => m?.getName?.() === "SessionsStore");
  var PLATFORM_ORDER = ["desktop", "mobile", "web", "embedded"];
  function normalizeStatus(value) {
    return value === "online" || value === "idle" || value === "dnd" ? value : "online";
  }
  function normalizePlatform(value) {
    switch (value) {
      case "desktop":
      case "mobile":
      case "web":
      case "embedded":
        return value;
      default:
        return null;
    }
  }
  function currentUserId2() {
    try {
      const id = UserStore.getCurrentUser?.()?.id;
      return typeof id === "string" ? id : null;
    } catch {
      return null;
    }
  }
  function isBot(userId) {
    try {
      return UserStore.getUser?.(userId)?.bot === true;
    } catch {
      return false;
    }
  }
  function fromClientStatuses(userId) {
    let entry;
    try {
      const state = PresenceStore.getState?.();
      const map = state?.clientStatuses ?? state?.clientStatus;
      entry = map?.[userId];
    } catch {
      return [];
    }
    if (entry == null || typeof entry !== "object") return [];
    const out = [];
    for (const platform of PLATFORM_ORDER) {
      const status = entry[platform];
      if (status == null) continue;
      out.push({ platform, status: normalizeStatus(status) });
    }
    return out;
  }
  function fromSessions() {
    let sessions;
    try {
      sessions = SessionsStore.getSessions?.();
    } catch {
      return [];
    }
    if (sessions == null || typeof sessions !== "object") return [];
    const best = /* @__PURE__ */ new Map();
    for (const session of Object.values(sessions)) {
      if (session == null || session.sessionId === "all") continue;
      const platform = normalizePlatform(session.clientInfo?.client);
      if (!platform) continue;
      if (!best.has(platform)) best.set(platform, normalizeStatus(session.status));
    }
    const out = [];
    for (const platform of PLATFORM_ORDER) {
      const status = best.get(platform);
      if (status) out.push({ platform, status });
    }
    return out;
  }
  function readPlatforms(userId) {
    if (!userId) return [];
    if (userId === currentUserId2()) {
      const own = fromSessions();
      if (own.length) return own;
    }
    return fromClientStatuses(userId);
  }
  var COALESCE_MS = 400;
  var version = 0;
  var scheduled;
  var subscribers2 = /* @__PURE__ */ new Set();
  function presenceVersion() {
    return version;
  }
  function subscribePresence(listener) {
    subscribers2.add(listener);
    return () => {
      subscribers2.delete(listener);
    };
  }
  function bumpPresence() {
    if (scheduled) return;
    scheduled = setTimeout(() => {
      scheduled = void 0;
      version++;
      for (const listener of [...subscribers2]) {
        try {
          listener();
        } catch {
        }
      }
    }, COALESCE_MS);
  }
  function resetPresenceBus() {
    if (scheduled) {
      clearTimeout(scheduled);
      scheduled = void 0;
    }
    subscribers2.clear();
  }
  function presenceDiagnostics() {
    let presenceStore = false;
    let stateKeys = [];
    let sampleCount = null;
    try {
      const state = PresenceStore.getState?.();
      presenceStore = state != null && typeof state === "object";
      if (presenceStore) stateKeys = Object.keys(state).slice(0, 12);
      const map = state?.clientStatuses ?? state?.clientStatus;
      sampleCount = map && typeof map === "object" ? Object.keys(map).length : null;
    } catch {
      presenceStore = false;
    }
    let sessionsStore = false;
    let sessionCount = null;
    try {
      const sessions = SessionsStore.getSessions?.();
      sessionsStore = sessions != null && typeof sessions === "object";
      if (sessionsStore) sessionCount = Object.keys(sessions).length;
    } catch {
      sessionsStore = false;
    }
    return {
      PresenceStore: presenceStore,
      presenceStateKeys: stateKeys,
      clientStatusesEntries: sampleCount,
      SessionsStore: sessionsStore,
      sessionCount
    };
  }

  // src/plugins/platform-indicators/settings.ts
  var settings10 = defineSettings({
    inMessages: {
      group: "\u663E\u793A\u4F4D\u7F6E",
      type: "boolean",
      default: true,
      label: "\u6D88\u606F\u4F5C\u8005\u65C1",
      description: "\u5728\u804A\u5929\u91CC\u6BCF\u6761\u6D88\u606F\u7684\u7528\u6237\u540D\u540E\u9762\u663E\u793A\u5BF9\u65B9\u6240\u5728\u7684\u5E73\u53F0\u3002"
    },
    inMemberList: {
      group: "\u663E\u793A\u4F4D\u7F6E",
      type: "boolean",
      default: true,
      label: "\u6210\u5458\u5217\u8868",
      description: "\u5728\u53F3\u4FA7\u6210\u5458\u5217\u8868\u7684\u6BCF\u4E2A\u540D\u5B57\u540E\u9762\u663E\u793A\u5E73\u53F0\u56FE\u6807\u3002"
    },
    colorize: {
      group: "\u5916\u89C2",
      type: "select",
      default: "status",
      label: "\u56FE\u6807\u914D\u8272",
      description: "\u6309\u72B6\u6001\u7740\u8272\u65F6\uFF0C\u7EFF=\u5728\u7EBF\u3001\u9EC4=\u7A7A\u95F2\u3001\u7EA2=\u514D\u6253\u6270\uFF0C\u548C Discord \u7684\u72B6\u6001\u70B9\u4E00\u81F4\u3002",
      options: [
        { value: "status", label: "\u6309\u5728\u7EBF\u72B6\u6001\u7740\u8272" },
        { value: "muted", label: "\u7EDF\u4E00\u7070\u8272" }
      ]
    },
    iconSize: {
      group: "\u5916\u89C2",
      type: "select",
      default: "14",
      label: "\u56FE\u6807\u5927\u5C0F",
      options: [
        { value: "12", label: "12\uFF08\u6700\u5C0F\uFF09" },
        { value: "14", label: "14\uFF08\u9ED8\u8BA4\uFF09" },
        { value: "16", label: "16" },
        { value: "18", label: "18" }
      ]
    },
    ignoreBots: {
      group: "\u8FC7\u6EE4",
      type: "boolean",
      default: true,
      label: "\u5FFD\u7565\u673A\u5668\u4EBA",
      description: "\u673A\u5668\u4EBA\u51E0\u4E4E\u603B\u662F\u663E\u793A\u4E3A\u7F51\u9875\u7AEF\uFF0C\u4FE1\u606F\u91CF\u4E3A\u96F6\uFF0C\u9ED8\u8BA4\u4E0D\u663E\u793A\u3002"
    },
    ignoreSelf: {
      group: "\u8FC7\u6EE4",
      type: "boolean",
      default: false,
      label: "\u5FFD\u7565\u81EA\u5DF1",
      description: "\u4E0D\u5728\u81EA\u5DF1\u7684\u6D88\u606F\u65C1\u663E\u793A\u5E73\u53F0\u56FE\u6807\u3002"
    }
  });

  // src/plugins/platform-indicators/ui/PlatformIndicator.tsx
  var ICONS = {
    desktop: DesktopIcon,
    mobile: MobileIcon,
    web: GlobeIcon,
    embedded: GamepadIcon
  };
  var LABELS = {
    desktop: "\u684C\u9762\u5BA2\u6237\u7AEF",
    mobile: "\u624B\u673A",
    web: "\u7F51\u9875 / \u6D4F\u89C8\u5668",
    embedded: "\u6E38\u620F\u4E3B\u673A"
  };
  var STATUS_LABELS = {
    online: "\u5728\u7EBF",
    idle: "\u7A7A\u95F2",
    dnd: "\u514D\u6253\u6270",
    offline: "\u79BB\u7EBF"
  };
  function usePresenceVersion() {
    const [, setVersion] = useState(presenceVersion());
    useEffect(() => subscribePresence(() => setVersion(presenceVersion())), []);
    return presenceVersion();
  }
  function PlatformIndicator({
    userId,
    isSelf
  }) {
    usePresenceVersion();
    const s = settings10.store;
    if (s.ignoreSelf && isSelf) return null;
    if (s.ignoreBots && isBot(userId)) return null;
    const platforms = readPlatforms(userId);
    if (platforms.length === 0) return null;
    const size = Number(s.iconSize) || 14;
    const tone = s.colorize === "status";
    return /* @__PURE__ */ React.createElement("span", { className: "hc-platform" }, platforms.map(({ platform, status }) => {
      const Icon = ICONS[platform];
      const label = `${LABELS[platform]}\uFF08${STATUS_LABELS[status] ?? status}\uFF09`;
      return /* @__PURE__ */ React.createElement(
        "span",
        {
          key: platform,
          className: `hc-platform__item hc-platform__item--${tone ? status : "muted"}`,
          title: label
        },
        /* @__PURE__ */ React.createElement(Icon, { size, "aria-label": label })
      );
    }));
  }

  // src/plugins/platform-indicators/index.tsx
  var log36 = logger("platform-indicators");
  var MARK = "data-hc-platform";
  var MESSAGE_SELECTORS = [
    '[id^="message-username-"]',
    '[class*="headerText"] [class*="username"]',
    '[class*="header_"] [class*="username"]'
  ];
  var MEMBER_SELECTORS = [
    '[class*="membersWrap"] [class*="nameAndDecorators"]',
    '[class*="members"] [class*="nameAndDecorators"]',
    '[class*="nameAndDecorators"]',
    '[class*="membersWrap"] [class*="memberInner"]',
    '[class*="member_"] [class*="username"]'
  ];
  var WATCHED_ACTIONS2 = [
    "PRESENCE_UPDATES",
    "PRESENCE_UPDATE",
    "SESSIONS_REPLACE",
    "GUILD_MEMBER_LIST_UPDATE"
  ];
  var SCAN_MS = 1e3;
  var mounted3 = /* @__PURE__ */ new Map();
  var scanTimer2;
  var unsubscribes2 = [];
  function currentUserId3() {
    try {
      const id = UserStore.getCurrentUser?.()?.id;
      return typeof id === "string" ? id : null;
    } catch {
      return null;
    }
  }
  function resolveUserId(node, kind) {
    const chain = getFiberPropsChain(node, 16);
    if (kind === "message") {
      for (const props of chain) {
        const id = props?.message?.author?.id;
        if (id) return String(id);
      }
    }
    for (const props of chain) {
      const id = props?.user?.id;
      if (id) return String(id);
    }
    for (const props of chain) {
      const id = props?.message?.author?.id;
      if (id) return String(id);
    }
    return null;
  }
  function attach3(anchor2, kind, userId, selfId) {
    const host5 = document.createElement("span");
    host5.className = "hc-platform-host";
    host5.setAttribute("data-hc-plugin", "platform-indicators");
    try {
      anchor2.appendChild(host5);
    } catch {
      return false;
    }
    try {
      const unmount5 = mountDetached(
        React.createElement(PlatformIndicator, { userId, isSelf: userId === selfId }),
        host5
      );
      mounted3.set(host5, { kind, host: host5, anchor: anchor2, unmount: unmount5 });
      return true;
    } catch (err) {
      host5.remove();
      log36.debug("\u6302\u8F7D\u5E73\u53F0\u56FE\u6807\u5931\u8D25", err);
      return false;
    }
  }
  function mountInto(nodes, kind, selfId) {
    for (let i = 0; i < nodes.length; i++) {
      const anchor2 = nodes[i];
      if (anchor2.hasAttribute(MARK)) continue;
      const userId = resolveUserId(anchor2, kind);
      if (!userId) {
        anchor2.setAttribute(MARK, "0");
        continue;
      }
      anchor2.setAttribute(MARK, kind);
      if (!attach3(anchor2, kind, userId, selfId)) anchor2.removeAttribute(MARK);
    }
  }
  function detach(entry) {
    mounted3.delete(entry.host);
    try {
      entry.unmount();
    } catch {
    }
    entry.host.remove();
    try {
      entry.anchor.removeAttribute(MARK);
    } catch {
    }
  }
  function prune() {
    for (const entry of [...mounted3.values()]) {
      if (!document.contains(entry.host)) detach(entry);
    }
  }
  function detachKind(kind) {
    for (const entry of [...mounted3.values()]) {
      if (entry.kind === kind) detach(entry);
    }
  }
  function firstMatchAll(selectors) {
    for (const selector of selectors) {
      try {
        const nodes = document.querySelectorAll(selector);
        if (nodes.length > 0) return { nodes, selector };
      } catch {
      }
    }
    return null;
  }
  var lastSelector2 = /* @__PURE__ */ new Map();
  var warnedNoAnchor2 = false;
  function scanKind(kind, selectors, selfId) {
    const hit = firstMatchAll(selectors);
    if (!hit) return false;
    if (lastSelector2.get(kind) !== hit.selector) {
      lastSelector2.set(kind, hit.selector);
      log36.info(`${kind} \u951A\u70B9\uFF1A${hit.selector}\uFF08${hit.nodes.length} \u4E2A\uFF09`);
    }
    mountInto(hit.nodes, kind, selfId);
    return true;
  }
  function scan2() {
    prune();
    const s = settings10.store;
    const selfId = currentUserId3();
    let anyAnchor = false;
    if (s.inMessages && scanKind("message", MESSAGE_SELECTORS, selfId)) anyAnchor = true;
    if (s.inMemberList && scanKind("member", MEMBER_SELECTORS, selfId)) anyAnchor = true;
    if (!anyAnchor && !warnedNoAnchor2 && (s.inMessages || s.inMemberList)) {
      warnedNoAnchor2 = true;
      log36.warn(
        "\u627E\u4E0D\u5230\u53EF\u6302\u8F7D\u7684\u4F4D\u7F6E\uFF08\u6D88\u606F\u4F5C\u8005 / \u6210\u5458\u5217\u8868\uFF09\u3002\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6709\u6D88\u606F\u7684\u9891\u9053\uFF1B\u82E5\u5DF2\u7ECF\u6253\u5F00\u8FD8\u662F\u6CA1\u6709\uFF0C\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u5E76\u628A\u8F93\u51FA\u53D1\u56DE\u6765\u3002"
      );
    }
  }
  function clearMarks() {
    try {
      for (const node of document.querySelectorAll(`[${MARK}]`)) {
        node.removeAttribute(MARK);
      }
    } catch {
    }
  }
  var platform_indicators_default = definePlugin({
    id: "platform-indicators",
    name: "\u5E73\u53F0\u6807\u8BC6",
    description: "\u5728\u6D88\u606F\u4F5C\u8005\u4E0E\u6210\u5458\u5217\u8868\u65C1\u663E\u793A\u5BF9\u65B9\u5F53\u524D\u6240\u5728\u7684\u5E73\u53F0\uFF08\u684C\u9762\u7AEF / \u624B\u673A / \u7F51\u9875 / \u6E38\u620F\u4E3B\u673A\uFF09\uFF0C\u56FE\u6807\u6309\u5728\u7EBF\u72B6\u6001\u7740\u8272\u3002\u6570\u636E\u53D6\u81EA Discord \u81EA\u5DF1\u7684\u72B6\u6001 store\uFF0C\u4E0D\u53D1\u4EFB\u4F55\u8BF7\u6C42\u3002",
    authors: [{ name: "Vencord" }, { name: "caitemm" }],
    category: "appearance",
    settings: settings10,
    start() {
      injectStyles();
      warnedNoAnchor2 = false;
      lastSelector2.clear();
      scan2();
      scanTimer2 = setInterval(scan2, SCAN_MS);
      unsubscribes2 = WATCHED_ACTIONS2.map((type) => flux.subscribe(type, bumpPresence));
      unsubscribes2.push(
        settings10.subscribe("inMessages", (on) => {
          if (!on) detachKind("message");
          else scan2();
        }),
        settings10.subscribe("inMemberList", (on) => {
          if (!on) detachKind("member");
          else scan2();
        }),
        settings10.subscribe("colorize", () => bumpPresence()),
        settings10.subscribe("iconSize", () => bumpPresence()),
        settings10.subscribe("ignoreBots", () => bumpPresence()),
        settings10.subscribe("ignoreSelf", () => bumpPresence())
      );
      log36.info("\u5E73\u53F0\u6807\u8BC6\u5DF2\u542F\u7528");
    },
    stop() {
      if (scanTimer2) {
        clearInterval(scanTimer2);
        scanTimer2 = void 0;
      }
      for (const off of unsubscribes2) {
        try {
          off();
        } catch {
        }
      }
      unsubscribes2 = [];
      for (const entry of [...mounted3.values()]) detach(entry);
      clearMarks();
      resetPresenceBus();
      lastSelector2.clear();
      log36.info("\u5E73\u53F0\u6807\u8BC6\u5DF2\u79FB\u9664");
    },
    /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
    probe() {
      const selfId = currentUserId3();
      const messageHit = firstMatchAll(MESSAGE_SELECTORS);
      const memberHit = firstMatchAll(MEMBER_SELECTORS);
      const sample = (hit, kind) => {
        if (!hit || hit.nodes.length === 0) return null;
        const node = hit.nodes[0];
        const userId = resolveUserId(node, kind);
        return {
          selector: hit.selector,
          matches: hit.nodes.length,
          userId,
          platforms: userId ? readPlatforms(userId) : null,
          isBot: userId ? isBot(userId) : null
        };
      };
      return {
        settings: {
          inMessages: settings10.store.inMessages,
          inMemberList: settings10.store.inMemberList,
          ignoreBots: settings10.store.ignoreBots
        },
        mountedCount: mounted3.size,
        selfId,
        selfPlatforms: selfId ? readPlatforms(selfId) : null,
        message: sample(messageHit, "message"),
        member: sample(memberHit, "member"),
        anchors: {
          message: probeSelectors(MESSAGE_SELECTORS),
          member: probeSelectors(MEMBER_SELECTORS)
        },
        classHints: {
          username: classNamesContaining("username"),
          nameAndDecorators: classNamesContaining("nameAndDecorators")
        },
        stores: presenceDiagnostics()
      };
    }
  });

  // src/plugins/index.ts
  var plugins = [
    settings_host_default,
    context_menu_api_default,
    message_logger_default,
    show_username_default,
    guild_monitor_default,
    message_cleaner_default,
    fake_nitro_default,
    console_cleaner_default,
    emote_cloner_default,
    mark_all_read_default,
    silent_typing_default,
    member_count_default,
    who_reacted_default,
    platform_indicators_default
  ];

  // src/core/probe.ts
  var log37 = logger("probe");
  function probe() {
    const perPlugin = {};
    for (const view of runtime.list()) {
      const plugin = runtime.getPlugin(view.id);
      const fn = plugin?.probe;
      if (typeof fn !== "function") continue;
      try {
        perPlugin[view.id] = {
          enabled: view.enabled,
          state: view.state,
          needsRestart: view.needsRestart,
          report: fn.call(plugin)
        };
      } catch (err) {
        perPlugin[view.id] = {
          enabled: view.enabled,
          state: view.state,
          probeError: String(err)
        };
      }
    }
    const out = {
      version: true ? "0.6.5" : "dev",
      build: true ? "2026-08-31 14:26:25" : "dev",
      href: (() => {
        try {
          return location.pathname;
        } catch {
          return null;
        }
      })(),
      plugins: perPlugin,
      patches: getSourcePatchReport()
    };
    try {
      globalThis.__halcyonProbe = JSON.stringify(out, null, 2);
      log37.info("probe \u5DF2\u751F\u6210 \u2014\u2014 \u5728\u63A7\u5236\u53F0\u8FD0\u884C  copy(__halcyonProbe)  \u7136\u540E\u628A\u5185\u5BB9\u8D34\u56DE\u6765");
    } catch {
    }
    return out;
  }

  // src/userscript/main.ts
  var log38 = logger("userscript");
  runtime.registerAll(plugins);
  runtime.boot().then(() => {
    injectStyles();
    try {
      globalThis.HalcyonAPI = {
        open: openSettings,
        close: closeSettings,
        runtime,
        patchReport: () => getSourcePatchReport(),
        dumpSource: (needle, radius) => dumpFactorySource(needle, radius),
        diagnose: () => diagnoseSettings(),
        probe
      };
    } catch {
    }
    log38.info("Halcyon (userscript) ready \u2014 press Ctrl/Cmd+Shift+H to open settings");
  }).catch((err) => log38.error("userscript boot failed", err));
})();
