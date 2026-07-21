// Main-world half of the browser extension's storage bridge.
//
// The Halcyon payload runs in the page's main world, where the chrome.* APIs
// are not available. An isolated content script (bridge.js) owns
// chrome.storage.local and communicates with us over window.postMessage.
//
// The settings layer reads and writes synchronously, but chrome.storage is
// async. To reconcile the two we keep a synchronous in-memory mirror here:
// it is hydrated once at startup, reads come straight from it, and writes go to
// the mirror immediately while also being forwarded for durable persistence.
//
// This module must be evaluated before the settings layer picks its backend,
// so the extension entry imports it first.

const FROM_MAIN = "halcyon:ext:main";
const FROM_BRIDGE = "halcyon:ext:bridge";

const mirror = new Map<string, string>();
let settled = false;
let markReady!: () => void;

// Outstanding privileged fetches, keyed by id so concurrent calls to the
// isolated bridge (which owns cross-origin fetch) never cross wires.
let fetchSeq = 0;
const pendingFetches = new Map<number, (text: string | null) => void>();

/**
 * Resolves once persisted values have been mirrored, or a short grace period has
 * elapsed. The entry awaits this before registering plugins so the first read
 * already sees saved values rather than defaults.
 */
export const bridgeReady: Promise<void> = new Promise((resolve) => {
  markReady = resolve;
});

function settle(): void {
  if (settled) return;
  settled = true;
  markReady();
}

function post(kind: string, extra?: Record<string, unknown>): void {
  try {
    window.postMessage({ channel: FROM_MAIN, kind, ...extra }, "*");
  } catch {
    // postMessage can throw on non-cloneable values; our payloads are plain.
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.channel !== FROM_BRIDGE) return;

  if (data.kind === "hydrate" && data.entries && typeof data.entries === "object") {
    for (const [key, value] of Object.entries(data.entries)) {
      if (typeof value === "string") mirror.set(key, value);
    }
    settle();
  } else if (data.kind === "fetch-result" && typeof data.id === "number") {
    const resolve = pendingFetches.get(data.id);
    if (resolve) {
      pendingFetches.delete(data.id);
      resolve(typeof data.text === "string" ? data.text : null);
    }
  }
});

const adapter = {
  read: (key: string): string | null => (mirror.has(key) ? mirror.get(key)! : null),
  write: (key: string, value: string): void => {
    mirror.set(key, value);
    post("write", { key, value });
  },
  remove: (key: string): void => {
    mirror.delete(key);
    post("remove", { key });
  }
};

const native: Record<string, unknown> = ((globalThis as any).HalcyonNative ??= {});
native.storage = adapter;

// Privileged text fetch. Resolves null on any failure (including timeout), so
// callers degrade quietly rather than throwing.
native.fetchText = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    const id = ++fetchSeq;
    pendingFetches.set(id, resolve);
    post("fetch", { id, url });
    setTimeout(() => {
      if (pendingFetches.delete(id)) resolve(null);
    }, 8000);
  });

// Kick off hydration. Ask now, and once more shortly after in case the isolated
// bridge had not attached its listener yet. Never hang: settle after a grace
// period regardless, degrading to defaults.
post("hydrate");
setTimeout(() => {
  if (!settled) post("hydrate");
}, 120);
setTimeout(settle, 2000);
