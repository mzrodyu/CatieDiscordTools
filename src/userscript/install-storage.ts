// Captured-early localStorage backend for the userscript build.
//
// Discord's web bundle removes `window.localStorage` shortly after boot. The
// userscript runs at document-start, ahead of that, so a reference captured
// here keeps working for the whole session. We hand it to the settings layer
// as the native backend; this module must be imported before anything that
// touches settings, so the entry imports it first.

const g = globalThis as any;

try {
  const ls: Storage | undefined = g.localStorage;
  if (ls) {
    const native: Record<string, unknown> = (g.HalcyonNative ??= {});
    native.storage = {
      read: (key: string) => ls.getItem(key),
      write: (key: string, value: string) => ls.setItem(key, value),
      remove: (key: string) => ls.removeItem(key)
    };
  }
} catch {
  // The settings layer degrades to its in-memory backend on its own.
}

export {};
