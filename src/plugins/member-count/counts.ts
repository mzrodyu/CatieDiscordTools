// Reading member counts out of Discord's own stores.
//
// This turned out to be the whole difficulty of the plugin. A live client showed
// the chip mounted in the right place and rendering nothing, because every
// source came back null — so each number now has a chain of sources, ordered
// cheapest and most authoritative first.
//
//   total   1. `GuildMemberCountStore.getMemberCount(guildId)` — the map fed by
//              the gateway's guild payload at connect, so it is populated for
//              every joined guild without opening anything. Resolved through
//              Flux's own instance registry, NOT a module-export scan: this
//              store is invisible to the scan on current builds, which is
//              exactly why the count was missing.
//           2. any store exposing `getMemberCount`, in case of a rename.
//           3. the guild record's own `memberCount` / `approximateMemberCount`.
//           4. whatever we captured off the action stream.
//
//   online  Discord never sends an online total on its own. What it sends, once
//           a member list is subscribed, is that list's group structure:
//           `[{ id: "online" | roleId | "offline", count }]`. Summing every
//           group except "offline" is the online count and is what the sidebar
//           itself displays.
//           1. `ChannelMemberStore.getProps(guildId, channelId).groups` — live
//              for the channel in view. A lone group with id "unknown" means
//              "not loaded", not "nobody".
//           2. the same groups captured off `GUILD_MEMBER_LIST_UPDATE`, plus
//              `ONLINE_GUILD_MEMBER_COUNT_UPDATE` which carries the number
//              outright. This survives a collapsed sidebar.
//
// When a guild has no member-list data at all (the sidebar has never been opened
// on this launch), nothing above can produce an online count. Discord's own fix
// is to preload the guild's default channel, which is what makes it subscribe;
// we do the same, once per guild, and only when a number is actually missing.
// That is the plugin's only outbound call and it is the client's own action —
// the `preloadCounts` setting turns it off.
//
// Everything is best-effort and null-safe: a store that isn't on this build, or
// a channel we have no data for, yields null and callers hide that half.

import {
  find,
  findStoreByName,
  findStoreWithMethods,
  storeNames
} from "../../core/modules/webpack";
import { ChannelStore, GuildChannelStore, GuildStore } from "../../core/common/discord";
import { flux } from "../../core/flux";
import { logger } from "../../core/logger";
import { settings } from "./settings";

const log = logger("member-count");

/** Resolve once, then remember. Retries while the answer is still undefined. */
function memo<T>(resolve: () => T): () => T {
  let cached: T | undefined;
  return () => (cached ??= resolve());
}

const memberCountStore = memo<any>(
  () => findStoreByName("GuildMemberCountStore") ?? findStoreWithMethods("getMemberCount")
);

const channelMemberStore = memo<any>(() => findStoreByName("ChannelMemberStore"));

/**
 * Discord's channel action creators. `preload(guildId, channelId)` is what the
 * client itself calls when you click into a guild; it is what makes the gateway
 * start sending that guild's member-list groups.
 */
const channelActions = memo<any>(
  () =>
    find((m) => typeof m?.preload === "function" && typeof m?.preloadAllGuilds === "function") ??
    find(
      (m) =>
        typeof m?.preload === "function" &&
        // Reject Discord's answer-everything intl proxy.
        typeof m?.__halcyon_probe__ === "undefined"
    )
);

export interface MemberCounts {
  /** Total members in the guild, or null when unknown. */
  total: number | null;
  /** Members not in the "offline" group, or null when unknown. */
  online: number | null;
}

export const EMPTY_COUNTS: MemberCounts = { total: null, online: null };

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** The guild the currently selected channel belongs to, if any. */
export function guildIdOfChannel(channelId: string | null | undefined): string | null {
  if (!channelId) return null;
  try {
    const channel = ChannelStore.getChannel?.(channelId);
    const guildId = channel?.guild_id ?? channel?.getGuildId?.();
    return guildId ? String(guildId) : null;
  } catch {
    return null;
  }
}

// --- captured from the action stream ----------------------------------------

const onlineByGuild = new Map<string, number>();
const totalByGuild = new Map<string, number>();
let unsubscribes: Array<() => void> = [];

/** Sum a member-list group array, skipping the offline bucket. */
function sumGroups(groups: unknown): number | null {
  if (!Array.isArray(groups) || groups.length === 0) return null;
  // A lone "unknown" group is Discord's placeholder for "list not loaded".
  if (groups.length === 1 && (groups[0] as any)?.id === "unknown") return null;

  let sum = 0;
  let sawAny = false;
  for (const group of groups) {
    if ((group as any)?.id === "offline") continue;
    const count = asCount((group as any)?.count);
    if (count == null) continue;
    sum += count;
    sawAny = true;
  }
  return sawAny ? sum : null;
}

/** Watch the action stream for anything carrying a count. */
export function startCountTracking(): void {
  stopCountTracking();

  const remember = (map: Map<string, number>, guildId: unknown, value: unknown): void => {
    const count = asCount(value);
    if (guildId != null && count != null) map.set(String(guildId), count);
  };

  unsubscribes = [
    flux.subscribe("GUILD_MEMBER_LIST_UPDATE", (action) => {
      const a = action as any;
      const sum = sumGroups(a?.groups);
      if (a?.guildId != null && sum != null) onlineByGuild.set(String(a.guildId), sum);
      // The same payload carries the authoritative total.
      remember(totalByGuild, a?.guildId, a?.memberCount ?? a?.member_count);
    }),
    flux.subscribe("ONLINE_GUILD_MEMBER_COUNT_UPDATE", (action) => {
      remember(onlineByGuild, (action as any)?.guildId, (action as any)?.count);
    }),
    flux.subscribe("GUILD_CREATE", (action) => {
      const guild = (action as any)?.guild;
      remember(totalByGuild, guild?.id, guild?.member_count ?? guild?.memberCount);
    }),
    flux.subscribe("GUILD_UPDATE", (action) => {
      const guild = (action as any)?.guild;
      remember(totalByGuild, guild?.id, guild?.member_count ?? guild?.memberCount);
    })
  ];
}

export function stopCountTracking(): void {
  for (const off of unsubscribes) {
    try {
      off();
    } catch {
      // best effort
    }
  }
  unsubscribes = [];
  onlineByGuild.clear();
  totalByGuild.clear();
  nudged.clear();
}

// --- the preload nudge ------------------------------------------------------

const nudged = new Set<string>();

/**
 * Ask Discord to load a guild's member-list data, the same way clicking into the
 * guild does. Once per guild per session, and only when we're actually missing a
 * number — a plugin that shows a count should not also be a background poller.
 */
function nudge(guildId: string, channelId: string): void {
  if (!settings.store.preloadCounts) return;
  if (nudged.has(guildId)) return;
  nudged.add(guildId);

  try {
    const api = channelActions();
    if (typeof api?.preload !== "function") return;
    const target = GuildChannelStore.getDefaultChannel?.(guildId)?.id ?? channelId;
    api.preload(guildId, target);
    log.debug(`已请求加载 ${guildId} 的成员列表数据`);
  } catch (err) {
    log.debug("preload 调用失败，忽略", err);
  }
}

// --- reads -----------------------------------------------------------------

function readTotal(guildId: string): number | null {
  try {
    const fromStore = asCount(memberCountStore()?.getMemberCount?.(guildId));
    if (fromStore != null) return fromStore;
  } catch {
    // store absent or shape changed
  }
  try {
    const guild = GuildStore.getGuild?.(guildId);
    const fromRecord = asCount(guild?.memberCount) ?? asCount(guild?.approximateMemberCount);
    if (fromRecord != null) return fromRecord;
  } catch {
    // guild not cached
  }
  return totalByGuild.get(guildId) ?? null;
}

function readOnline(guildId: string, channelId: string): number | null {
  try {
    const fromStore = sumGroups(channelMemberStore()?.getProps?.(guildId, channelId)?.groups);
    if (fromStore != null) return fromStore;
  } catch {
    // store absent or shape changed
  }
  return onlineByGuild.get(guildId) ?? null;
}

/** Both counts for a guild channel. Either half may be null. */
export function readCounts(channelId: string | null | undefined): MemberCounts {
  const guildId = guildIdOfChannel(channelId);
  if (!guildId || !channelId) return EMPTY_COUNTS;

  const counts = {
    total: readTotal(guildId),
    online: readOnline(guildId, String(channelId))
  };

  // Missing a number is the only reason to ask Discord for more.
  if (counts.total == null || counts.online == null) nudge(guildId, String(channelId));

  return counts;
}

/** Which data source resolved, and what it held. Used by the plugin's probe. */
export function countsDiagnostics(channelId: string | null | undefined): Record<string, unknown> {
  const guildId = guildIdOfChannel(channelId);

  const safe = <T>(fn: () => T): T | string => {
    try {
      return fn();
    } catch (err) {
      return `threw: ${String(err)}`;
    }
  };

  return {
    channelId: channelId ?? null,
    guildId,
    stores: {
      memberCountStore: safe(() => memberCountStore()?.getName?.() ?? null),
      memberCountStoreHasMethod: safe(() => typeof memberCountStore()?.getMemberCount === "function"),
      memberCountRaw: safe(() => (guildId ? memberCountStore()?.getMemberCount?.(guildId) : null)),
      channelMemberStore: safe(() => channelMemberStore()?.getName?.() ?? null),
      rawGroups: safe(() =>
        guildId && channelId
          ? (channelMemberStore()?.getProps?.(guildId, String(channelId))?.groups ?? null)
          : null
      ),
      channelActionsFound: safe(() => typeof channelActions()?.preload === "function")
    },
    guildRecord: safe(() => {
      if (!guildId) return null;
      const guild = GuildStore.getGuild?.(guildId);
      if (!guild) return null;
      return {
        memberCount: guild.memberCount ?? null,
        approximateMemberCount: guild.approximateMemberCount ?? null,
        keys: Object.keys(guild).slice(0, 30)
      };
    }),
    captured: {
      total: guildId ? (totalByGuild.get(guildId) ?? null) : null,
      online: guildId ? (onlineByGuild.get(guildId) ?? null) : null,
      trackingActive: unsubscribes.length > 0,
      nudged: [...nudged]
    },
    /** Every store this client registered whose name mentions a count/member. */
    storeNameHints: safe(() =>
      storeNames().filter((n) => /member|count|presence|session/i.test(n))
    ),
    resolved: readCounts(channelId)
  };
}

/** 12345 -> "12.3k" / "12,345", depending on the user's preference. */
export function formatCount(value: number, abbreviate: boolean): string {
  if (!abbreviate) return value.toLocaleString("en-US");
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k < 10 ? k.toFixed(1) : Math.round(k)}k`;
  }
  const m = value / 1_000_000;
  return `${m < 10 ? m.toFixed(1) : Math.round(m)}m`;
}
