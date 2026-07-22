// The actual "mark everything read" work.
//
// Discord's own client marks a single channel read by dispatching an ack, and
// marks many at once with a single BULK_ACK action — the same path the
// "Mark as read" button in the guild context menu funnels into. We assemble the
// full channel list ourselves (every selectable text channel + voice text chat
// across every joined guild that still has something unread) and hand it to
// BULK_ACK in one dispatch, so the whole account goes quiet in a single frame
// instead of one request per channel.
//
// This is faithful to Vencord's ReadAllNotificationsButton: read state comes
// from ReadStateStore, the channel grouping from GuildChannelStore, and the
// unread cursor (lastMessageId) is what each ack is pinned to.

import {
  GuildStore,
  GuildChannelStore,
  ReadStateStore,
  ActiveJoinedThreadsStore
} from "../../core/common/discord";
import { flux } from "../../core/flux";
import { logger } from "../../core/logger";

const log = logger("mark-all-read");

interface AckChannel {
  channelId: string;
  messageId: string | null;
  readStateType: number;
}

interface Collected {
  channels: AckChannel[];
  /** Distinct guilds that contributed at least one unread channel. */
  guilds: number;
}

/**
 * Collect every unread channel across all joined guilds into the BULK_ACK
 * shape. A channel is included only if ReadStateStore still reports it unread,
 * so we never ack channels that are already clean.
 */
let shapeLogged = false;

/**
 * Pull a channel id out of one bucket entry, tolerating both shapes Discord has
 * shipped: a `{ channel, comparator }` wrapper (what Vencord assumes) and a bare
 * channel object. Getting this wrong is what made a full scan collect zero — the
 * wrong path yields `undefined` for every id.
 */
function channelIdOf(entry: any): string | undefined {
  return entry?.channel?.id ?? entry?.id;
}

function collectUnread(): Collected {
  const channels: AckChannel[] = [];
  const guildsWithUnread = new Set<string>();

  const guilds = GuildStore.getGuilds?.() ?? {};
  for (const guildId of Object.keys(guilds)) {
    let grouped: any;
    try {
      grouped = GuildChannelStore.getChannels?.(guildId);
    } catch (err) {
      log.warn(`could not read channels for guild ${guildId}`, err);
      continue;
    }
    if (!grouped) continue;

    // Push `channelId` onto the ack list if it is still unread. Returns whether
    // anything was added, so the guild can be counted.
    const ackIfUnread = (id: string | undefined): boolean => {
      if (!id) return false;
      try {
        if (!ReadStateStore.hasUnread?.(id)) return false;
      } catch {
        return false;
      }
      channels.push({
        channelId: id,
        messageId: ReadStateStore.lastMessageId?.(id) ?? null,
        readStateType: 0
      });
      return true;
    };

    // One-shot: dump the real shape of what getChannels returns. We assumed
    // Vencord's SELECTABLE/VOCAL keys, but a scan that finds nothing across
    // every guild means those keys aren't populated here — so log the actual
    // keys and each value's kind/length to see the real structure.
    if (!shapeLogged) {
      shapeLogged = true;
      try {
        const desc = Object.keys(grouped)
          .map((k) => {
            const v = (grouped as any)[k];
            if (Array.isArray(v)) return `${k}:array(${v.length})`;
            return `${k}:${typeof v}`;
          })
          .join(", ");
        log.info(`getChannels shape for guild ${guildId} — { ${desc} }`);
        // Also surface the first array entry's own keys, wherever it lives.
        for (const k of Object.keys(grouped)) {
          const v = (grouped as any)[k];
          if (Array.isArray(v) && v.length > 0) {
            log.info(`  first "${k}" entry keys=[${Object.keys(v[0]).join(",")}]`);
            break;
          }
        }
      } catch (err) {
        log.warn("could not describe getChannels shape", err);
      }
    }

    // SELECTABLE = text channels; VOCAL = voice channels (which have a text
    // chat that can carry unreads too).
    const buckets = [grouped.SELECTABLE, grouped.VOCAL].filter(Array.isArray);

    for (const bucket of buckets) {
      for (const entry of bucket) {
        if (ackIfUnread(channelIdOf(entry))) guildsWithUnread.add(guildId);
      }
    }

    // Joined threads carry their own read state too (Vencord acks these as
    // well). The store returns a map of parentChannelId -> { threadId: thread },
    // so flatten one level to reach each thread channel.
    try {
      const threadGroups = ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild?.(guildId);
      if (threadGroups && typeof threadGroups === "object") {
        for (const group of Object.values(threadGroups)) {
          if (!group || typeof group !== "object") continue;
          for (const thread of Object.values(group as Record<string, any>)) {
            if (ackIfUnread(thread?.channel?.id ?? thread?.id)) guildsWithUnread.add(guildId);
          }
        }
      }
    } catch (err) {
      log.warn(`could not read joined threads for guild ${guildId}`, err);
    }
  }

  return { channels, guilds: guildsWithUnread.size };
}

export interface MarkAllResult {
  /** How many channels were acked. */
  channels: number;
  /** How many distinct guilds those channels spanned. */
  guilds: number;
}

/**
 * One-shot resolution check. Logs whether each store this feature depends on
 * actually resolved on this build, so a silent "clicked, nothing happened" can
 * be told apart from "resolved fine, but genuinely nothing was unread".
 */
function diagnoseStores(): void {
  const probe = (label: string, method: unknown) =>
    `${label}=${typeof method === "function" ? "ok" : "MISSING"}`;
  log.info(
    "store check — " +
      [
        probe("GuildStore.getGuilds", GuildStore.getGuilds),
        probe("GuildChannelStore.getChannels", GuildChannelStore.getChannels),
        probe("ReadStateStore.hasUnread", ReadStateStore.hasUnread),
        probe("ReadStateStore.lastMessageId", ReadStateStore.lastMessageId),
        probe(
          "ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild",
          ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild
        )
      ].join(", ")
  );
}

/**
 * Mark every unread channel in every joined guild as read. Returns a summary of
 * what was acked; a zero-channel result means nothing was unread.
 */
export function markAllRead(): MarkAllResult {
  diagnoseStores();

  const guildCount = Object.keys(GuildStore.getGuilds?.() ?? {}).length;
  const { channels, guilds } = collectUnread();
  log.info(`scanned ${guildCount} guild(s); found ${channels.length} unread channel(s)`);

  if (channels.length === 0) {
    log.info("nothing unread; skipping BULK_ACK");
    return { channels: 0, guilds: 0 };
  }

  flux.dispatch({
    type: "BULK_ACK",
    context: "APP",
    channels
  });

  log.info(`BULK_ACK dispatched for ${channels.length} channel(s) across ${guilds} guild(s)`);
  return { channels: channels.length, guilds };
}
