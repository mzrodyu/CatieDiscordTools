// ==UserScript==
// @name         Halcyon for Discord
// @namespace    halcyon
// @version      0.1.9
// @description  A restrained, iOS-styled plugin layer for the Discord web client.
// @author       caitemm (mzrodyu)
// @match        *://*.discord.com/*
// @run-at       document-start
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==

"use strict";
var Halcyon = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/core/logger/index.ts
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
  var WEIGHT, BADGE, RING_CAPACITY, ring, subscribers, threshold;
  var init_logger = __esm({
    "src/core/logger/index.ts"() {
      "use strict";
      init_react_shim();
      WEIGHT = {
        debug: 10,
        info: 20,
        warn: 30,
        error: 40
      };
      BADGE = {
        debug: "#8E8E93",
        info: "#0A84FF",
        warn: "#FF9F0A",
        error: "#FF453A"
      };
      RING_CAPACITY = 500;
      ring = [];
      subscribers = /* @__PURE__ */ new Set();
      threshold = false ? WEIGHT.debug : WEIGHT.info;
    }
  });

  // src/core/modules/webpack.ts
  function setSelfResolver(fn) {
    selfResolver = fn;
    globalThis.__halcyon_self__ = (id) => selfResolver(id);
  }
  function registerSourcePatch(patch) {
    sourcePatches.push({ ...patch, applied: false, hits: 0 });
  }
  function getSourcePatchReport() {
    return sourcePatches.map(({ pluginId, label, applied, hits }) => ({ pluginId, label, applied, hits }));
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
      }
    ]);
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
    const applicable = sourcePatches.filter((p) => sourceMatches(p.find, original));
    const effective = applicable.length ? applyPatches(id, original, applicable) : original;
    const wrapped = function(module, exports, require2) {
      effective.call(this, module, exports, require2);
      try {
        dispatchToWaiters(module);
      } catch (err) {
        log.error("module observer threw for", id, err);
      }
    };
    wrapped.toString = () => effective.toString();
    wrapped.__halcyon__ = true;
    return wrapped;
  }
  function applyPatches(id, original, patches) {
    let code = String(original);
    for (const patch of patches) {
      const before = code;
      const replacement = bindSelf(patch.replace, patch.pluginId);
      code = patch.all ? code.replace(new RegExp(patch.match.source, ensureGlobal(patch.match.flags)), replacement) : code.replace(patch.match, replacement);
      if (code === before) {
        log.warn(`patch "${patch.label}" (${patch.pluginId}) matched module ${id} but changed nothing`);
        continue;
      }
      patch.applied = true;
      patch.hits++;
      log.debug(`applied patch "${patch.label}" (${patch.pluginId}) to module ${id}`);
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
  function findStore(name) {
    return find((exp) => exp?.getName?.() === name || exp?.constructor?.displayName === name);
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
    return exp != null && typeof exp.dispatch === "function" && typeof exp.subscribe === "function" && (typeof exp._actionHandlers !== "undefined" || typeof exp._subscriptions !== "undefined" || typeof exp._waitQueue !== "undefined" || typeof exp.isDispatching === "function" || typeof exp.wait === "function");
  }
  function dumpFactorySource(needle, radius = 300) {
    const factories = wpRequire?.m;
    if (!factories) return "<webpack require not ready \u2014 open the target UI first>";
    const blocks = [];
    for (const id of Object.keys(factories)) {
      let src;
      try {
        src = String(factories[id]);
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
      blocks.push(`===== module ${id} (${hits} hit${hits === 1 ? "" : "s"}) =====
${slices.join("\n  ...  \n")}`);
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
  var log, CHUNK_KEY, wpRequire, ready, interceptorInstalled, waiters, sourcePatches, selfResolver, NESTED_SCAN_MAX_KEYS;
  var init_webpack = __esm({
    "src/core/modules/webpack.ts"() {
      "use strict";
      init_react_shim();
      init_logger();
      log = logger("modules");
      CHUNK_KEY = "webpackChunkdiscord_app";
      ready = false;
      interceptorInstalled = false;
      waiters = /* @__PURE__ */ new Set();
      sourcePatches = [];
      selfResolver = () => void 0;
      NESTED_SCAN_MAX_KEYS = 40;
    }
  });

  // src/core/common/react.ts
  function lazyProxy(resolve) {
    let cached;
    const get = () => cached ??= resolve();
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
  var React, ReactDOM, useState, useEffect, useMemo, useRef;
  var init_react = __esm({
    "src/core/common/react.ts"() {
      "use strict";
      init_react_shim();
      init_webpack();
      React = lazyProxy(
        () => find(byFunctionProps("createElement", "useState", "useEffect", "useMemo"))
      );
      ReactDOM = lazyProxy(
        () => find(byFunctionProps("createPortal", "flushSync")) ?? find(byFunctionProps("createPortal"))
      );
      useState = (...a) => React.useState(...a);
      useEffect = (...a) => React.useEffect(...a);
      useMemo = (...a) => React.useMemo(...a);
      useRef = (...a) => React.useRef(...a);
    }
  });

  // src/runtime/react-shim.ts
  var init_react_shim = __esm({
    "src/runtime/react-shim.ts"() {
      "use strict";
      init_react();
    }
  });

  // src/core/common/discord.ts
  var discord_exports = {};
  __export(discord_exports, {
    ChannelStore: () => ChannelStore,
    Dispatcher: () => Dispatcher,
    GuildChannelStore: () => GuildChannelStore,
    GuildStore: () => GuildStore,
    GuildSubscriptions: () => GuildSubscriptions,
    MessageActions: () => MessageActions,
    MessageStore: () => MessageStore,
    SelectedChannelStore: () => SelectedChannelStore,
    UserStore: () => UserStore,
    getDispatcher: () => getDispatcher,
    moment: () => moment
  });
  function getDispatcher() {
    try {
      const viaStore = UserStore?._dispatcher;
      if (isFluxDispatcher(viaStore)) return viaStore;
    } catch {
    }
    return find(isFluxDispatcher);
  }
  var Dispatcher, MessageStore, MessageActions, UserStore, ChannelStore, SelectedChannelStore, GuildStore, GuildChannelStore, GuildSubscriptions, moment;
  var init_discord = __esm({
    "src/core/common/discord.ts"() {
      "use strict";
      init_react_shim();
      init_webpack();
      Dispatcher = lazy(isFluxDispatcher);
      MessageStore = lazy(
        (m) => typeof m?.getMessage === "function" && typeof m?.getMessages === "function"
      );
      MessageActions = lazy(
        (m) => typeof m?.editMessage === "function" && typeof m?.deleteMessage === "function"
      );
      UserStore = lazy(
        (m) => typeof m?.getCurrentUser === "function" && typeof m?.getUser === "function"
      );
      ChannelStore = lazy(
        (m) => m?.getName?.() === "ChannelStore" || m?.constructor?.displayName === "ChannelStore"
      );
      SelectedChannelStore = lazy(
        (m) => typeof m?.getChannelId === "function" && typeof m?.getLastSelectedChannelId === "function"
      );
      GuildStore = lazy(
        (m) => m?.getName?.() === "GuildStore" || m?.constructor?.displayName === "GuildStore"
      );
      GuildChannelStore = lazy(
        (m) => typeof m?.getChannels === "function" && typeof m?.getDefaultChannel === "function"
      );
      GuildSubscriptions = lazy(
        (m) => typeof m?.subscribeToGuild === "function" || typeof m?.subscribeToChannel === "function"
      );
      moment = lazy((m) => typeof m === "function" && typeof m?.locale === "function" && typeof m?.utc === "function");
    }
  });

  // src/userscript/main.ts
  init_react_shim();

  // src/userscript/install-storage.ts
  init_react_shim();
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

  // src/core/runtime.ts
  init_react_shim();
  init_logger();
  init_webpack();

  // src/core/settings/storage.ts
  init_react_shim();
  init_logger();
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
      this.enabledMap = loadNamespace(ENABLED_NS) ?? {};
      this.registerBootPatches();
      installChunkInterceptor();
    }
    /** Boot sequence. Call once, as early as the renderer allows. */
    async boot() {
      if (this.booted) return;
      this.booted = true;
      this.prepare();
      this.enabledMap = loadNamespace(ENABLED_NS) ?? {};
      for (const { plugin } of this.records.values()) {
        plugin.settings?.__bind(plugin.id);
      }
      this.registerBootPatches();
      await awaitCoreReady();
      for (const id of this.startOrder()) {
        if (this.shouldRun(id)) this.startPlugin(id);
      }
      this.emit();
      const build = true ? "2026-07-19 23:59:31" : "dev";
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

  // src/plugins/index.ts
  init_react_shim();

  // src/plugins/settings-host/index.tsx
  init_react_shim();

  // src/core/plugin.ts
  init_react_shim();
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

  // src/plugins/settings-host/index.tsx
  init_logger();
  init_webpack();

  // src/ui/inject-styles.ts
  init_react_shim();

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

/* Look: badge \u2014 pill-shaped chip. */
.hc-deleted-marker--badge {
  display: inline-flex;
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

  // src/ui/settings/overlay.tsx
  init_react_shim();
  init_react();
  init_logger();

  // src/ui/settings/SettingsRoot.tsx
  init_react_shim();
  init_react();

  // src/icons/index.tsx
  init_react_shim();
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

  // src/ui/settings/PluginsView.tsx
  init_react_shim();
  init_react();

  // src/ui/components/Toggle.tsx
  init_react_shim();
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
  init_react_shim();
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
  init_react_shim();
  function Badge({ tone = "neutral", children }) {
    return /* @__PURE__ */ React.createElement("span", { className: "hc-badge", "data-tone": tone }, children);
  }

  // src/ui/components/EmptyState.tsx
  init_react_shim();
  function EmptyState({ icon, title, subtitle, action }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-empty" }, icon, /* @__PURE__ */ React.createElement("div", { className: "hc-empty__title" }, title), subtitle && /* @__PURE__ */ React.createElement("div", { className: "hc-empty__subtitle" }, subtitle), action && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "var(--hc-space-5)" } }, action));
  }

  // src/ui/settings/SettingsForm.tsx
  init_react_shim();
  init_react();

  // src/ui/components/NumberStepper.tsx
  init_react_shim();
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
  init_react_shim();
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
  init_react_shim();
  init_react();
  init_react();
  function Select({ value, options, onChange, ...rest }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
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
    const onKeyDown2 = (e) => {
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
        if (active >= 0 && active < options.length) pick(options[active].value);
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "hc-select", ref: rootRef, onKeyDown: onKeyDown2 }, /* @__PURE__ */ React.createElement(
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
          onKeyDown: onKeyDown2
        },
        /* @__PURE__ */ React.createElement("div", { className: "hc-select__menu", role: "listbox", style: { minWidth: menuPos.width } }, options.map((opt, index) => /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            key: opt.value,
            role: "option",
            "aria-selected": opt.value === value,
            className: "hc-select__option",
            "data-active": index === active,
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
  init_react_shim();
  init_react();
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
  init_react_shim();
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
  init_react_shim();
  init_react();
  function useRuntimeList() {
    const [list, setList] = useState(() => runtime.list());
    useEffect(() => {
      const refresh = () => setList(runtime.list());
      refresh();
      return runtime.onChange(refresh);
    }, []);
    return list;
  }
  function useSettingsSnapshot(settings5) {
    const [, bump] = useState(0);
    useEffect(() => {
      const unsubscribes = Object.keys(settings5.schema).map(
        (key) => settings5.subscribe(key, () => bump((n) => n + 1))
      );
      return () => {
        for (const off of unsubscribes) off();
      };
    }, [settings5]);
    return settings5.store;
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
  function SettingsForm({ settings: settings5 }) {
    const store = useSettingsSnapshot(settings5);
    const keys = useMemo(
      () => Object.keys(settings5.schema).filter((key) => !settings5.schema[key].hidden),
      [settings5]
    );
    const [draft, setDraft] = useState(() => seed(store, keys));
    useEffect(() => {
      setDraft(seed(store, keys));
    }, [settings5]);
    if (keys.length === 0) return null;
    const dirty = keys.filter((key) => !equal(draft[key], store[key]));
    const save = () => {
      for (const key of dirty) store[key] = clone(draft[key]);
    };
    const discard = () => setDraft(seed(store, keys));
    const sections = [];
    for (const key of keys) {
      const title = settings5.schema[key].group ?? "\u8BBE\u7F6E";
      const last = sections[sections.length - 1];
      if (last && last.title === title) last.keys.push(key);
      else sections.push({ title, keys: [key] });
    }
    return /* @__PURE__ */ React.createElement(React.Fragment, null, sections.map((section, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-section", key: `${section.title}-${index}` }, /* @__PURE__ */ React.createElement("div", { className: "hc-section__title" }, section.title), /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, section.keys.map((key) => /* @__PURE__ */ React.createElement(
      SettingField,
      {
        key,
        def: settings5.schema[key],
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
  init_react_shim();
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
  function PluginsView() {
    const plugins2 = useRuntimeList().filter((p) => !p.hidden);
    const [selectedId, setSelectedId] = useState(null);
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
  init_react_shim();
  init_react();
  init_logger();
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

  // src/ui/settings/AboutView.tsx
  init_react_shim();

  // src/ui/components/Section.tsx
  init_react_shim();
  function Section({ title, note, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-section" }, title && /* @__PURE__ */ React.createElement("div", { className: "hc-section__title" }, title), /* @__PURE__ */ React.createElement("div", { className: "hc-section__body" }, children), note && /* @__PURE__ */ React.createElement("div", { className: "hc-section__note" }, note));
  }

  // src/ui/settings/AboutView.tsx
  function AboutView() {
    const plugins2 = useRuntimeList().filter((p) => !p.hidden);
    const enabled = plugins2.filter((p) => p.enabled).length;
    const version = true ? "0.1.9" : "dev";
    return /* @__PURE__ */ React.createElement("div", { className: "hc-stack" }, /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero" }, /* @__PURE__ */ React.createElement(HalcyonMark, { size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero__name" }, "Halcyon"), /* @__PURE__ */ React.createElement("div", { className: "hc-about-hero__ver" }, "\u7248\u672C ", version))), /* @__PURE__ */ React.createElement(Section, { title: "\u6982\u89C8" }, /* @__PURE__ */ React.createElement(AboutRow, { label: "\u63D2\u4EF6\u603B\u6570", value: String(plugins2.length) }), /* @__PURE__ */ React.createElement(AboutRow, { label: "\u5DF2\u542F\u7528", value: String(enabled) })), /* @__PURE__ */ React.createElement(
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
  function renderView(tab) {
    switch (tab) {
      case "plugins":
        return /* @__PURE__ */ React.createElement(PluginsView, null);
      case "logs":
        return /* @__PURE__ */ React.createElement(LogsView, null);
      case "about":
        return /* @__PURE__ */ React.createElement(AboutView, null);
    }
  }
  function SettingsRoot({ onClose }) {
    const [tab, setTab] = useState("plugins");
    const active = TABS.find((t) => t.id === tab) ?? TABS[0];
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
    ))), /* @__PURE__ */ React.createElement("section", { className: "hc-panel__content" }, /* @__PURE__ */ React.createElement("header", { className: "hc-panel__header" }, /* @__PURE__ */ React.createElement("span", { className: "hc-title2" }, active.title), onClose && /* @__PURE__ */ React.createElement("button", { type: "button", className: "hc-iconbtn", onClick: onClose, "aria-label": "\u5173\u95ED" }, /* @__PURE__ */ React.createElement(XmarkIcon, { size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "hc-panel__scroll" }, renderView(tab))));
  }
  function EmbeddedView({ tab }) {
    return /* @__PURE__ */ React.createElement("div", { className: "halcyon hc-embed" }, renderView(tab));
  }

  // src/ui/settings/overlay.tsx
  var log4 = logger("settings");
  var host = null;
  var keyHandler = null;
  function openSettings() {
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
      ReactDOM.render(React.createElement(Overlay, { onClose: closeSettings }), host);
    } catch (err) {
      log4.error("could not open settings overlay", err);
      closeSettings();
    }
  }
  function closeSettings() {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (host) {
      try {
        ReactDOM.unmountComponentAtNode(host);
      } catch {
      }
      host.remove();
      host = null;
    }
  }
  function Overlay({ onClose }) {
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
      /* @__PURE__ */ React.createElement(SettingsRoot, { onClose })
    );
  }

  // src/plugins/settings-host/index.tsx
  var log5 = logger("settings-host");
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
      log5.warn("could not resolve settings layout types; using fallback values", err);
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
      log5.warn("could not read layout types from the live tree; using fallbacks", err);
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
      log5.info(
        "[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back."
      );
    } catch (err) {
      log5.warn("[embed-probe] failed to capture layout shape", err);
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
        log5.info(`native settings embed active \u2014 section inserted at index ${index}/${layout.length}`);
        return layout;
      } catch (err) {
        log5.error("failed to inject settings section into layout", err);
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
          log5.info(`native settings embed active (legacy) \u2014 ${sections.length} base sections`);
        }
        return out;
      } catch (err) {
        log5.error("failed to inject settings sections", err);
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
      log5.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H");
    },
    stop() {
      if (onKeyDown) {
        window.removeEventListener("keydown", onKeyDown);
        onKeyDown = null;
      }
      closeSettings();
    }
  });

  // src/plugins/message-logger/index.tsx
  init_react_shim();

  // src/core/patcher/index.ts
  init_react_shim();
  init_logger();
  var log6 = logger("patcher");
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
          log6.error(`before-hook on "${method}" threw`, err);
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
            log6.error(`instead-hook on "${method}" threw; falling back to original`, err);
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
          log6.error(`after-hook on "${method}" threw`, err);
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
      log6.error(`refusing to patch "${method}" on a null target`);
      return () => {
      };
    }
    let hooks;
    try {
      hooks = ensureInstalled(target, method);
    } catch (err) {
      log6.error(err);
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

  // src/plugins/message-logger/index.tsx
  init_webpack();
  init_discord();
  init_react();
  init_logger();

  // src/plugins/message-logger/settings.ts
  init_react_shim();

  // src/core/settings/index.ts
  init_react_shim();
  init_logger();

  // src/core/settings/types.ts
  init_react_shim();

  // src/core/settings/index.ts
  var log7 = logger("settings");
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
          log7.error(`settings listener for "${key}" threw`, err);
        }
      }
    };
    const store = new Proxy(values, {
      get: (target, key) => target[key],
      set: (target, key, value) => {
        if (!(key in schema)) {
          log7.warn(`ignoring write to unknown setting "${key}"`);
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
  init_react_shim();
  init_logger();
  var log8 = logger("message-logger");
  var DATA_NS = "message-logger.log";
  var MessageLogStore = class {
    deleted = [];
    edited = [];
    retention = 50;
    listeners = /* @__PURE__ */ new Set();
    saveTimer;
    /** `${channelId}:${id}` of every deleted entry — for per-render lookups. */
    deletedIndex = /* @__PURE__ */ new Set();
    /** Load persisted history. Safe to call before the first record. */
    load() {
      const raw = loadNamespace(DATA_NS);
      this.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
      this.edited = Array.isArray(raw.edited) ? raw.edited : [];
      this.trimDeleted();
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
      this.retention = Math.max(0, n | 0);
      this.trimDeleted();
      this.reindex();
      this.scheduleSave();
      this.emit();
    }
    recordDeleted(entry) {
      if (this.deleted.some((d) => d.id === entry.id)) return;
      this.deleted.unshift(entry);
      this.trimDeleted();
      this.reindex();
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
    clear() {
      this.deleted = [];
      this.edited = [];
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
    /** Flush any pending save immediately (used on plugin stop). */
    flush() {
      if (this.saveTimer !== void 0) {
        clearTimeout(this.saveTimer);
        this.saveTimer = void 0;
      }
      this.save();
    }
    // --- internals -----------------------------------------------------------
    trimDeleted() {
      if (this.retention <= 0) return;
      const perChannel = /* @__PURE__ */ new Map();
      this.deleted = this.deleted.filter((d) => {
        const seen = perChannel.get(d.channelId) ?? 0;
        if (seen >= this.retention) return false;
        perChannel.set(d.channelId, seen + 1);
        return true;
      });
    }
    reindex() {
      this.deletedIndex = new Set(this.deleted.map((d) => `${d.channelId}:${d.id}`));
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
      if (this.saveTimer !== void 0) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(), 500);
    }
    save() {
      try {
        saveNamespace(DATA_NS, { deleted: this.deleted, edited: this.edited });
      } catch (err) {
        log8.error("failed to persist message log", err);
      }
    }
  };
  var messageLog = new MessageLogStore();

  // src/plugins/message-logger/render-content.tsx
  init_react_shim();
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
            src: `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}`,
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
  init_react_shim();
  init_react();
  init_discord();
  init_logger();
  var log9 = logger("message-logger");
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
  function LogPage() {
    const { deleted, edited } = useLog();
    const [tab, setTab] = useState("deleted");
    const [pages, setPages] = useState({ deleted: 0, edited: 0 });
    const entries = tab === "deleted" ? deleted : edited;
    const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE2));
    const page = Math.min(pages[tab], pageCount - 1);
    const visible = entries.slice(page * PAGE_SIZE2, (page + 1) * PAGE_SIZE2);
    const goTo = (next) => setPages((prev) => ({ ...prev, [tab]: Math.max(0, Math.min(pageCount - 1, next)) }));
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "hc-tabs" }, /* @__PURE__ */ React.createElement(
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
        onClick: () => messageLog.clear(),
        disabled: entries.length === 0
      },
      "\u6E05\u7A7A"
    )), entries.length === 0 ? tab === "deleted" ? /* @__PURE__ */ React.createElement(
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
  function DeletedRow({ entry }) {
    return /* @__PURE__ */ React.createElement("div", { className: "hc-msg" }, /* @__PURE__ */ React.createElement("div", { className: "hc-msg__head" }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__author" }, entry.author.name), entry.author.bot && /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, "BOT"), /* @__PURE__ */ React.createElement(Location, { channelId: entry.channelId, guildId: entry.guildId }), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__time" }, formatTime2(entry.deletedAt))), /* @__PURE__ */ React.createElement("div", { className: "hc-msg__body" }, entry.content ? renderContent(entry.content) : entry.stickers?.length ? /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A", entry.stickers.map((s) => s.name).join("\u3001")) : entry.attachmentsRich?.length || entry.embeds?.length ? /* @__PURE__ */ React.createElement("span", null, "\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F") : /* @__PURE__ */ React.createElement("span", { className: "hc-msg__empty" }, "\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")), (entry.attachmentsRich?.length ?? 0) > 0 && /* @__PURE__ */ React.createElement("div", { className: "hc-msg__media" }, entry.attachmentsRich.map(
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
    return /* @__PURE__ */ React.createElement("div", { className: "hc-msg" }, /* @__PURE__ */ React.createElement("div", { className: "hc-msg__head" }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__author" }, entry.author.name), /* @__PURE__ */ React.createElement(Location, { channelId: entry.channelId, guildId: entry.guildId }), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__time" }, formatTime2(entry.updatedAt))), /* @__PURE__ */ React.createElement("div", { className: "hc-msg__versions" }, entry.history.map((version, index) => /* @__PURE__ */ React.createElement("div", { className: "hc-msg__version", key: index }, /* @__PURE__ */ React.createElement("span", { className: "hc-msg__vtag" }, "v", index + 1), /* @__PURE__ */ React.createElement("span", { className: "hc-msg__vbody" }, version.content ? renderContent(version.content) : "\uFF08\u7A7A\uFF09")))));
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
  function formatTime2(time) {
    const date = new Date(time);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function exportLog() {
    try {
      const blob = new Blob([messageLog.toJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `halcyon-message-log-${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      log9.error("export failed", err);
    }
  }

  // src/plugins/message-logger/index.tsx
  var log10 = logger("message-logger");
  var unpatchDispatch;
  var unsubscribeRetention;
  var unsubscribeDeleteStyle;
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
  function currentUserId() {
    try {
      return UserStore.getCurrentUser?.()?.id;
    } catch {
      return void 0;
    }
  }
  function isIgnored(channelId, author) {
    const s = settings.store;
    if (channelId && s.ignoredChannels.includes(channelId)) return true;
    if (author?.id && s.ignoredUsers.includes(author.id)) return true;
    if (s.ignoreBots && author?.bot) return true;
    if (s.ignoreSelf && author?.id && author.id === currentUserId()) return true;
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
  function captureDelete(channelId, id) {
    if (!channelId || !id) return;
    const message = readMessage(channelId, id);
    const snap = shadow.get(`${channelId}:${id}`);
    if (!message && !snap) {
      log10.debug(`delete of ${id} skipped: message not in cache or shadow`);
      return;
    }
    const author = message?.author ?? snap?.author ?? {};
    if (isIgnored(channelId, author)) return;
    const content = typeof message?.content === "string" && message.content !== "" ? message.content : snap?.content ?? "";
    const attachments = message ? attachmentsOf(message) : snap?.attachments ?? [];
    const liveRich = message ? richAttachmentsOf(message) : [];
    const attachmentsRich = liveRich.length ? liveRich : snap?.attachmentsRich ?? [];
    const liveEmbeds = message ? embedsOf(message) : [];
    const embeds = liveEmbeds.length ? liveEmbeds : snap?.embeds ?? [];
    const liveStickers = message ? stickersOf(message) : [];
    const stickers = liveStickers.length ? liveStickers : snap?.stickers ?? [];
    if (!content && attachments.length === 0 && attachmentsRich.length === 0 && embeds.length === 0 && stickers.length === 0) return;
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
      log10.debug(`edit to ${id} skipped: no prior content known (message predates the recorder)`);
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
    return {
      id: entry.id,
      type: 0,
      channel_id: entry.channelId,
      guild_id: entry.guildId,
      sticker_items: entry.stickers?.length ? entry.stickers : void 0,
      content: entry.content || (attachments.length === 0 && entry.attachments.length ? `\u{1F4CE} ${entry.attachments.join(", ")}` : ""),
      author: {
        id: entry.author.id,
        username: entry.author.name,
        global_name: entry.author.name,
        discriminator: "0000",
        bot: entry.author.bot,
        avatar: null
      },
      timestamp: new Date(entry.sentAt).toISOString(),
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
    for (const m of msgs) {
      const id = m?.id != null ? String(m.id) : void 0;
      if (id && (minId === void 0 || compareIds(id, minId) < 0)) minId = id;
    }
    const revived = mine.filter(
      (d) => !present.has(d.id) && (minId === void 0 || compareIds(d.id, minId) >= 0) && // Respect the ignore rules at revive time too, so toggling "屏蔽机器人"
      // or "屏蔽自己" takes effect for already-recorded messages on reload.
      !isIgnored(channelId, d.author)
    );
    if (!revived.length) return;
    const descending = msgs.length >= 2 ? compareIds(String(msgs[0].id), String(msgs[msgs.length - 1].id)) > 0 : true;
    msgs.push(...revived.map(entryToRaw));
    msgs.sort((a, b) => {
      const c = compareIds(String(a?.id ?? "0"), String(b?.id ?? "0"));
      return descending ? -c : c;
    });
    log10.info(`revived ${revived.length} deleted message(s) into ${channelId}`);
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
        log10.error("failed to revive deleted messages on channel load", err);
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
        log10.info(`recorder saw its first ${type}`);
      }
    } catch (err) {
      log10.error("recorder failed for", type, err);
    }
  }
  function onDispatch(ctx) {
    onAction(ctx.args[0]);
  }
  var WATCHED = ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK", "LOAD_MESSAGES_SUCCESS"];
  function attachRecorder(dispatcher, tag) {
    const undo = [];
    const seams = [];
    if (typeof dispatcher.addInterceptor === "function") {
      try {
        const interceptor = (action) => {
          onAction(action);
          return false;
        };
        dispatcher.addInterceptor(interceptor);
        undo.push(() => {
          const list = dispatcher._interceptors;
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
      if (typeof dispatcher[method] === "function") {
        try {
          undo.push(patcher.before(dispatcher, method, onDispatch));
          seams.push(method);
        } catch {
        }
        break;
      }
    }
    if (typeof dispatcher.subscribe === "function") {
      try {
        const handler = (action) => onAction(action);
        for (const type of WATCHED) dispatcher.subscribe(type, handler);
        undo.push(() => {
          if (typeof dispatcher.unsubscribe === "function") {
            for (const type of WATCHED) {
              try {
                dispatcher.unsubscribe(type, handler);
              } catch {
              }
            }
          }
        });
        seams.push("subscribe");
      } catch {
      }
    }
    log10.info(`recorder on dispatcher ${tag}: seams [${seams.join(", ") || "none"}]`);
    return () => undo.forEach((u) => u());
  }
  function attachRecorderEverywhere() {
    const hooked = /* @__PURE__ */ new Set();
    const undo = [];
    const sweep = () => {
      const candidates = [...findAll(isFluxDispatcher), getDispatcher()].filter(Boolean);
      let added = 0;
      for (const d of candidates) {
        if (hooked.has(d)) continue;
        hooked.add(d);
        undo.push(attachRecorder(d, `#${hooked.size}`));
        added++;
      }
      return added;
    };
    const first = sweep();
    log10.info(`recorder attached to ${first} dispatcher instance(s)`);
    const timer2 = setInterval(() => {
      const added = sweep();
      if (added > 0) log10.info(`recorder attached to ${added} late dispatcher instance(s)`);
    }, 5e3);
    const stopTimer = setTimeout(() => clearInterval(timer2), 6e4);
    return () => {
      clearInterval(timer2);
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
  function MessageExtras(props) {
    useMlogSettings();
    const s = settings.store;
    const nodes = [];
    if (s.logEdits && props.history && props.history.length > 0) {
      nodes.push(
        /* @__PURE__ */ React.createElement("div", { className: "hc-edit-history", key: "hc-edit-history" }, props.history.map((version, index) => {
          const time = formatDeletedAt(version.at, "time");
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `hc-edit-history__version hc-edit-history__version--${s.deleteStyle || "tint"}`,
              key: index
            },
            renderContent(version.content),
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
    const missed = mine.filter((p) => !p.applied);
    if (missed.length === 0) {
      log10.info("in-chat patches applied");
    } else {
      log10.warn(
        "some in-chat patches did not match this Discord build; deleted messages are still captured on the plugin page, but will not be kept inline. Unmatched: " + missed.map((p) => `"${p.label}"`).join(", ")
      );
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
    patches: [
      {
        // The message store drops records when it handles MESSAGE_DELETE /
        // MESSAGE_DELETE_BULK. Instead of letting it, rebuild the channel cache
        // ourselves — kept messages are re-committed with `deleted: true` (which
        // triggers the re-render the tint patches key off), everything else is
        // removed exactly as the original would. The module is located by its
        // registered store name (a quoted string that survives minification —
        // handler keys don't, which is why the previous find never matched).
        label: "keep deleted message in store",
        find: '"MessageStore"',
        replacement: [
          {
            match: /(?<=MESSAGE_DELETE:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,
            replace: "let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!1);$2.commit(hcC);return;"
          },
          {
            match: /(?<=MESSAGE_DELETE_BULK:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,
            replace: "let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!0);$2.commit(hcC);return;"
          }
        ]
      },
      {
        // Base message row: append our class to the "li" so kept messages tint
        // red. The find string is a dev assertion that survives minification.
        label: "tint deleted message row (base)",
        find: "Message must not be a thread starter message",
        replacement: {
          match: /\)\("li",\{(.+?),className:/,
          replace: ')("li",{$1,className:($self.deletedClass(arguments[0])||"")+" "+'
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
      }
    ],
    start() {
      messageLog.load();
      messageLog.setRetention(settings.store.retention);
      unsubscribeRetention = settings.subscribe("retention", (next) => messageLog.setRetention(next));
      syncDeleteStyleClass();
      unsubscribeDeleteStyle = settings.subscribe("deleteStyle", syncDeleteStyleClass);
      unpatchDispatch = attachRecorderEverywhere();
      setTimeout(reportPatches, 4e3);
      setTimeout(() => {
        if (actionsSeen > 0) {
          log10.info(`recorder pulse OK \u2014 ${actionsSeen} message action(s) observed so far`);
        } else {
          log10.error(
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
      try {
        for (const s of DELETE_STYLE_CLASSES) document.documentElement?.classList.remove(`hc-mlog-${s}`);
      } catch {
      }
      messageLog.flush();
      log10.info("stopped");
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
    handleDelete(cache, action, isBulk) {
      try {
        if (cache == null) return cache;
        if (!isBulk && typeof cache.has === "function" && !cache.has(action.id)) return cache;
        const keepInChat = settings.store.keepDeletedInChat;
        const EPHEMERAL = 64;
        const mutate = (id) => {
          const msg = typeof cache.get === "function" ? cache.get(id) : void 0;
          if (!msg) return;
          const keep = keepInChat && !action.mlDeleted && (msg.flags & EPHEMERAL) !== EPHEMERAL && !isIgnored(String(action.channelId ?? action.channel_id ?? msg.channel_id ?? ""), msg.author ?? {});
          if (!keep) {
            cache = cache.remove(id);
          } else {
            cache = cache.update(id, (m) => m.set("deleted", true));
          }
        };
        if (isBulk) {
          for (const id of action.ids ?? []) mutate(id);
        } else {
          mutate(action.id);
        }
      } catch (err) {
        log10.error("handleDelete failed; messages removed normally", err);
      }
      return cache;
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
            isEdited
          }
        );
      } catch {
        return null;
      }
    }
  });

  // src/plugins/show-username/index.tsx
  init_react_shim();
  init_logger();
  var log11 = logger("show-username");
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
      log11.error("username render failed; falling back to the nick", err);
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
      log11.info("appending usernames to message headers");
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

  // src/plugins/guild-monitor/index.tsx
  init_react_shim();
  init_logger();

  // src/plugins/guild-monitor/settings.ts
  init_react_shim();
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
  init_react_shim();
  init_discord();
  init_logger();
  var log12 = logger("guild-monitor");
  var REFRESH_MS = 5 * 60 * 1e3;
  var timer;
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
      log12.debug(`could not read channels for guild ${guildId}`, err);
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
      log12.warn(`subscribe failed for guild ${guildId}`, err);
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
    log12.debug(`refreshed subscriptions for ${ids.length} guild(s)`);
  }
  function startSubscribing(resolver) {
    getGuildIds = resolver;
    stopSubscribing();
    if (!isSubscriptionSupported()) {
      log12.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");
      return;
    }
    pass();
    timer = setInterval(pass, REFRESH_MS);
  }
  function refreshNow() {
    if (timer) pass();
  }
  function stopSubscribing() {
    if (timer) {
      clearInterval(timer);
      timer = void 0;
    }
  }

  // src/plugins/guild-monitor/ui/MonitorPage.tsx
  init_react_shim();
  init_react();
  init_discord();
  init_webpack();
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
  var log13 = logger("guild-monitor");
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
      if (n > 0) log13.info(`monitoring ${n} guild(s)`);
    },
    stop() {
      stopSubscribing();
    }
  });

  // src/plugins/message-cleaner/index.tsx
  init_react_shim();
  init_logger();

  // src/plugins/message-cleaner/settings.ts
  init_react_shim();
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

  // src/plugins/message-cleaner/ui/CleanerPage.tsx
  init_react_shim();
  init_react();
  init_logger();

  // src/plugins/message-cleaner/cleaner.ts
  init_react_shim();
  init_discord();
  init_logger();
  var log14 = logger("message-cleaner");
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
  function currentUserId2() {
    try {
      return UserStore.getCurrentUser?.()?.id;
    } catch {
      return void 0;
    }
  }
  function currentTarget() {
    try {
      const raw = SelectedChannelStore.getChannelId?.();
      if (!raw) return null;
      const channelId = String(raw);
      const channel = ChannelStore.getChannel?.(channelId);
      const gid = channel?.guild_id ?? channel?.guildId;
      const guildId = gid ? String(gid) : "@me";
      return { guildId, channelId, serverWide: false };
    } catch {
      return null;
    }
  }
  function getGuilds() {
    try {
      const raw = GuildStore.getGuilds?.();
      if (!raw) return [];
      return Object.values(raw).map((g2) => ({
        id: g2.id,
        name: g2.name ?? "\u672A\u77E5",
        icon: g2.icon ?? null
      }));
    } catch {
      return [];
    }
  }
  function getChannels(guildId) {
    try {
      const all = [];
      const raw = ChannelStore.getMutableGuildChannelsForGuild?.(guildId);
      if (raw) {
        for (const ch of Object.values(raw)) {
          if (ch && ch.type !== 4) all.push({ id: ch.id, name: ch.name ?? "\u672A\u77E5", type: ch.type });
        }
      }
      if (all.length === 0) {
        try {
          const { GuildChannelStore: GuildChannelStore2 } = (init_discord(), __toCommonJS(discord_exports));
          const result = GuildChannelStore2?.getChannels?.(guildId);
          if (result) {
            for (const group of Object.values(result)) {
              if (!Array.isArray(group)) continue;
              for (const entry of group) {
                const ch = entry?.channel ?? entry;
                if (ch && ch.id && ch.type !== 4) {
                  all.push({ id: ch.id, name: ch.name ?? "\u672A\u77E5", type: ch.type ?? 0 });
                }
              }
            }
          }
        } catch {
        }
      }
      return all;
    } catch {
      return [];
    }
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
        log14.warn(`skip ${m.id}: ${e?.message ?? e}`);
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
  var log15 = logger("message-cleaner");
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
    const openPicker = () => {
      const guilds = getGuilds();
      setPickerGuilds([{ id: "@me", name: "\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)", icon: null }, ...guilds]);
      setPickerChannels([]);
      setPickerLevel("guilds");
      setPickerOpen(true);
    };
    const pickGuild = (g2) => {
      setGuildId(g2.id);
      if (g2.id === "@me") {
        setPickerOpen(false);
        progress("\u5DF2\u9009\u62E9\u79C1\u4FE1", "\u8BF7\u624B\u52A8\u586B\u5199\u79C1\u4FE1\u9891\u9053 ID\u3002");
        return;
      }
      setPickerGuildName(g2.name);
      const channels = getChannels(g2.id);
      setPickerChannels([{ id: "", name: "\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500", type: -1 }, ...channels]);
      setPickerLevel("channels");
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
      const meId = currentUserId2();
      if (!meId) {
        progress("\u5931\u8D25", "\u62FF\u4E0D\u5230\u5F53\u524D\u8D26\u53F7\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u767B\u5F55 Discord\u3002");
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
        log15.error("preview failed", err);
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
        log15.error("delete failed", err);
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
      const meId = currentUserId2();
      if (!meId) {
        progress("\u5931\u8D25", "\u62FF\u4E0D\u5230\u5F53\u524D\u8D26\u53F7\u3002");
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
      return /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner" }, /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-head" }, pickerLevel === "channels" && /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: () => setPickerLevel("guilds") }, "\u2190 \u8FD4\u56DE"), /* @__PURE__ */ React.createElement("span", { className: "hc-cleaner__picker-title" }, pickerLevel === "guilds" ? "\u9009\u62E9\u670D\u52A1\u5668" : pickerGuildName), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "plain", onClick: () => setPickerOpen(false) }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-list" }, pickerLevel === "guilds" ? pickerGuilds.map((g2) => /* @__PURE__ */ React.createElement(
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
      )) : pickerChannels.map((ch) => /* @__PURE__ */ React.createElement(
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
      )), pickerLevel === "channels" && pickerChannels.length <= 1 && /* @__PURE__ */ React.createElement("div", { className: "hc-cleaner__picker-empty" }, "\u6B64\u670D\u52A1\u5668\u6682\u65E0\u7F13\u5B58\u7684\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002")));
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
  var log16 = logger("message-cleaner");
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
      log16.info("message-cleaner ready");
    },
    stop() {
    }
  });

  // src/plugins/index.ts
  var plugins = [settings_host_default, message_logger_default, show_username_default, guild_monitor_default, message_cleaner_default];

  // src/userscript/main.ts
  init_webpack();
  init_logger();
  var log17 = logger("userscript");
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
        diagnose: () => diagnoseSettings()
      };
    } catch {
    }
    log17.info("Halcyon (userscript) ready \u2014 press Ctrl/Cmd+Shift+H to open settings");
  }).catch((err) => log17.error("userscript boot failed", err));
})();
