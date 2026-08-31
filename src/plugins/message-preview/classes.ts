// Discord's own markdown container class.
//
// This is what made `# 大字报` render as plain text even after the parser was
// producing real heading elements: Discord scopes ALL of its markdown styling
// under a container class — headings, `-#` subtext, italics, spoiler blocks,
// blockquotes, code — so the same elements outside that container come out
// unstyled and everything collapses onto one line.
//
// The class is hashed per build (`markup__75297` today), so it is found by
// VALUE, not by name: a module whose exports carry both a `markup…` and an
// `inlineFormat…` string is Discord's markdown stylesheet map. The pair matters
// — either alone appears in other class maps too.

import { find } from "../../core/modules/webpack";
import { logger } from "../../core/logger";

const log = logger("message-preview");

let checked = false;
let cached = "";

/**
 * Whether `m` is Discord's markdown stylesheet map. Exported so the pair
 * requirement can be tested: either name alone shows up in other class maps too,
 * and picking the wrong map silently produces an unstyled preview.
 */
export function looksLikeMarkupClasses(m: any): boolean {
  if (typeof m !== "object" || m === null) return false;
  // Reject Discord's answer-everything intl proxy, same guard as everywhere else.
  if (typeof m.__halcyon_probe__ !== "undefined") return false;
  let markup = false;
  let inlineFormat = false;
  for (const value of Object.values(m)) {
    if (typeof value !== "string") continue;
    if (/^markup[-_]/.test(value)) markup = true;
    else if (/^inlineFormat[-_]/.test(value)) inlineFormat = true;
    if (markup && inlineFormat) return true;
  }
  return false;
}

/** The `markup…` value out of a class map, ignoring its siblings. */
export function pickMarkupClass(m: any): string {
  for (const value of Object.values(m ?? {})) {
    if (typeof value === "string" && /^markup[-_]/.test(value)) return value;
  }
  return "";
}

/**
 * Discord's markdown container class, or "" if this build's class map moved.
 * Empty is a degraded-but-working preview (structure right, styling plain)
 * rather than a broken one, so callers just concatenate it.
 */
export function markupClass(): string {
  if (checked) return cached;
  checked = true;
  try {
    const mod = find(looksLikeMarkupClasses);
    if (mod) cached = pickMarkupClass(mod);
  } catch {
    cached = "";
  }
  if (!cached) {
    log.debug("未找到 Discord 的 markup 容器类，预览将显示为无样式文本（结构正确、字号/斜体等不生效）");
  }
  return cached;
}
