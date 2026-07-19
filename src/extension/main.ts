// Browser-extension entry.
//
// Same payload as the desktop build, loaded a different way: a MAIN-world
// content script at document_start instead of an Electron preload. The only
// behavioural difference is storage, which routes through the extension bridge.
//
// Import order matters: the storage bridge is imported first so it installs the
// backend before the settings layer resolves one. We also wait for the mirror
// to hydrate before registering plugins, so saved values are in place from the
// first read.

import { bridgeReady } from "./install-storage-bridge";
import { runtime } from "../core/runtime";
import { plugins } from "../plugins";
import { openSettings, closeSettings } from "../ui/settings/overlay";
import { injectStyles } from "../ui/inject-styles";
import { getSourcePatchReport, dumpFactorySource, diagnoseSettings } from "../core/modules/webpack";
import { logger } from "../core/logger";

const log = logger("extension");

// Take over Webpack synchronously, before the async storage handshake below.
// Discord's module factories must be patched before they load and cache — and
// at document_start we run ahead of Discord's bundle, so this wins the race.
// An earlier version awaited the storage bridge first, which let the settings
// module cache in its unpatched form: the patched factory then sat in the map
// while React kept rendering the stale class, so the native sidebar embed
// silently never applied. prepare() only touches Webpack and required-plugin
// patches; enable-state and plugin start still wait for the bridge in boot().
runtime.registerAll(plugins);
runtime.prepare();

async function start(): Promise<void> {
  await bridgeReady;

  await runtime.boot();
  injectStyles();

  try {
    (globalThis as any).HalcyonAPI = {
      open: openSettings,
      close: closeSettings,
      runtime,
      patchReport: () => getSourcePatchReport(),
      dumpSource: (needle: string, radius?: number) => dumpFactorySource(needle, radius),
      diagnose: () => diagnoseSettings()
    };
  } catch {
    // A frozen global is not fatal; the keybind still opens the panel.
  }

  log.info("Halcyon (extension) ready — press Ctrl/Cmd+Shift+H to open settings");
}

start().catch((err) => log.error("extension boot failed", err));
