// Built-in plugin registry.
//
// Order matters only for display; the runtime resolves start order from each
// plugin's declared dependencies. The settings host comes first because it is
// infrastructure every other plugin's UI relies on.

import type { Plugin } from "../core/plugin";
import settingsHost from "./settings-host";
import contextMenuApi from "./context-menu-api";
import messageLogger from "./message-logger";
import showUsername from "./show-username";
import guildMonitor from "./guild-monitor";
import messageCleaner from "./message-cleaner";
import fakeNitro from "./fake-nitro";
import consoleCleaner from "./console-cleaner";
import emoteCloner from "./emote-cloner";
import markAllRead from "./mark-all-read";

export const plugins: Plugin[] = [settingsHost, contextMenuApi, messageLogger, showUsername, guildMonitor, messageCleaner, fakeNitro, consoleCleaner, emoteCloner, markAllRead];
