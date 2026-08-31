// Search and filtering for the message log.
//
// Pure on purpose: the log page hands in already-resolved guild/channel names
// and gets back "does this entry match" plus "where does it match" (for
// highlighting). Keeping it free of stores and React means the interesting rules
// — AND across terms, inclusive date bounds, which timestamp an entry is
// filtered by — can be tested directly instead of by clicking around.

import type { DeletedEntry, EditedEntry } from "./store";

export type LogEntry = DeletedEntry | EditedEntry;

/** How the text box is interpreted. */
export type MatchMode = "contains" | "phrase" | "regex";
export type SortOrder = "newest" | "oldest";

export interface SearchFilters {
  query: string;
  mode: MatchMode;
  /** Author name substring. */
  author: string;
  /** Guild or channel name substring. */
  location: string;
  /** Inclusive date bounds, `yyyy-mm-dd`, local time. Empty means unbounded. */
  from: string;
  to: string;
  sort: SortOrder;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  mode: "contains",
  author: "",
  location: "",
  from: "",
  to: "",
  sort: "newest"
};

/** Whether anything is actually narrowing the list. */
export function isFiltering(f: SearchFilters): boolean {
  return Boolean(f.query.trim() || f.author.trim() || f.location.trim() || f.from || f.to);
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TextMatcher {
  /** All terms present (AND), or the phrase/pattern matches. */
  test(text: string): boolean;
  /** Global regex for marking hits inside a string, or null when there is none. */
  highlight: RegExp | null;
  /** Set when `mode: "regex"` was given something that will not compile. */
  error?: string;
}

const MATCH_ALL: TextMatcher = { test: () => true, highlight: null };

/**
 * Compile the text query once per render rather than per entry.
 *
 * `contains` splits on whitespace and requires EVERY term — that is what makes a
 * two-word query useful on a log where the words are rarely adjacent. `phrase`
 * takes the box literally, including spaces and regex metacharacters. `regex`
 * hands the user's pattern through, and reports rather than throws when it is
 * half-typed, since the box is filtered on every keystroke.
 */
export function compileMatcher(query: string, mode: MatchMode): TextMatcher {
  const raw = query.trim();
  if (!raw) return MATCH_ALL;

  if (mode === "regex") {
    try {
      const re = new RegExp(raw, "i");
      return {
        test: (text) => re.test(text),
        highlight: new RegExp(raw, "gi")
      };
    } catch (err) {
      return { test: () => false, highlight: null, error: (err as Error)?.message ?? "无效的正则" };
    }
  }

  if (mode === "phrase") {
    const needle = raw.toLowerCase();
    return {
      test: (text) => text.toLowerCase().includes(needle),
      highlight: new RegExp(escapeRegExp(raw), "gi")
    };
  }

  const terms = raw.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase());
  return {
    test: (text) => {
      const haystack = text.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    },
    highlight: new RegExp(terms.map(escapeRegExp).join("|"), "gi")
  };
}

/** Every text an entry should be searchable by, including old edit versions. */
export function searchableText(entry: LogEntry, guild?: string, channel?: string): string {
  const parts: string[] = [entry.author?.name ?? ""];
  if (guild) parts.push(guild);
  if (channel) parts.push(channel);
  if ("content" in entry && typeof entry.content === "string") parts.push(entry.content);
  if ("history" in entry && Array.isArray(entry.history)) {
    for (const v of entry.history) if (v?.content) parts.push(v.content);
  }
  if ("stickers" in entry && Array.isArray(entry.stickers)) {
    for (const s of entry.stickers) if (s?.name) parts.push(s.name);
  }
  if ("attachments" in entry && Array.isArray(entry.attachments)) parts.push(...entry.attachments);
  return parts.join("\n");
}

/**
 * The moment an entry is filtered and sorted by: when it was deleted, or when it
 * was last edited. Falls back to the message's own send time so a malformed
 * record still lands somewhere sensible instead of at the epoch.
 */
export function entryTime(entry: LogEntry): number {
  const candidate =
    ("deletedAt" in entry ? entry.deletedAt : undefined) ??
    ("updatedAt" in entry ? entry.updatedAt : undefined) ??
    ("sentAt" in entry ? (entry as DeletedEntry).sentAt : undefined);
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;
}

/** `yyyy-mm-dd` → local start of that day, or null. */
export function dayStart(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** `yyyy-mm-dd` → local END of that day, so a `to` bound includes it. */
export function dayEnd(value: string): number | null {
  const start = dayStart(value);
  return start === null ? null : start + 24 * 60 * 60 * 1000 - 1;
}

export interface ResolvedLocation {
  guild?: string;
  channel?: string;
}

/** Does this entry survive every active filter? */
export function matchEntry(
  entry: LogEntry,
  filters: SearchFilters,
  matcher: TextMatcher,
  loc: ResolvedLocation
): boolean {
  const author = filters.author.trim().toLowerCase();
  if (author && !(entry.author?.name ?? "").toLowerCase().includes(author)) return false;

  const where = filters.location.trim().toLowerCase();
  if (where) {
    const hay = `${loc.guild ?? ""}\n${loc.channel ?? ""}`.toLowerCase();
    if (!hay.includes(where)) return false;
  }

  const at = entryTime(entry);
  const from = filters.from ? dayStart(filters.from) : null;
  if (from !== null && at < from) return false;
  const to = filters.to ? dayEnd(filters.to) : null;
  if (to !== null && at > to) return false;

  if (!filters.query.trim()) return true;
  return matcher.test(searchableText(entry, loc.guild, loc.channel));
}

/** Newest or oldest first, without mutating the store's array. */
export function sortEntries<T extends LogEntry>(entries: readonly T[], sort: SortOrder): T[] {
  const copy = entries.slice();
  copy.sort((a, b) => (sort === "newest" ? entryTime(b) - entryTime(a) : entryTime(a) - entryTime(b)));
  return copy;
}

/**
 * Split `text` into runs, marking which are hits. Returned as tuples rather than
 * React nodes so this file stays render-free (and testable).
 */
export function splitHighlights(text: string, highlight: RegExp | null): Array<{ text: string; hit: boolean }> {
  if (!highlight || !text) return [{ text, hit: false }];
  const re = new RegExp(highlight.source, highlight.flags.includes("g") ? highlight.flags : `${highlight.flags}g`);
  const out: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    // A zero-length match (an empty alternation, `a*`) would spin forever.
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (m.index > last) out.push({ text: text.slice(last, m.index), hit: false });
    out.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out.length ? out : [{ text, hit: false }];
}
