// Built-in plugin registry.
//
// Order matters only for display; the runtime resolves start order from each
// plugin's declared dependencies. The settings host comes first because it is
// infrastructure every other plugin's UI relies on.

import type { Plugin } from "../core/plugin";
import settingsHost from "./settings-host";
import messageLogger from "./message-logger";
import showUsername from "./show-username";

export const plugins: Plugin[] = [settingsHost, messageLogger, showUsername];
