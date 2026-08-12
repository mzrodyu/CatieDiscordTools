// The record store behind message-logger.
//
// Everything the plugin captures — deleted messages and edit histories — lands
// here, deduplicated, capped per channel, and persisted so a relaunch does not
// lose recent history. The store is deliberately independent of Discord's own
// message cache: once we snapshot a message it is ours, even after Discord drops
// it. UI subscribes for live updates.

import { loadNamespace, saveNamespace } from "../../core/settings/storage";
import { logger } from "../../core/logger";

const log = logger("message-logger");
const DATA_NS = "message-logger.log";

export interface Author {
  id: string;
  name: string;
  bot: boolean;
}

export interface RichAttachment {
  id?: string;
  filename?: string;
  url?: string;
  proxy_url?: string;
  content_type?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface DeletedEntry {
  id: string;
  channelId: string;
  guildId?: string;
  author: Author;
  content: string;
  attachments: string[];
  /** Full attachment records (URLs and all), enough to re-render on revive. */
  attachmentsRich?: RichAttachment[];
  /** Trimmed embeds (GIF-picker media among them), JSON-cloned off the message. */
  embeds?: any[];
  /** Raw sticker items (id/name/format_type), enough to re-render on revive. */
  stickers?: Array<{ id: string; name: string; format_type?: number }>;
  sentAt: number;
  deletedAt: number;
}

export interface EditedEntry {
  id: string;
  channelId: string;
  guildId?: string;
  author: Author;
  /** Oldest first; the last item is the most recent superseded version. */
  history: Array<{ content: string; at: number }>;
  updatedAt: number;
}

interface Persisted {
  deleted: DeletedEntry[];
  edited: EditedEntry[];
}

/** Save debounce, and the longest a change may sit unwritten during a flood. */
const SAVE_DEBOUNCE = 500;
const MAX_SAVE_WAIT = 3000;

/**
 * Serialized-size ceiling for the persisted log (bytes of JSON).
 *
 * Comfortably under localStorage's ~5MB and chrome.storage.local's default
 * quota, with room for Halcyon's other namespaces. See withinBudget().
 */
const SIZE_BUDGET = 3_000_000;

class MessageLogStore {
  private deleted: DeletedEntry[] = [];
  private edited: EditedEntry[] = [];
  /**
   * Per-channel cap; 0 means unlimited. Starts UNLIMITED on purpose. `load()`
   * used to trim with whatever this default was, i.e. BEFORE the plugin had
   * applied the user's setting — so a user who set 500 (precisely because of a
   * 冲水) still had the log cut to the default on every launch, and the next
   * save wrote that truncation back to disk permanently. It can now only ever
   * narrow from setRetention(), i.e. from a value the user actually chose.
   */
  private retention = 0;
  private readonly listeners = new Set<() => void>();
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** `${channelId}:${id}` of every deleted entry — for per-render lookups. */
  private deletedIndex = new Set<string>();
  /**
   * Deleted-entry count per channel. Lets an insert know whether a trim is even
   * possible without scanning the whole log: a 200-message flush used to pay a
   * full filter + Set rebuild per delete, inside Discord's dispatch.
   */
  private channelCounts = new Map<string, number>();
  /** When the oldest still-unwritten change happened (max-wait accounting). */
  private deferredSince: number | undefined;
  /** Set by clear(): the only case where persisting an empty log is intended. */
  private userCleared = false;
  /** Last prune summary, so a repeated oversized save doesn't repeat the warning. */
  private lastPruneNote = "";

  /** Load persisted history. Safe to call before the first record. */
  load(): void {
    const raw = loadNamespace(DATA_NS) as Partial<Persisted>;
    this.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
    this.edited = Array.isArray(raw.edited) ? raw.edited : [];
    // Deliberately NO trim here — see the `retention` field above.
    this.userCleared = false;
    this.reindex();
  }

  /** O(1) "was this message deleted" — cheap enough for render paths. */
  isDeleted(channelId: string, id: string): boolean {
    return this.deletedIndex.has(`${channelId}:${id}`);
  }

  /** The deleted-entry record for a message, if any. */
  findDeleted(channelId: string, id: string): DeletedEntry | undefined {
    if (!this.isDeleted(channelId, id)) return undefined;
    return this.deleted.find((d) => d.channelId === channelId && d.id === id);
  }

  setRetention(n: number): void {
    const next = Math.max(0, n | 0);
    if (next === this.retention) return; // nothing changed; don't churn a save
    this.retention = next;
    if (this.trimDeleted()) this.reindex();
    this.scheduleSave();
    this.emit();
  }

  recordDeleted(entry: DeletedEntry): void {
    // Keyed by channel+id, matching the index: ids are globally unique
    // snowflakes, but this is also what makes the check O(1) instead of a scan
    // over the whole log on every single delete of a 200-message flush.
    if (this.deletedIndex.has(`${entry.channelId}:${entry.id}`)) return;
    this.deleted.unshift(entry);
    this.deletedIndex.add(`${entry.channelId}:${entry.id}`);
    this.channelCounts.set(entry.channelId, (this.channelCounts.get(entry.channelId) ?? 0) + 1);
    // Only pay for a full trim+reindex when this channel is actually at its cap.
    if (this.retention > 0 && (this.channelCounts.get(entry.channelId) ?? 0) > this.retention) {
      if (this.trimDeleted()) this.reindex();
    }
    this.scheduleSave();
    this.emit();
  }

  recordEdit(id: string, channelId: string, author: Author, previous: string, guildId?: string): void {
    const now = Date.now();
    let entry = this.edited.find((e) => e.id === id);

    if (!entry) {
      entry = { id, channelId, guildId, author, history: [{ content: previous, at: now }], updatedAt: now };
      this.edited.unshift(entry);
    } else {
      const last = entry.history[entry.history.length - 1];
      if (last?.content === previous) return; // nothing new
      entry.history.push({ content: previous, at: now });
      entry.updatedAt = now;
    }

    if (this.edited.length > 300) this.edited.length = 300;
    this.scheduleSave();
    this.emit();
  }

  getDeleted(): readonly DeletedEntry[] {
    return this.deleted;
  }

  getEdited(): readonly EditedEntry[] {
    return this.edited;
  }

  counts(): { deleted: number; edited: number } {
    return { deleted: this.deleted.length, edited: this.edited.length };
  }

  /**
   * Empty the log. `what` scopes it to one list — the page's 清空 button sits in
   * a shared tab bar, so an unscoped clear from the 已编辑 tab used to destroy
   * every recorded deletion too, which reads exactly like the plugin eating
   * messages.
   */
  clear(what: "all" | "deleted" | "edited" = "all"): void {
    if (what !== "edited") this.deleted = [];
    if (what !== "deleted") this.edited = [];
    this.userCleared = this.deleted.length === 0 && this.edited.length === 0;
    this.reindex();
    this.scheduleSave();
    this.emit();
  }

  toJSON(): string {
    return JSON.stringify({ deleted: this.deleted, edited: this.edited }, null, 2);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** Flush any pending save immediately (plugin stop, and page unload). */
  flush(): void {
    if (this.saveTimer !== undefined) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    this.save();
  }

  // --- internals -----------------------------------------------------------

  /**
   * Drop entries beyond the per-channel cap, newest kept. Returns whether
   * anything was actually removed, so callers can skip the index rebuild.
   *
   * Trims by RECENCY, not array position: `deleted` is maintained newest-first
   * by unshift, but a bulk delete whose ids arrive newest-first (or a record
   * spliced in out of order) could otherwise evict a NEWER entry than the one it
   * kept. Sorting the per-channel view by deletedAt makes the cap mean what the
   * setting says: keep the most recent N for this channel.
   */
  private trimDeleted(): boolean {
    if (this.retention <= 0) return false; // unlimited
    const byChannel = new Map<string, DeletedEntry[]>();
    for (const d of this.deleted) {
      let list = byChannel.get(d.channelId);
      if (!list) byChannel.set(d.channelId, (list = []));
      list.push(d);
    }

    const doomed = new Set<DeletedEntry>();
    for (const list of byChannel.values()) {
      if (list.length <= this.retention) continue;
      // Newest first by deletion time, ties broken by id (snowflakes are
      // chronological), so "keep N" keeps the N most recent.
      const ranked = list.slice().sort((a, b) => (b.deletedAt - a.deletedAt) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
      for (const d of ranked.slice(this.retention)) doomed.add(d);
    }
    if (doomed.size === 0) return false;

    this.deleted = this.deleted.filter((d) => !doomed.has(d));
    this.recount();
    return true;
  }

  /** Rebuild the per-channel counters from `deleted`. */
  private recount(): void {
    this.channelCounts.clear();
    for (const d of this.deleted) {
      this.channelCounts.set(d.channelId, (this.channelCounts.get(d.channelId) ?? 0) + 1);
    }
  }

  private reindex(): void {
    this.deletedIndex = new Set(this.deleted.map((d) => `${d.channelId}:${d.id}`));
    this.recount();
  }

  private emit(): void {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {
        // a broken subscriber must not stop the store
      }
    }
  }

  private scheduleSave(): void {
    // Debounce, but with a ceiling. The plain debounce restarted its 500ms timer
    // on every record, so a sustained flood (a 冲水 deletes faster than that)
    // NEVER reached a save: closing or reloading the client mid-flood lost
    // everything since the last write. Past MAX_SAVE_WAIT the pending save is
    // allowed to land even though changes are still arriving.
    if (this.deferredSince === undefined) this.deferredSince = Date.now();
    if (Date.now() - this.deferredSince >= MAX_SAVE_WAIT) {
      this.flush();
      return;
    }
    if (this.saveTimer !== undefined) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE);
  }

  private save(): void {
    this.saveTimer = undefined;
    this.deferredSince = undefined;
    try {
      // Refuse to overwrite a non-empty stored log with an empty one. The
      // extension's storage mirror hydrates asynchronously and settles even when
      // the hydrate never arrived, so load() could legitimately see nothing;
      // the first scheduleSave() then wrote {deleted:[],edited:[]} over the real
      // data and the whole log was gone for good. Only an explicit 清空 may empty it.
      if (this.deleted.length === 0 && this.edited.length === 0 && !this.userCleared) {
        const stored = loadNamespace(DATA_NS) as Partial<Persisted>;
        const hadData =
          (Array.isArray(stored.deleted) && stored.deleted.length > 0) ||
          (Array.isArray(stored.edited) && stored.edited.length > 0);
        if (hadData) {
          log.warn("跳过一次保存：内存中的记录为空，但磁盘上有记录，拒绝覆盖（存储尚未就绪？）");
          return;
        }
      }

      const payload = this.withinBudget();
      saveNamespace(DATA_NS, { deleted: payload.deleted, edited: payload.edited });
    } catch (err) {
      log.error("failed to persist message log", err);
    }
  }

  /**
   * The payload to persist, shrunk to fit `SIZE_BUDGET`.
   *
   * Neither backend survives an oversized write, and neither reports it usefully:
   * localStorage throws QuotaExceededError (caught and logged, then every
   * subsequent save fails too), and the extension's chrome.storage bridge writes
   * without reading `runtime.lastError` at all — so the log looks perfect all
   * session and silently reverts on the next launch. A heavy account serializes
   * to well over the quota, mostly embeds. Shedding weight, loudly, beats losing
   * the lot: embeds go first (they only enrich a revived row), then the oldest
   * entries.
   */
  private withinBudget(): Persisted {
    let deleted = this.deleted;
    const edited = this.edited;
    const size = (d: DeletedEntry[]): number => JSON.stringify({ deleted: d, edited }).length;

    if (size(deleted) <= SIZE_BUDGET) {
      this.lastPruneNote = "";
      return { deleted, edited };
    }

    // 1. Drop embeds from the oldest entries first (kept newest-first, so walk
    //    backwards). Attachments stay: they're what a revived row shows.
    let strippedEmbeds = 0;
    deleted = deleted.map((d) => d);
    for (let i = deleted.length - 1; i >= 0 && size(deleted) > SIZE_BUDGET; i--) {
      const d = deleted[i];
      if (!d.embeds?.length) continue;
      deleted[i] = { ...d, embeds: undefined };
      strippedEmbeds++;
    }

    // 2. Still too big: drop the oldest entries outright.
    let droppedEntries = 0;
    while (deleted.length > 1 && size(deleted) > SIZE_BUDGET) {
      // Chop in chunks; re-serializing per entry on a huge log is far too slow.
      const chop = Math.max(1, Math.floor(deleted.length * 0.1));
      deleted = deleted.slice(0, deleted.length - chop);
      droppedEntries += chop;
    }

    const note = `${strippedEmbeds}/${droppedEntries}`;
    if (note !== this.lastPruneNote) {
      this.lastPruneNote = note;
      log.warn(
        `消息记录超出存储预算（${Math.round(SIZE_BUDGET / 1024)}KB），已裁剪后保存：` +
          `丢弃 ${strippedEmbeds} 条旧记录的 embed，删除 ${droppedEntries} 条最旧记录。` +
          `内存中仍保留 ${this.deleted.length} 条；如需长期保留请调低「每频道保留条数」或定期导出。`
      );
    }
    return { deleted, edited };
  }
}

export const messageLog = new MessageLogStore();
