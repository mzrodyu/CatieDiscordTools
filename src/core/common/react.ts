// React access.
//
// Halcyon never bundles React. Discord already ships a copy, and using a second
// one would produce two reconciler instances that cannot share a tree. Instead
// we pull Discord's React out of the module graph on first use.
//
// Each export here is a lazy proxy: it resolves the underlying module the first
// time a property is touched, which is always after Discord has booted, never
// while our bundle is still loading.

import { find } from "../modules/webpack";

function lazyProxy<T extends object>(resolve: () => any): T {
  let cached: any;
  const get = () => (cached ??= resolve());

  return new Proxy(function () {} as unknown as T, {
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
    getOwnPropertyDescriptor: (_t, key) =>
      Reflect.getOwnPropertyDescriptor(get() ?? {}, key),
    apply: (_t, thisArg, args) => (get() as any).apply(thisArg, args),
    construct: (_t, args) => new (get() as any)(...args)
  }) as T;
}

/**
 * Whether an export is a genuine module, not an i18n message proxy. Discord's
 * intl `t` object is a Proxy that answers EVERY property access with a message
 * value, so a props-existence probe (`exp[p] !== undefined`) matches it for
 * any name list — including ("createElement", "useState", ...). Resolving React
 * through that proxy is what put `{locale, ast}` message objects into the tree
 * (React error #31: the settings crash). Two rejections:
 *   - the probed props must be functions, and
 *   - a name no real module exports must come back undefined; the answer-
 *     everything proxy fails this, whatever it returns.
 */
function byFunctionProps(...props: string[]) {
  return (exp: any) =>
    props.every((p) => typeof exp[p] === "function") &&
    typeof exp.__halcyon_probe__ === "undefined";
}

/** Discord's React instance. This is what compiled JSX resolves against. */
export const React = lazyProxy<typeof import("react")>(() =>
  find(byFunctionProps("createElement", "useState", "useEffect", "useMemo"))
);

/** A React 18/19 root handle, as returned by `createRoot`. */
export interface ReactRoot {
  render(element: unknown): void;
  unmount(): void;
}

/** The slice of ReactDOM we use. Kept local so react-dom types aren't a dep. */
interface ReactDOMApi {
  render(element: unknown, container: Element | DocumentFragment): void;
  unmountComponentAtNode(container: Element | DocumentFragment): boolean;
  createPortal(children: unknown, container: Element): unknown;
  flushSync?<T>(fn: () => T): T;
}

/** Discord's ReactDOM instance. */
export const ReactDOM = lazyProxy<ReactDOMApi>(
  () =>
    find(byFunctionProps("createPortal", "flushSync")) ??
    find(byFunctionProps("createPortal"))
);

/**
 * Resolve `createRoot` from Discord's react-dom/client. Modern React (18/19)
 * removed the legacy `ReactDOM.render(element, container)` entry point — React
 * 19 dropped it entirely — so mounting a detached tree (our settings overlay,
 * the emote-cloner picker) must go through `createRoot(container).render(...)`.
 *
 * Not merged into the ReactDOM proxy above because `createRoot` lives on a
 * different module (react-dom/client) than `createPortal`/`flushSync`. Returns
 * undefined on the rare build where it can't be found; callers fall back to the
 * legacy `render` path.
 */
export function getCreateRoot(): ((container: Element | DocumentFragment) => ReactRoot) | undefined {
  const mod =
    find(byFunctionProps("createRoot", "hydrateRoot")) ?? find(byFunctionProps("createRoot"));
  return mod?.createRoot?.bind(mod);
}

/**
 * Mount a React element into a freshly-created container using whichever API
 * this build supports: `createRoot` on React 18/19, else legacy
 * `ReactDOM.render`. Returns an `unmount` fn that undoes the mount the same way.
 */
export function mountDetached(element: unknown, container: Element): () => void {
  const createRoot = getCreateRoot();
  if (createRoot) {
    const root = createRoot(container);
    root.render(element);
    return () => {
      try {
        root.unmount();
      } catch {
        // already torn down
      }
    };
  }

  // Legacy fallback (React <18).
  (ReactDOM as any).render(element, container);
  return () => {
    try {
      (ReactDOM as any).unmountComponentAtNode(container);
    } catch {
      // already torn down
    }
  };
}

// --- fiber introspection ---------------------------------------------------
//
// React stores, on every DOM node it renders, a back-reference to the fiber that
// produced it. Reading it lets a plugin recover the data behind an element it
// only knows as a DOM node — the emoji record behind an <img>, the message
// behind a row — without patching anything and without relying on whatever
// attributes the current build happens to render. Everything here is
// best-effort: a build that renames the keys (or an element React never
// rendered) just yields null/empty, and callers fall back to the DOM.

/**
 * The React fiber attached to a DOM node. React 17+ uses
 * `__reactFiber$<random>`; older builds `__reactInternalInstance$<random>`.
 * These properties are non-enumerable, so Object.keys() misses them —
 * Object.getOwnPropertyNames() is required.
 */
export function getFiber(node: unknown): any {
  if (node == null || typeof node !== "object") return null;
  try {
    for (const key of Object.getOwnPropertyNames(node)) {
      if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
        return (node as any)[key];
      }
    }
  } catch {
    // exotic object; treat as "no fiber"
  }
  return null;
}

/** The props React rendered a DOM node with (`__reactProps$<random>`). */
export function getDomProps(node: unknown): any {
  if (node == null || typeof node !== "object") return null;
  try {
    for (const key of Object.getOwnPropertyNames(node)) {
      if (key.startsWith("__reactProps$")) return (node as any)[key];
    }
  } catch {
    // exotic object; treat as "no props"
  }
  return null;
}

/**
 * The props of a DOM node's own component plus those of its React ancestors,
 * innermost first. `maxDepth` bounds the climb — Discord's trees are deep and
 * every caller only cares about a nearby ancestor.
 */
export function getFiberPropsChain(node: unknown, maxDepth = 30): any[] {
  const out: any[] = [];
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

/**
 * Convenience re-exports of the hooks plugins reach for most. These read
 * through the same lazy proxy, so they are safe to destructure at module top
 * level even though React is not yet available at that moment.
 */
export const useState: typeof import("react").useState = (...a: any[]) =>
  (React.useState as any)(...a);
export const useEffect: typeof import("react").useEffect = (...a: any[]) =>
  (React.useEffect as any)(...a);
export const useMemo: typeof import("react").useMemo = (...a: any[]) =>
  (React.useMemo as any)(...a);
export const useCallback: typeof import("react").useCallback = (...a: any[]) =>
  (React.useCallback as any)(...a);
export const useRef: typeof import("react").useRef = (...a: any[]) =>
  (React.useRef as any)(...a);
