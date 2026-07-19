// Runtime function patcher.
//
// Wraps a method on an object so callers can observe or alter it at three
// points: before the original runs (inspect / rewrite arguments or skip),
// after it returns (inspect / rewrite the result), or instead of it entirely.
//
// A single method may carry any number of hooks from any number of plugins.
// They are composed into one installed wrapper; removing the last hook restores
// the pristine original. Every registration returns an `unpatch` so a plugin's
// stop() can leave no trace.

import { logger } from "../logger";

const log = logger("patcher");

export interface PatchContext {
  /** Arguments passed to the call. Mutating this in a `before` hook is honored. */
  args: any[];
  /** Return value. Only meaningful in `after`; reassign to override. */
  result: any;
  /** The `this` the original was invoked with. */
  self: any;
  /** In an `instead` hook, invokes the original with the (possibly edited) args. */
  callOriginal: () => any;
}

type BeforeHook = (ctx: PatchContext) => void;
type AfterHook = (ctx: PatchContext) => void;
type InsteadHook = (ctx: PatchContext) => any;

interface HookSet {
  before: Set<BeforeHook>;
  instead: Set<InsteadHook>;
  after: Set<AfterHook>;
  original: (...args: any[]) => any;
}

// Marker stored on an installed wrapper so we can find its hook set again.
const INSTALLED = Symbol("halcyon.patch");

function ensureInstalled(target: any, method: string): HookSet {
  const current = target[method];

  if (current && (current as any)[INSTALLED]) {
    return (current as any)[INSTALLED] as HookSet;
  }

  if (typeof current !== "function") {
    throw new TypeError(`cannot patch "${method}": not a function`);
  }

  const hooks: HookSet = {
    before: new Set(),
    instead: new Set(),
    after: new Set(),
    original: current
  };

  const wrapper = function (this: any, ...args: any[]) {
    const ctx: PatchContext = {
      args,
      result: undefined,
      self: this,
      callOriginal: () => hooks.original.apply(this, ctx.args)
    };

    for (const hook of hooks.before) {
      try {
        hook(ctx);
      } catch (err) {
        log.error(`before-hook on "${method}" threw`, err);
      }
    }

    if (hooks.instead.size) {
      // The last-registered `instead` wins; earlier ones may chain via callOriginal.
      let outcome: any;
      let ran = false;
      for (const hook of hooks.instead) {
        try {
          outcome = hook(ctx);
          ran = true;
        } catch (err) {
          log.error(`instead-hook on "${method}" threw; falling back to original`, err);
          outcome = ctx.callOriginal();
          ran = true;
        }
      }
      ctx.result = ran ? outcome : ctx.callOriginal();
    } else {
      try {
        ctx.result = hooks.original.apply(this, ctx.args);
      } catch (err) {
        // Re-throw: swallowing the original's error would hide real bugs.
        throw err;
      }
    }

    for (const hook of hooks.after) {
      try {
        hook(ctx);
      } catch (err) {
        log.error(`after-hook on "${method}" threw`, err);
      }
    }

    return ctx.result;
  };

  // Preserve identity hints so Discord code that inspects the function is not surprised.
  Object.defineProperty(wrapper, "name", { value: current.name, configurable: true });
  Object.defineProperty(wrapper, "length", { value: current.length, configurable: true });
  wrapper.toString = () => hooks.original.toString();
  (wrapper as any)[INSTALLED] = hooks;

  // Copy static properties hung off the original function.
  Object.assign(wrapper, current);

  target[method] = wrapper;
  return hooks;
}

function maybeRestore(target: any, method: string, hooks: HookSet): void {
  if (hooks.before.size || hooks.instead.size || hooks.after.size) return;
  // No hooks left: put the untouched original back.
  if (target[method] && (target[method] as any)[INSTALLED] === hooks) {
    target[method] = hooks.original;
  }
}

export type Unpatch = () => void;

function attach(kind: "before" | "instead" | "after", target: any, method: string, hook: any): Unpatch {
  if (target == null) {
    log.error(`refusing to patch "${method}" on a null target`);
    return () => {};
  }

  let hooks: HookSet;
  try {
    hooks = ensureInstalled(target, method);
  } catch (err) {
    log.error(err);
    return () => {};
  }

  (hooks[kind] as Set<any>).add(hook);

  let live = true;
  return () => {
    if (!live) return;
    live = false;
    (hooks[kind] as Set<any>).delete(hook);
    maybeRestore(target, method, hooks);
  };
}

export const patcher = {
  /** Run before the original. Edit `ctx.args` to change what it receives. */
  before(target: any, method: string, hook: BeforeHook): Unpatch {
    return attach("before", target, method, hook);
  },

  /** Run after the original. Edit `ctx.result` to change what callers see. */
  after(target: any, method: string, hook: AfterHook): Unpatch {
    return attach("after", target, method, hook);
  },

  /** Replace the original. Call `ctx.callOriginal()` to defer to it. */
  instead(target: any, method: string, hook: InsteadHook): Unpatch {
    return attach("instead", target, method, hook);
  }
};

export type Patcher = typeof patcher;
