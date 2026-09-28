// Reading custom emoji out of the servers you're in, plus the little value
// types the quick-react plugin passes around.
//
// The point the user cares about: two emoji can share a NAME but have different
// IDs (the same "BAKA" uploaded to eight servers). Discord keys reactions by id,
// so those are eight distinct reactions you can stack on one message. Everything
// here therefore carries the id, never just the name.

import { EmojiStore, GuildStore } from "../../core/common/discord";
import { emojiCdnUrl } from "../../core/common/cdn";

/** One configured reaction. `id: ""` means a unicode emoji (keyed by name). */
export interface ReactionEmoji {
  id: string;
  name: string;
  animated: boolean;
}

export interface GuildEmojiGroup {
  guildId: string;
  guildName: string;
  emojis: ReactionEmoji[];
}

/** CDN image for a custom emoji; null for unicode (it has no image). */
export function emojiImageUrl(e: ReactionEmoji, size = 32): string | null {
  return e.id ? emojiCdnUrl(e.id, e.animated, size) : null;
}

/** Stable key for de-dup / selection: `name:id` for custom, the char otherwise. */
export function reactionKey(e: ReactionEmoji): string {
  return e.id ? `${e.name}:${e.id}` : e.name;
}

function guildName(guildId: string): string {
  try {
    const g = GuildStore.getGuild?.(guildId) ?? (GuildStore.getGuilds?.() ?? {})[guildId];
    return String(g?.name ?? guildId);
  } catch {
    return guildId;
  }
}

/** Normalise one raw emoji record from a store into our shape, or null. */
function fromRecord(e: any): ReactionEmoji | null {
  if (!e?.id || !e?.name) return null; // no id -> unicode/managed junk, skip here
  if (e.available === false) return null; // lost boost / deleted -> can't react with it
  return { id: String(e.id), name: String(e.name), animated: Boolean(e.animated) };
}

/**
 * All custom emoji from the servers you're in, grouped by server. Prefers
 * `EmojiStore.getGuilds()` (a `{ [guildId]: { emojis } }` map); if that build
 * doesn't expose it, falls back to walking GuildStore's ids through
 * `getGuildEmoji`.
 */
export function collectGuildEmojis(): GuildEmojiGroup[] {
  const groups: GuildEmojiGroup[] = [];

  let byGuild: Record<string, any> = {};
  try {
    byGuild = EmojiStore.getGuilds?.() ?? {};
  } catch {
    byGuild = {};
  }

  const push = (guildId: string, list: any[]): void => {
    const emojis: ReactionEmoji[] = [];
    for (const e of list) {
      const r = fromRecord(e);
      if (r) emojis.push(r);
    }
    if (emojis.length) groups.push({ guildId, guildName: guildName(guildId), emojis });
  };

  const entries = Object.entries(byGuild);
  if (entries.length) {
    for (const [guildId, data] of entries) {
      const list = Array.isArray(data) ? data : Array.isArray(data?.emojis) ? data.emojis : [];
      push(guildId, list);
    }
  } else {
    // Fallback: no getGuilds() on this build.
    try {
      const guilds = GuildStore.getGuilds?.() ?? {};
      for (const guildId of Object.keys(guilds)) {
        const list = EmojiStore.getGuildEmoji?.(guildId) ?? [];
        if (Array.isArray(list)) push(guildId, list);
      }
    } catch {
      // give up quietly; caller shows an empty picker
    }
  }

  groups.sort((a, b) => a.guildName.localeCompare(b.guildName, "zh-CN"));
  return groups;
}

/** Parse a manually-typed entry: a unicode emoji, or `<:name:id>` / `<a:name:id>`. */
export function parseManualEmoji(raw: string): ReactionEmoji | null {
  const s = raw.trim();
  if (!s) return null;
  const m = /^<(a)?:(\w+):(\d+)>$/.exec(s);
  if (m) return { id: m[3], name: m[2], animated: m[1] === "a" };
  if (/^\d{5,25}$/.test(s)) return null; // a bare id has no name to react with
  return { id: "", name: s, animated: false };
}
