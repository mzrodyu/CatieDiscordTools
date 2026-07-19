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
