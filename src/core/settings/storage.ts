// Persistence backend for settings.
//
// Production builds get a disk-backed bridge from the preload script, exposed as
// `window.HalcyonNative.storage`. When that is absent (a browser test harness,
// or a build that skipped the preload) we degrade to the renderer's
// localStorage, and finally to an in-memory map so nothing crashes.

import { logger } from "../logger";

const log = logger("settings");

interface StorageBackend {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

const PREFIX = "halcyon:";

function selectBackend(): StorageBackend {
  const native = (globalThis as any).HalcyonNative?.storage as StorageBackend | undefined;
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
    // Some renderer contexts throw on localStorage access. Fall through.
  }

  log.warn("no persistent storage backend; settings will not survive a restart");
  const memory = new Map<string, string>();
  return {
    read: (k) => memory.get(k) ?? null,
    write: (k, v) => void memory.set(k, v),
    remove: (k) => void memory.delete(k)
  };
}

const backend = selectBackend();

/** Read one plugin's stored values. Returns an empty object when absent. */
export function loadNamespace(id: string): Record<string, unknown> {
  const raw = backend.read(PREFIX + id);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // Corrupt payload: keep a timestamped backup, then start from defaults.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    try {
      backend.write(`${PREFIX}${id}.corrupt-${stamp}`, raw);
    } catch {
      // If even the backup write fails there is nothing more to do.
    }
    log.warn(`stored settings for "${id}" were unreadable; reset to defaults (backup kept)`);
    return {};
  }
}

/** Persist one plugin's values as a whole. */
export function saveNamespace(id: string, values: Record<string, unknown>): void {
  try {
    backend.write(PREFIX + id, JSON.stringify(values));
  } catch (err) {
    log.error(`could not persist settings for "${id}"`, err);
  }
}

// --- synchronous hint side-channel ------------------------------------------
//
// A tiny, always-localStorage store that sits BESIDE the selected backend.
//
// Why it must exist: source patches have to be registered before Discord's
// Webpack executes the target module factories, and *which* patches to register
// depends on the plugin enable-map. In the browser extension the authoritative
// backend is an async chrome.storage mirror (see extension/install-storage-
// bridge.ts) that is still empty at prepare() time — so the enable-map reads
// blank and every optional patch-bearing plugin (fake-nitro among them) is
// skipped, its patches only registering later in boot(), long after the
// factories have already run unpatched. That is the whole "patch applied:false
// on every entry" failure.
//
// The fix: stash a synchronous copy of small, boot-critical state (the
// enable-map) straight in localStorage. The main-world payload runs at
// document_start and can read it the instant it starts, before Webpack.
//
// Discord strips window.localStorage a little way into its own boot (an
// anti-token-theft measure), so we capture a live handle at module load —
// document_start, before that removal — and keep using it afterwards; the
// underlying Storage object stays functional even once the window property is
// gone. Everything here is best-effort: any failure degrades to "no hint",
// which just means patches wait until boot() as they did before.

let hintStore: Storage | undefined;
try {
  hintStore = globalThis.localStorage;
} catch {
  hintStore = undefined;
}

const HINT_PREFIX = "halcyon:hint:";

/** Read a synchronous boot hint, or undefined when absent/unreadable. */
export function readSyncHint(id: string): Record<string, unknown> | undefined {
  try {
    if (!hintStore) return undefined;
    const raw = hintStore.getItem(HINT_PREFIX + id);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Persist a synchronous boot hint. Best-effort; never throws. */
export function writeSyncHint(id: string, values: Record<string, unknown>): void {
  try {
    if (!hintStore) return;
    hintStore.setItem(HINT_PREFIX + id, JSON.stringify(values));
  } catch {
    // best effort — a missing hint only costs a one-launch delay before
    // patch-bearing optional plugins take effect.
  }
}
