// Flux bridge.
//
// Discord's client state is driven by a Flux dispatcher: actions are dispatched
// by type, stores react, the UI re-renders. This module lets plugins listen for
// those actions and read store state without reaching into internals directly.
//
// Subscriptions are plain and synchronous by contract. A listener must return
// quickly and must not dispatch from inside the callback; defer any follow-up
// work to a microtask.

import { logger } from "../logger";
import { getDispatcher } from "../common/discord";

const log = logger("flux");

export type FluxAction = { type: string; [key: string]: any };
export type FluxListener = (action: FluxAction) => void;

// Our own indirection over the dispatcher's subscribe/unsubscribe so we can keep
// one dispatcher-level handler per action type and fan out to many listeners.
const listenersByType = new Map<string, Set<FluxListener>>();
const dispatcherHandlers = new Map<string, FluxListener>();

function dispatcher(): any {
  const d = getDispatcher();
  if (!d) log.error("dispatcher unavailable; flux subscriptions are inert");
  return d;
}

function ensureBridge(type: string): void {
  if (dispatcherHandlers.has(type)) return;

  const handler: FluxListener = (action) => {
    const set = listenersByType.get(type);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(action);
      } catch (err) {
        log.error(`listener for ${type} threw`, err);
      }
    }
  };

  const d = dispatcher();
  try {
    d?.subscribe(type, handler);
    dispatcherHandlers.set(type, handler);
  } catch (err) {
    log.error(`could not subscribe to ${type}`, err);
  }
}

function teardownBridge(type: string): void {
  const set = listenersByType.get(type);
  if (set && set.size) return;

  const handler = dispatcherHandlers.get(type);
  if (!handler) return;

  try {
    dispatcher()?.unsubscribe(type, handler);
  } catch (err) {
    log.error(`could not unsubscribe from ${type}`, err);
  }
  dispatcherHandlers.delete(type);
  listenersByType.delete(type);
}

export type Unsubscribe = () => void;

export const flux = {
  /**
   * Listen for a dispatched action by type. Returns an unsubscribe function.
   * The callback runs synchronously on dispatch; keep it fast and side-effect free.
   */
  subscribe(type: string, listener: FluxListener): Unsubscribe {
    let set = listenersByType.get(type);
    if (!set) {
      set = new Set();
      listenersByType.set(type, set);
    }
    set.add(listener);
    ensureBridge(type);

    let live = true;
    return () => {
      if (!live) return;
      live = false;
      set!.delete(listener);
      teardownBridge(type);
    };
  },

  /** Dispatch an action. Use sparingly; most plugins only ever listen. */
  dispatch(action: FluxAction): void {
    try {
      dispatcher()?.dispatch(action);
    } catch (err) {
      log.error("dispatch failed", action?.type, err);
    }
  }
};

export type Flux = typeof flux;
