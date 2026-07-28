// Runtime self-diagnostic.
//
// Plugins that decorate Discord's own interface depend on things this codebase
// cannot verify from the outside — a Flux store's registered name, a class-name
// prefix, the props a component happens to be rendered with. When one of those
// moves (and Discord moves them often) a well-written plugin degrades to doing
// nothing, which from the outside is indistinguishable from "it's broken".
//
// So any plugin may expose a `probe()` returning what it actually found: which
// stores resolved, which anchors matched, what a sample resolution produced.
// This collects all of them into one object, logs it, and parks the JSON on
// `globalThis.__halcyonProbe` so a user can `copy(__halcyonProbe)` and paste the
// ground truth back instead of us guessing at class names.

import { runtime } from "./runtime";
import { getSourcePatchReport } from "./modules/webpack";
import { logger } from "./logger";

const log = logger("probe");

export function probe(): Record<string, unknown> {
  const perPlugin: Record<string, unknown> = {};

  for (const view of runtime.list()) {
    const plugin = runtime.getPlugin(view.id);
    const fn = plugin?.probe;
    if (typeof fn !== "function") continue;
    try {
      perPlugin[view.id] = {
        enabled: view.enabled,
        state: view.state,
        needsRestart: view.needsRestart,
        report: (fn as () => unknown).call(plugin)
      };
    } catch (err) {
      perPlugin[view.id] = {
        enabled: view.enabled,
        state: view.state,
        probeError: String(err)
      };
    }
  }

  const out: Record<string, unknown> = {
    version: typeof HALCYON_VERSION !== "undefined" ? HALCYON_VERSION : "dev",
    build: typeof HALCYON_BUILD !== "undefined" ? HALCYON_BUILD : "dev",
    href: (() => {
      try {
        return location.pathname;
      } catch {
        return null;
      }
    })(),
    plugins: perPlugin,
    patches: getSourcePatchReport()
  };

  try {
    (globalThis as Record<string, unknown>).__halcyonProbe = JSON.stringify(out, null, 2);
    log.info("probe 已生成 —— 在控制台运行  copy(__halcyonProbe)  然后把内容贴回来");
  } catch {
    // Serialization can fail on an exotic value; the returned object still works.
  }

  return out;
}
