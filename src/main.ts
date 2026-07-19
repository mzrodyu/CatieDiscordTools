// Renderer entry point.
//
// This is the payload injected into Discord. It registers the built-in plugins,
// boots the runtime (which takes over Webpack, applies patches, and starts
// enabled plugins), and exposes a small global so the settings surface can be
// opened from anywhere — including the developer console.

import { runtime } from "./core/runtime";
import { plugins } from "./plugins";
import { injectStyles } from "./ui/inject-styles";
import { openSettings, closeSettings } from "./ui/settings/overlay";
import { getSourcePatchReport, dumpFactorySource, diagnoseSettings } from "./core/modules/webpack";
import { logger } from "./core/logger";

const log = logger("main");

runtime.registerAll(plugins);

runtime
  .boot()
  .then(() => {
    injectStyles();
    log.info("ready — open settings from Discord's sidebar or with Ctrl/Cmd+Shift+H");
  })
  .catch((err) => log.error("boot failed", err));

// Exposed on the IIFE global (window.Halcyon.*).
export const open = openSettings;
export const close = closeSettings;
export { runtime };

// A friendlier alias for console discovery.
try {
  (globalThis as unknown as Record<string, unknown>).HalcyonAPI = {
    open: openSettings,
    close: closeSettings,
    runtime,
    patchReport: () => getSourcePatchReport(),
    dumpSource: (needle: string, radius?: number) => dumpFactorySource(needle, radius),
    diagnose: () => diagnoseSettings()
  };
} catch {
  /* non-fatal */
}
