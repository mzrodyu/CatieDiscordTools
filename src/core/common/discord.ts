// Handles to Discord's own modules that several parts of Halcyon need.
//
// Each handle is a lazy proxy: nothing is resolved until first access, which
// keeps startup cheap and tolerates modules that load late. Filters describe
// modules by shape, never by ID, so they survive client updates.

import { find, isFluxDispatcher, lazy } from "../modules/webpack";

/** Central Flux dispatcher. Everything state-related flows through it. */
export const Dispatcher = lazy<any>(isFluxDispatcher);

/**
 * Resolve the real dispatcher module (not the lazy proxy). Use this when you
 * need to patch the dispatcher: patching goes through property assignment,
 * which the lazy proxy cannot forward to the underlying module.
 *
 * Discord instantiates more than one Flux dispatcher (popouts, overlay), so a
 * blind shape-scan can land on an instance no gateway event ever flows
 * through. The one the client actually uses is the one its stores registered
 * on, so prefer the dispatcher reachable from a core store.
 */
export function getDispatcher(): any {
  try {
    const viaStore = (UserStore as any)?._dispatcher;
    if (isFluxDispatcher(viaStore)) return viaStore;
  } catch {
    // fall through to the shape scan
  }
  return find(isFluxDispatcher);
}

/** Read access to cached messages, keyed by channel. */
export const MessageStore = lazy<any>(
  (m) => typeof m?.getMessage === "function" && typeof m?.getMessages === "function"
);

/** Imperative message operations (send / edit / delete / receive). */
export const MessageActions = lazy<any>(
  (m) => typeof m?.editMessage === "function" && typeof m?.deleteMessage === "function"
);

/** Users the client knows about. */
export const UserStore = lazy<any>(
  (m) => typeof m?.getCurrentUser === "function" && typeof m?.getUser === "function"
);

/** Channel metadata. */
export const ChannelStore = lazy<any>(
  (m) => typeof m?.getChannel === "function" && typeof m?.hasChannel === "function"
);

/** The currently focused channel / guild. */
export const SelectedChannelStore = lazy<any>(
  (m) => typeof m?.getChannelId === "function" && typeof m?.getLastSelectedChannelId === "function"
);

/** Relative / absolute timestamp formatting used across the client. */
export const moment = lazy<any>((m) => typeof m === "function" && typeof m?.locale === "function" && typeof m?.utc === "function");
