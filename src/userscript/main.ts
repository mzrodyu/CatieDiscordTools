// Userscript entry (Tampermonkey / Violentmonkey).
//
// Same renderer payload as the other builds, loaded via a user script manager
// with `@run-at document-start`. Storage is the page's localStorage, captured
// before Discord deletes it — the install-storage import must stay first.

import "./install-storage";
import { runtime } from "../core/runtime";
import { plugins } from "../plugins";
import { openSettings, closeSettings } from "../ui/settings/overlay";
import { injectStyles } from "../ui/inject-styles";
import { getSourcePatchReport, dumpFactorySource, diagnoseSettings } from "../core/modules/webpack";
import { probe } from "../core/probe";
import { logger } from "../core/logger";

const log = logger("userscript");

runtime.registerAll(plugins);

runtime
  .boot()
  .then(() => {
    injectStyles();

    try {
      (globalThis as any).HalcyonAPI = {
        // Stamped at build time. Which copy is actually live is the first thing
        // any bug report needs, and a user-script manager updating on its own
        // schedule (plus an already-open tab keeping the old code) makes it
        // genuinely unknowable otherwise — two rounds of "还是不行" were really
        // an old build still running.
        version: typeof HALCYON_VERSION !== "undefined" ? HALCYON_VERSION : "dev",
        build: typeof HALCYON_BUILD !== "undefined" ? HALCYON_BUILD : "dev",
        open: openSettings,
        close: closeSettings,
        runtime,
        patchReport: () => getSourcePatchReport(),
        dumpSource: (needle: string, radius?: number) => dumpFactorySource(needle, radius),
        diagnose: () => diagnoseSettings(),
        probe
      };
    } catch {
      // A frozen global is not fatal; the keybind still opens the panel.
    }

    log.info("Halcyon (userscript) ready — press Ctrl/Cmd+Shift+H to open settings");
  })
  .catch((err) => log.error("userscript boot failed", err));
