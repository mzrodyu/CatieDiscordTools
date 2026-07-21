// Context-menu framework.
//
// Discord builds every right-click menu from a single central component: a
// function that receives the menu's props (`{ navId, children, onClose, ... }`)
// and returns the rendered <Menu>. A load-time SOURCE patch on that component
// (see the `context-menu-api` plugin) injects a call to
// `usePatchContextMenu(props)` at its top. We read `props.navId`, look up the
// callbacks registered for it, and let each splice items into the (cloned)
// children array.
//
// For the contextual data (which emoji / sticker was clicked) we do NOT rely on
// Discord's internal call arguments — capturing those needs a second, broad
// source patch that injects `arguments` into every navId object literal, which
// is a syntax error inside class fields and blew up unrelated modules. Instead
// we track the actual right-clicked DOM node ourselves (a capture-phase
// `contextmenu` listener) and hand it to callbacks via `getContextMenuTarget()`.
// That is also a better fit for "right-click the emoji itself".

import { logger } from "../logger";

const log = logger("context-menu");

/**
 * A menu patch. `children` is the menu's mutable child array — push your own
 * <MenuItem/> in. Read the clicked element via `getContextMenuTarget()`. Must
 * not throw; a thrown patch is logged and skipped.
 */
export type ContextMenuPatchCallback = (children: any[], ...args: any[]) => void;

const navPatches = new Map<string, Set<ContextMenuPatchCallback>>();

// The element under the cursor when the current menu was opened. Captured in
// the capture phase so we see it before Discord's own handlers can swap focus.
let lastTarget: Element | null = null;
let trackingInstalled = false;

function installTargetTracking(): void {
  if (trackingInstalled || typeof document === "undefined") return;
  trackingInstalled = true;
  document.addEventListener(
    "contextmenu",
    (e) => {
      lastTarget = (e.target as Element) ?? null;
    },
    true
  );
}

/** The DOM element that was right-clicked to open the current menu. */
export function getContextMenuTarget(): Element | null {
  return lastTarget;
}

// The real `MenuItem` component, learned from a live menu (see below).
let menuItemComponent: any = null;

/**
 * The exact `MenuItem` component Discord uses for the menus we patch.
 *
 * This is THE fix for "Menu API only allows Items and groups of Items as
 * children …": Discord's menu validates its children by *reference*
 * (`child.type === MenuItem`), and there are several lookalike menu modules on
 * the client, so a `MenuItem` located by shape-scan (or handed out through a
 * binding proxy) is a *different* function object and fails that check, blanking
 * — or crashing — the whole menu.
 *
 * Instead of guessing which module is the right one, we lift the component
 * straight off an item the live menu already rendered: its `.type` is, by
 * construction, the exact reference the same menu validates against. Learned
 * lazily from the first menu that renders items (see `usePatchContextMenu`) and
 * cached — it is a single shared component across every Discord menu.
 *
 * Returns null only before any item-bearing menu has been opened; callers must
 * null-check and skip injecting rather than fall back to a mismatched ref.
 */
export function getMenuItemComponent(): any {
  return menuItemComponent;
}

/**
 * Walk a children tree for an element that is unmistakably a menu *item* (a
 * string `id` plus one of the item-only props) and return its `.type`. Menus
 * are shallow, so the recursion into groups/submenus is cheap.
 */
function findMenuItemType(children: any[]): any {
  for (const child of children) {
    if (child == null) continue;

    if (Array.isArray(child)) {
      const found = findMenuItemType(child);
      if (found) return found;
    }

    const props = child.props;
    if (
      child.type &&
      props &&
      typeof props.id === "string" &&
      (props.action != null ||
        props.label != null ||
        props.render != null ||
        props.onClick != null ||
        props.subtext != null)
    ) {
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

/** Register a callback for one (or several) menu navIds. Returns an unregister fn. */
export function addContextMenuPatch(
  navId: string | string[],
  callback: ContextMenuPatchCallback
): () => void {
  installTargetTracking();
  const ids = Array.isArray(navId) ? navId : [navId];
  for (const id of ids) {
    let set = navPatches.get(id);
    if (!set) {
      set = new Set();
      navPatches.set(id, set);
    }
    set.add(callback);
  }
  return () => {
    for (const id of ids) navPatches.get(id)?.delete(callback);
  };
}

export function removeContextMenuPatch(navId: string | string[], callback: ContextMenuPatchCallback): void {
  const ids = Array.isArray(navId) ? navId : [navId];
  for (const id of ids) navPatches.get(id)?.delete(callback);
}

/**
 * Find the children array of the group that contains a child with one of the
 * given ids, so a patch can insert its item right beside an existing entry
 * (e.g. next to "copy-link"). Returns null if no such child exists.
 */
export function findGroupChildrenByChildId(
  id: string | string[],
  children: any[],
  matchSub = false
): any[] | null {
  const ids = Array.isArray(id) ? id : [id];
  const hit = (childId: any): boolean =>
    typeof childId === "string" && ids.some((i) => (matchSub ? childId.includes(i) : childId === i));

  for (const child of children) {
    if (child == null) continue;

    if (Array.isArray(child)) {
      const found = findGroupChildrenByChildId(ids, child, matchSub);
      if (found !== null) return found;
    }

    if (hit(child.props?.id)) return children;

    let next = child.props?.children;
    if (next) {
      if (!Array.isArray(next)) {
        next = [next];
        child.props.children = next;
      }
      const found = findGroupChildrenByChildId(ids, next, matchSub);
      if (found !== null) return found;
    }
  }
  return null;
}

/** Shallow-clone the menu children into a fresh array each render, so patches
 * pushing items never accumulate across re-renders of the same menu. */
function cloneChildren(children: any): any[] {
  if (Array.isArray(children)) return children.slice();
  return children == null ? [] : [children];
}

/**
 * Called from the source-patched context-menu component with its props. Runs
 * the callbacks registered for this menu's navId against a fresh copy of the
 * children, then returns the (new) props for the component to render. Defensive
 * throughout: a throw here would blank every right-click menu.
 */
export function usePatchContextMenu(props: any): any {
  try {
    if (!props || typeof props.navId !== "string") return props;

    // Learn Discord's real MenuItem reference from any menu that renders items,
    // so it's cached before (or during) the first menu we actually patch.
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
        log.error(`context-menu patch for "${props.navId}" threw`, err);
      }
    }
    return next;
  } catch (err) {
    log.error("failed to apply context-menu patches", err);
    return props;
  }
}
