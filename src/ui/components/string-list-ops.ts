// Pure list operations behind StringListEditor.
//
// Split out so the rules can be tested without a browser: the interesting cases
// are not "does it render" but "what happens when an edit leaves the row empty,
// or turns it into a duplicate of another row". Getting those wrong silently
// eats a user's entry.

/** Replace one entry, verbatim — no trimming, so typing a space still works. */
export function updateAt(list: readonly string[], index: number, next: string): string[] {
  const copy = list.slice();
  copy[index] = next;
  return copy;
}

/** Drop one entry. */
export function removeAt(list: readonly string[], index: number): string[] {
  return list.filter((_, i) => i !== index);
}

/**
 * Settle an entry after editing: trim it, and drop the row entirely if that
 * leaves it empty or makes it a duplicate of another row. Returns the list
 * unchanged (same array identity is not promised, but contents are) when there
 * is nothing to do.
 */
export function normalizeAt(list: readonly string[], index: number): string[] {
  if (index < 0 || index >= list.length) return list.slice();
  const trimmed = (list[index] ?? "").trim();
  const others = list.filter((_, i) => i !== index).map((v) => v.trim());
  if (!trimmed || others.includes(trimmed)) return removeAt(list, index);
  return trimmed === list[index] ? list.slice() : updateAt(list, index, trimmed);
}

/** Append a new entry, ignoring blanks and duplicates. */
export function appendEntry(list: readonly string[], raw: string): string[] | null {
  const next = raw.trim();
  if (!next || list.includes(next)) return null;
  return [...list, next];
}
