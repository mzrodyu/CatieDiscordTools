// The subscription engine.
//
// For each monitored guild we ask Discord's OWN guild-subscription actions to
// subscribe to its channels. We never hand-assemble a gateway frame: a
// malformed opcode-14 payload is exactly the kind of thing that draws
// attention, so we route through the client's high-level methods and, if they
// are absent on this build, do nothing at all.
//
// Subscriptions are ephemeral server-side — the gateway forgets them after a
// while — so a monitored guild is re-subscribed on an interval. Everything is
// best-effort and guarded; a failure logs and moves on.

import { GuildChannelStore, GuildSubscriptions } from "../../core/common/discord";
import { logger } from "../../core/logger";

const log = logger("guild-monitor");

// Re-affirm subscriptions periodically. The gateway drops idle guild
// subscriptions after some minutes; this keeps monitored ones alive without
// hammering (a tighter loop would look far more like automation).
const REFRESH_MS = 5 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | undefined;
let getGuildIds: () => string[] = () => [];

/** Text channel ids of a guild, flattened from GuildChannelStore's grouping. */
function textChannelIds(guildId: string): string[] {
  try {
    const grouped = GuildChannelStore.getChannels(guildId);
    if (!grouped || typeof grouped !== "object") return [];

    const ids = new Set<string>();
    for (const value of Object.values(grouped)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        // Entries look like { channel: { id, type } } across builds.
        const ch = (item as any)?.channel ?? item;
        const id = ch?.id;
        // 0 = GUILD_TEXT, 5 = ANNOUNCEMENT. Others (voice/category) carry no
        // message traffic worth subscribing for.
        if (id != null && (ch?.type === 0 || ch?.type === 5)) ids.add(String(id));
      }
    }
    return [...ids];
  } catch (err) {
    log.debug(`could not read channels for guild ${guildId}`, err);
    return [];
  }
}

/** Subscribe to one guild's channels through Discord's own action module. */
function subscribeGuild(guildId: string): void {
  const api = GuildSubscriptions as any;
  if (!api) return;

  try {
    if (typeof api.subscribeToChannel === "function") {
      for (const channelId of textChannelIds(guildId)) {
        api.subscribeToChannel(guildId, channelId);
      }
      return;
    }
    // Fallback: a guild-level subscribe, if that is all the build exposes.
    if (typeof api.subscribeToGuild === "function") {
      api.subscribeToGuild(guildId);
    }
  } catch (err) {
    log.warn(`subscribe failed for guild ${guildId}`, err);
  }
}

/** Whether this build exposes any usable subscription entry point. */
export function isSubscriptionSupported(): boolean {
  const api = GuildSubscriptions as any;
  return Boolean(api && (typeof api.subscribeToChannel === "function" || typeof api.subscribeToGuild === "function"));
}

function pass(): void {
  const ids = getGuildIds();
  if (!ids.length) return;
  for (const id of ids) subscribeGuild(id);
  log.debug(`refreshed subscriptions for ${ids.length} guild(s)`);
}

/** Start the refresh loop. `resolver` returns the currently monitored ids. */
export function startSubscribing(resolver: () => string[]): void {
  getGuildIds = resolver;
  stopSubscribing();

  if (!isSubscriptionSupported()) {
    log.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");
    return;
  }

  pass();
  timer = setInterval(pass, REFRESH_MS);
}

/** Re-subscribe now (e.g. right after the monitored set changes). */
export function refreshNow(): void {
  if (timer) pass();
}

export function stopSubscribing(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
