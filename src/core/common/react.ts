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
