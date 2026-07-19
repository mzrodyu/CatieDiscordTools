// React glue between the runtime/settings stores and the settings screens.

import { useEffect, useState } from "../../core/common/react";
import { runtime, type PluginView } from "../../core/runtime";
import type { BoundSettings } from "../../core/settings";

/** Live plugin list that re-renders whenever the registry changes. */
export function useRuntimeList(): PluginView[] {
  const [list, setList] = useState<PluginView[]>(() => runtime.list());
  useEffect(() => {
    const refresh = () => setList(runtime.list());
    refresh();
    return runtime.onChange(refresh);
  }, []);
  return list;
}

/**
 * Subscribe to every key of a settings store and return the live value bag.
 * The store itself is the source of truth; this only forces re-render on write.
 */
export function useSettingsSnapshot(settings: BoundSettings): Record<string, unknown> {
  const [, bump] = useState(0);
  useEffect(() => {
    const unsubscribes = Object.keys(settings.schema).map((key) =>
      settings.subscribe(key as never, () => bump((n) => n + 1))
    );
    return () => {
      for (const off of unsubscribes) off();
    };
  }, [settings]);
  return settings.store as Record<string, unknown>;
}
