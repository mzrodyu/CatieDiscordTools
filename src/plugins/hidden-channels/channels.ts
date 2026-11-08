// Which guild channels exist that the current member cannot view.
//
// Discord only renders channels the member is allowed to see, but the channel
// *metadata* for every channel in a joined guild is already in the client's
// cache — the client needs it to evaluate permission overwrites. This module
// reads that cache and filters it with Discord's own permission engine, so the
// answer is exactly "channels the client knows about but refuses to show you".
// Nothing here talks to the API and nothing here can grant access: the plugin
// only lists names.

import {
  ChannelStore,
  GuildStore,
  GuildChannelStore,
  PermissionStore,
  SelectedChannelStore,
  SelectedGuildStore
} from "../../core/common/discord";

/** Channel type numbers that matter to the list (Discord's enum). */
export const CHANNEL_TYPES = {
  TEXT: 0,
  VOICE: 2,
  CATEGORY: 4,
  ANNOUNCEMENT: 5,
  STAGE: 13,
  DIRECTORY: 14,
  FORUM: 15,
  MEDIA: 16
} as const;

/** `Permissions.VIEW_CHANNEL` (1 << 10). Discord's client uses BigInt. */
const VIEW_CHANNEL = 1n << 10n;

/**
 * Virtual channel ids Discord uses for the server-guide surfaces. They are not
 * real snowflakes and are never viewable in the ordinary sense, so listing them
 * as "hidden channels" would just be noise.
 */
const VIRTUAL_CHANNEL_IDS = new Set(["browse", "customize", "guide"]);

/** How the channel list was obtained. Diagnostic only. */
export type ChannelSource = "channel-store" | "guild-record" | "visible-only" | "none";

export interface HiddenChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId: string | null;
}

export interface HiddenGroup {
  categoryId: string | null;
  categoryName: string;
  position: number;
  channels: HiddenChannel[];
}

export interface HiddenChannelsSnapshot {
  guildId: string | null;
  groups: HiddenGroup[];
  total: number;
  /** How many names are still Discord's "__hidden__" placeholder. */
  obfuscated: number;
  source: ChannelSource;
  /** True when at least one channel could be checked against the permission engine. */
  canChecked: boolean;
}

const EMPTY: HiddenChannelsSnapshot = {
  guildId: null,
  groups: [],
  total: 0,
  obfuscated: 0,
  source: "none",
  canChecked: false
};

/** The guild the user is looking at, or null in DMs. */
export function currentGuildId(): string | null {
  try {
    const selected = SelectedGuildStore.getGuildId?.();
    if (selected) return String(selected);
  } catch {
    // fall through to the channel-derived read
  }

  try {
    const channelId = SelectedChannelStore.getChannelId?.();
    if (channelId) {
      const channel = ChannelStore.getChannel?.(channelId);
      if (channel?.guild_id) return String(channel.guild_id);
    }
  } catch {
    // no guild
  }

  return null;
}

/**
 * Walk whatever shape a channel collection came back as and record every
 * channel record it contains. Discord has shipped this as a plain map, a Map,
 * and a bucket-of-arrays; tolerating all three costs little and keeps the
 * plugin working across client updates.
 */
function collectChannels(value: any, byId: Map<string, any>, depth = 0): void {
  if (value == null || depth > 5 || byId.size > 5000) return;

  if (Array.isArray(value)) {
    for (const item of value) collectChannels(item, byId, depth + 1);
    return;
  }
  if (value instanceof Map) {
    for (const item of value.values()) collectChannels(item, byId, depth + 1);
    return;
  }
  if (typeof value !== "object") return;

  // A channel record: stop here so we don't walk its internals.
  if (value.id != null) {
    byId.set(String(value.id), value);
    return;
  }
  // Bucket entry shape used by GuildChannelStore: { channel, comparator }.
  if (value.channel) {
    collectChannels(value.channel, byId, depth + 1);
    return;
  }

  let values: any[];
  try {
    values = Object.values(value);
  } catch {
    return;
  }
  for (const item of values) collectChannels(item, byId, depth + 1);
}

/**
 * Every channel the client has for this guild, including ones the member
 * cannot view, plus where the list came from. The visible-only fallback is a
 * degraded mode: it can never yield a hidden channel, but it lets the probe
 * distinguish "no hidden channels" from "the full map is unreadable".
 */
function readAllChannels(guildId: string): { channels: any[]; source: ChannelSource } {
  const byId = new Map<string, any>();

  // 1. The complete guild channel map — the data GuildChannelStore itself is
  //    built from, including channels the member cannot view.
  try {
    const value = (ChannelStore as any).getMutableGuildChannelsForGuild?.(guildId);
    if (value != null) {
      collectChannels(value, byId);
      if (byId.size > 0) return { channels: [...byId.values()], source: "channel-store" };
    }
  } catch {
    // try the next shape
  }

  // 1b. A possible rename of the same map. Treated as visible-only because we
  //     cannot prove this one is unfiltered.
  try {
    const value = (ChannelStore as any).getGuildChannels?.(guildId);
    if (value != null) {
      collectChannels(value, byId);
      if (byId.size > 0) return { channels: [...byId.values()], source: "visible-only" };
    }
  } catch {
    // fall through
  }

  // 2. The guild record's channel id list (older client shape).
  try {
    const guild = GuildStore.getGuild?.(guildId);
    const ids = guild?.channels;
    if (Array.isArray(ids)) {
      for (const id of ids) {
        try {
          const channel = ChannelStore.getChannel?.(id);
          if (channel?.id != null) byId.set(String(channel.id), channel);
        } catch {
          // skip one unreadable id
        }
      }
      if (byId.size > 0) return { channels: [...byId.values()], source: "guild-record" };
    }
  } catch {
    // fall through
  }

  // 3. The visible grouping. Degraded, but honest.
  try {
    collectChannels(GuildChannelStore.getChannels?.(guildId), byId);
    if (byId.size > 0) return { channels: [...byId.values()], source: "visible-only" };
  } catch {
    // fall through
  }

  return { channels: [], source: "none" };
}

/** Ids of channels Discord itself is currently rendering, used as a fallback. */
function readVisibleIds(guildId: string): Set<string> {
  const byId = new Map<string, any>();
  try {
    collectChannels(GuildChannelStore.getChannels?.(guildId), byId);
  } catch {
    // no fallback
  }
  return new Set(byId.keys());
}

/**
 * Whether the current member can view `channel`.
 *
 * Returns `null` when no source can answer. Unknown channels are excluded from
 * the list rather than guessed at — a false positive here would label a public
 * channel "hidden", which is worse than showing nothing.
 */
function canView(channel: any, visibleIds: Set<string>): boolean | null {
  try {
    if (typeof PermissionStore.can === "function") {
      const answer = PermissionStore.can(VIEW_CHANNEL, channel);
      if (typeof answer === "boolean") return answer;
    }
  } catch {
    // try the bitfield below
  }

  try {
    if (typeof PermissionStore.getChannelPermissions === "function") {
      const bits = PermissionStore.getChannelPermissions(channel);
      if (bits != null) return (BigInt(bits) & VIEW_CHANNEL) !== 0n;
    }
  } catch {
    // fall back to the visible set
  }

  // Last resort: what the client put in its own channel list. Only meaningful
  // when the list is non-empty.
  if (visibleIds.size > 0) return visibleIds.has(String(channel.id));
  return null;
}

function parentIdOf(channel: any): string | null {
  const id = channel?.parent_id ?? channel?.parentId;
  return id == null || id === "" ? null : String(id);
}

function nameOf(channel: any): string {
  const name = channel?.name;
  return typeof name === "string" && name.length > 0 ? name : String(channel?.id ?? "");
}

function positionOf(channel: any): number {
  const position = Number(channel?.position);
  return Number.isFinite(position) ? position : 0;
}

function compareEntries(
  a: { position: number; name: string },
  b: { position: number; name: string }
): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.name.localeCompare(b.name, "zh-CN");
}

/**
 * The hidden channels of `guildId`, grouped by category and ordered the way
 * Discord orders its own list.
 */
export function collectHiddenChannels(guildId: string | null): HiddenChannelsSnapshot {
  if (!guildId) return EMPTY;

  const { channels, source } = readAllChannels(guildId);
  if (source === "none") return { ...EMPTY, guildId, source };

  const visibleIds = source === "visible-only" ? new Set<string>() : readVisibleIds(guildId);

  const hidden: HiddenChannel[] = [];
  let canChecked = false;

  for (const channel of channels) {
    const type = Number(channel?.type);
    // Categories are group headers, not rows. Directories are guild-discovery
    // entries with no readable content, and the guide surfaces are virtual.
    if (type === CHANNEL_TYPES.CATEGORY || type === CHANNEL_TYPES.DIRECTORY) continue;
    if (VIRTUAL_CHANNEL_IDS.has(String(channel?.id))) continue;

    const view = canView(channel, visibleIds);
    if (view !== null) canChecked = true;
    if (view !== false) continue;

    hidden.push({
      id: String(channel.id),
      name: nameOf(channel),
      type: Number.isFinite(type) ? type : -1,
      position: positionOf(channel),
      parentId: parentIdOf(channel)
    });
  }

  // Group by parent category, resolving the category's own name and position.
  const groupsById = new Map<string, HiddenGroup>();
  for (const channel of hidden) {
    const key = channel.parentId ?? "";
    let group = groupsById.get(key);
    if (!group) {
      let category: any = null;
      if (channel.parentId) {
        try {
          category = ChannelStore.getChannel?.(channel.parentId) ?? null;
        } catch {
          category = null;
        }
      }
      group = {
        categoryId: channel.parentId,
        categoryName: category ? nameOf(category) : "未分类",
        position: category ? positionOf(category) : Number.MAX_SAFE_INTEGER,
        channels: []
      };
      groupsById.set(key, group);
    }
    group.channels.push(channel);
  }

  const groups = [...groupsById.values()];
  for (const group of groups) group.channels.sort(compareEntries);
  groups.sort((a, b) =>
    compareEntries(
      { position: a.position, name: a.categoryName },
      { position: b.position, name: b.categoryName }
    )
  );

  return {
    guildId,
    groups,
    total: hidden.length,
    obfuscated: hidden.filter((channel) => channel.name === "__hidden__").length,
    source,
    canChecked
  };
}

/** Stable key for change detection, so a poll doesn't re-render forever. */
export function snapshotKey(snapshot: HiddenChannelsSnapshot): string {
  const groups = snapshot.groups
    .map(
      (group) =>
        `${group.categoryId ?? ""}:${group.categoryName}:` +
        group.channels
          .map((channel) => `${channel.id}:${channel.type}:${channel.position}:${channel.name}`)
          .join(",")
    )
    .join(";");
  return `${snapshot.guildId ?? ""}|${snapshot.total}|${snapshot.obfuscated}|${snapshot.source}|${groups}`;
}
