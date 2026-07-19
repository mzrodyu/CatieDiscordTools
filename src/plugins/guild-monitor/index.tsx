// guild-monitor — actively subscribe to chosen servers' channels.
//
// By default Discord only streams events for channels you're looking at, so the
// message recorder can't catch deletions in servers you haven't opened this
// session. This plugin opts specific servers into active subscription, which
// makes those channels' message events flow in the background — feeding the
// recorder (and anything else on the dispatcher) for messages that predate your
// session.
//
// This is automation against a user account and can get you banned; nothing
// happens until the user acknowledges that on the plugin's page and picks
// servers. When disabled, or when consent is withdrawn, all subscribing stops.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { BroadcastIcon } from "../../icons";
import { settings } from "./settings";
import { startSubscribing, stopSubscribing } from "./subscribe";
import { MonitorPage } from "./ui/MonitorPage";

const log = logger("guild-monitor");

/** The guilds we should be subscribing to right now — gated on consent. */
function activeGuildIds(): string[] {
  if (settings.store.acknowledgedRisk !== true) return [];
  const ids = settings.store.selectedGuilds;
  return Array.isArray(ids) ? (ids as string[]) : [];
}

export default definePlugin({
  id: "guild-monitor",
  name: "服务器监控",
  description: "主动订阅选定服务器的频道，捕捉未打开频道里的消息（有封号风险，默认关闭）。",
  authors: [{ name: "caitemm" }],
  category: "privacy",

  settings,

  page: {
    title: "监控",
    icon: BroadcastIcon,
    component: MonitorPage
  },

  start() {
    startSubscribing(activeGuildIds);
    const n = activeGuildIds().length;
    if (n > 0) log.info(`monitoring ${n} guild(s)`);
  },

  stop() {
    stopSubscribing();
  }
});
