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
  author: Author;
  /** Oldest first; the last item is the most recent superseded version. */
  history: Array<{ content: string; at: number }>;
  updatedAt: number;
}

interface Persisted {
  deleted: DeletedEntry[];
  edited: EditedEntry[];
}

class MessageLogStore {
  private deleted: DeletedEntry[] = [];
  private edited: EditedEntry[] = [];
  private retention = 50;
  private readonly listeners = new Set<() => void>();
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** `${channelId}:${id}` of every deleted entry — for per-render lookups. */
  private deletedIndex = new Set<string>();

  /** Load persisted history. Safe to call before the first record. */
  load(): void {
    const raw = loadNamespace(DATA_NS) as Partial<Persisted>;
    this.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
    this.edited = Array.isArray(raw.edited) ? raw.edited : [];
    this.trimDeleted();
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
    this.retention = Math.max(0, n | 0);
    this.trimDeleted();
    this.reindex();
    this.scheduleSave();
    this.emit();
  }

  recordDeleted(entry: DeletedEntry): void {
    if (this.deleted.some((d) => d.id === entry.id)) return;
    this.deleted.unshift(entry);
    this.trimDeleted();
    this.reindex();
    this.scheduleSave();
    this.emit();
  }

  recordEdit(id: string, channelId: string, author: Author, previous: string): void {
    const now = Date.now();
    let entry = this.edited.find((e) => e.id === id);

    if (!entry) {
      entry = { id, channelId, author, history: [{ content: previous, at: now }], updatedAt: now };
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

  clear(): void {
    this.deleted = [];
    this.edited = [];
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

  /** Flush any pending save immediately (used on plugin stop). */
  flush(): void {
    if (this.saveTimer !== undefined) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    this.save();
  }

  // --- internals -----------------------------------------------------------

  private trimDeleted(): void {
    if (this.retention <= 0) return; // unlimited
    const perChannel = new Map<string, number>();
    this.deleted = this.deleted.filter((d) => {
      const seen = perChannel.get(d.channelId) ?? 0;
      if (seen >= this.retention) return false;
      perChannel.set(d.channelId, seen + 1);
      return true;
    });
  }

  private reindex(): void {
    this.deletedIndex = new Set(this.deleted.map((d) => `${d.channelId}:${d.id}`));
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
    if (this.saveTimer !== undefined) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 500);
  }

  private save(): void {
    try {
      saveNamespace(DATA_NS, { deleted: this.deleted, edited: this.edited });
    } catch (err) {
      log.error("failed to persist message log", err);
    }
  }
}

export const messageLog = new MessageLogStore();
