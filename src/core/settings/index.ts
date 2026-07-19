// Reactive settings.
//
// `defineSettings` turns a declarative schema into a live, persisted value
// store. Reads and writes go through a Proxy so `settings.store.foo = 1` both
// saves to disk and notifies subscribers. Persistence is deferred until the
// runtime calls `__bind(id)` with the owning plugin's id.

import { logger } from "../logger";
import { loadNamespace, saveNamespace } from "./storage";
import type { SettingsSchema, SettingsValues } from "./types";

export * from "./types";

const log = logger("settings");

export interface Settings<S extends SettingsSchema = SettingsSchema> {
  readonly schema: S;
  /** Live, persisted values. Assigning a property saves and notifies. */
  readonly store: SettingsValues<S>;
  /** Observe a single key. Returns an unsubscribe function. */
  subscribe<K extends keyof S & string>(
    key: K,
    listener: (newValue: SettingsValues<S>[K], oldValue: SettingsValues<S>[K]) => void
  ): () => void;
  /** Restore one key, or the whole schema, to its declared default. */
  reset(key?: keyof S & string): void;
}

/** The runtime-facing handle: `Settings` plus the private persistence binder. */
export interface BoundSettings<S extends SettingsSchema = SettingsSchema> extends Settings<S> {
  /** @internal Wire persistence to a namespace. Called once by the runtime. */
  __bind(pluginId: string): void;
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

export function defineSettings<S extends SettingsSchema>(schema: S): BoundSettings<S> {
  const listeners = new Map<string, Set<(next: any, prev: any) => void>>();
  let boundId: string | null = null;

  const values: Record<string, unknown> = {};
  for (const key of Object.keys(schema)) {
    values[key] = deepClone(schema[key].default);
  }

  const persist = (): void => {
    if (boundId) saveNamespace(boundId, values);
  };

  const notify = (key: string, next: unknown, prev: unknown): void => {
    const set = listeners.get(key);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(next, prev);
      } catch (err) {
        log.error(`settings listener for "${key}" threw`, err);
      }
    }
  };

  const store = new Proxy(values, {
    get: (target, key: string) => target[key],
    set: (target, key: string, value) => {
      if (!(key in schema)) {
        log.warn(`ignoring write to unknown setting "${key}"`);
        return true;
      }
      const prev = target[key];
      if (Object.is(prev, value)) return true;
      target[key] = value;
      persist();
      notify(key, value, prev);
      return true;
    }
  }) as SettingsValues<S>;

  return {
    schema,
    store,

    subscribe(key, listener) {
      const k = key as string;
      let set = listeners.get(k);
      if (!set) {
        set = new Set();
        listeners.set(k, set);
      }
      set.add(listener as (next: any, prev: any) => void);
      return () => void set!.delete(listener as (next: any, prev: any) => void);
    },

    reset(key) {
      if (key != null) {
        (store as Record<string, unknown>)[key as string] = deepClone(schema[key].default);
        return;
      }
      for (const k of Object.keys(schema)) {
        (store as Record<string, unknown>)[k] = deepClone(schema[k].default);
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
