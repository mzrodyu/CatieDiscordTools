// Which expression did the user right-click — and what is it really called?
//
// emote-cloner deliberately does not capture Discord's internal context-menu
// arguments (that needs a broad, fragile source patch), so it works from the
// clicked DOM node. Finding the *id* that way is easy: it sits in the CDN url or
// in a dataset. Finding the *name* is the part that kept failing — every clone
// landed as "emoji" — because none of the obvious DOM sources is reliable:
//
//   * A reaction's <img> has `alt=""`, and the name only appears on an ancestor's
//     aria-label as "nailong_cute, 2 reactions, press to react" — not a usable
//     name, and blindly sanitising it produces "nailong_cute__2_reactions_".
//   * `?name=` is not present on every build's emoji url, and `data-name` is not
//     on every build's message emoji.
//   * EmojiStore only knows emojis from servers you are *in*, which is the
//     opposite of the usual clone case.
//
// So the name is resolved from several sources, most trustworthy first:
//
//   1. The React fiber behind the clicked node — the actual emoji/sticker record
//      Discord rendered, found by matching its id. Works for messages,
//      reactions, the emoji picker and autocomplete alike.
//   2. The message the click landed in: `<a?:name:id>` in its content, its
//      reactions, or its sticker items.
//   3. EmojiStore, by id (authoritative for servers you are in).
//   4. DOM attributes near the click (`data-name`, `alt`, `aria-label`, `title`).
//   5. The `?name=` query parameter on the CDN url.
//
// Every candidate is *validated* as a real Discord emoji name rather than
// sanitised into nonsense, so a bad source is skipped instead of winning.

import { EmojiStore, MessageStore, SelectedChannelStore } from "../../core/common/discord";
import { getFiberPropsChain } from "../../core/common/react";
import { logger } from "../../core/logger";

const log = logger("emote-cloner");

export interface EmojiHit {
  kind: "emoji";
  id: string;
  name: string;
  isAnimated: boolean;
}

export interface StickerHit {
  kind: "sticker";
  id: string;
  name?: string;
}

export type ExpressionHit = EmojiHit | StickerHit;

/** Discord snowflake, as it appears in a CDN path or a dataset. */
const SNOWFLAKE = /^\d{5,25}$/;

/**
 * A valid custom-emoji name: word characters only, plus Discord's `~1`
 * disambiguation suffix. Anything else (a reaction's "name, 2 reactions, press
 * to react", a unicode emoji's alt text, an empty string) is rejected.
 */
const EMOJI_NAME = /^\w{1,32}(?:~\d+)?$/;

/** Clean a `:name:` style string down to `name`, or undefined if it isn't one. */
function emojiName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const n = raw.replace(/:/g, "").trim();
  return EMOJI_NAME.test(n) ? n : undefined;
}

/** Sticker names allow spaces and punctuation, so they only get a length check. */
function stickerName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const n = raw.trim();
  return n && n.length <= 30 && !n.includes("\n") ? n : undefined;
}

// --- url / dom plumbing ----------------------------------------------------

/** Whether a CDN url points at an animated asset (gif, or animated=true). */
function isGifUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, location.href);
    return u.pathname.endsWith(".gif") || u.searchParams.get("animated") === "true";
  } catch {
    return /\.gif(\?|$)/.test(url) || url.includes("animated=true");
  }
}

function parseEmojiUrl(src: string): { id: string; isAnimated: boolean; name?: string } | null {
  const m = src.match(/\/emojis\/(\d+)\.(\w+)/);
  if (!m) return null;
  let name: string | undefined;
  try {
    const raw = new URL(src, location.href).searchParams.get("name");
    name = raw ? decodeURIComponent(raw) : undefined;
  } catch {
    // no query string — callers fall back to the other name sources
  }
  return { id: m[1], isAnimated: m[2] === "gif" || /animated=true/.test(src), name };
}

function parseStickerUrl(src: string): { id: string } | null {
  const m = src.match(/\/stickers\/(\d+)\./);
  return m ? { id: m[1] } : null;
}

function isLottie(el: Element | null | undefined): boolean {
  return String(el?.className ?? "").toLowerCase().includes("lottie");
}

/** Nearby <img>s to inspect: the node itself, its subtree, and a few ancestors. */
function gatherImages(target: Element): HTMLImageElement[] {
  const seen = new Set<HTMLImageElement>();
  const out: HTMLImageElement[] = [];
  const add = (el: Element | null | undefined): void => {
    if (el && el.tagName === "IMG" && !seen.has(el as HTMLImageElement)) {
      seen.add(el as HTMLImageElement);
      out.push(el as HTMLImageElement);
    }
  };

  add(target);
  target.querySelectorAll?.("img").forEach(add);

  let cur: Element | null = target.parentElement;
  for (let depth = 0; depth < 4 && cur; depth++, cur = cur.parentElement) {
    add(cur);
    cur.querySelectorAll?.(":scope > img").forEach(add);
  }
  return out;
}

/** The clicked node and its nearest ancestors, closest first. */
function selfAndAncestors(target: Element, depth = 5): Element[] {
  const out: Element[] = [];
  let cur: Element | null = target;
  for (let i = 0; cur && i <= depth; i++, cur = cur.parentElement) out.push(cur);
  return out;
}

// --- source 1: the React fiber behind the click ----------------------------

interface RecordHit {
  name: string;
  animated?: boolean;
}

// Discord's props graphs are large and cyclic; the scan is bounded on both axes.
const SCAN_MAX_DEPTH = 5;
const SCAN_MAX_NODES = 900;

/**
 * Look for the record describing expression `id` anywhere inside a props object:
 * either `{ id, name }` (an emoji / sticker record, a reaction's emoji, a
 * message's sticker item) or `{ emojiId, emojiName }` (how Discord hands a
 * custom emoji to its markdown renderer). Bounded depth-first scan; React
 * elements, DOM nodes and fibers are skipped since their subtrees are enormous
 * and never hold the record.
 */
function findRecordById(root: any, id: string): RecordHit | null {
  let budget = SCAN_MAX_NODES;
  const seen = new Set<any>();

  const walk = (value: any, depth: number): RecordHit | null => {
    if (value == null || typeof value !== "object") return null;
    if (depth > SCAN_MAX_DEPTH || budget-- <= 0) return null;
    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const hit = walk(item, depth + 1);
        if (hit) return hit;
      }
      return null;
    }

    // React element / DOM node / fiber — not a record, and a huge subtree.
    if (value.$$typeof != null || value.nodeType != null || value.stateNode != null) return null;

    try {
      if (String(value.id ?? "") === id && typeof value.name === "string") {
        return { name: value.name, animated: Boolean(value.animated ?? value.isAnimated) };
      }
      if (typeof value.emojiName === "string" && String(value.emojiId ?? "") === id) {
        return { name: value.emojiName, animated: Boolean(value.animated ?? value.isAnimated) };
      }
    } catch {
      // getter threw; keep scanning
    }

    let keys: string[];
    try {
      keys = Object.keys(value);
    } catch {
      return null;
    }

    for (const key of keys) {
      if (key.charCodeAt(0) === 95 /* _ */) continue; // React/Flux internals
      let child: any;
      try {
        child = value[key];
      } catch {
        continue;
      }
      if (child == null || typeof child !== "object") continue;
      const hit = walk(child, depth + 1);
      if (hit) return hit;
    }
    return null;
  };

  return walk(root, 0);
}

/** The record for `id`, dug out of the fiber chain above the clicked node. */
function recordFromFiber(target: Element, id: string): RecordHit | null {
  for (const props of getFiberPropsChain(target)) {
    const hit = findRecordById(props, id);
    if (hit) return hit;
  }
  return null;
}

// --- source 2: the message the click landed in -----------------------------

/**
 * The message row's DOM id encodes the ids we need:
 * `chat-messages-<channelId>-<messageId>` (older builds omit the channel, in
 * which case the currently selected channel is the right one).
 */
function messageFromDom(target: Element): any | null {
  const el = target.closest?.(
    "[id^='chat-messages-'],[data-list-item-id*='chat-messages']"
  ) as HTMLElement | null;
  if (!el) return null;

  const raw = el.id || el.dataset?.listItemId || "";
  const ids = raw.match(/\d{5,25}/g);
  if (!ids || ids.length === 0) return null;

  const messageId = ids[ids.length - 1];
  let channelId = ids.length > 1 ? ids[ids.length - 2] : undefined;
  try {
    channelId ??= SelectedChannelStore.getChannelId?.();
  } catch {
    // no selected channel; nothing more to try
  }
  if (!channelId) return null;

  try {
    return MessageStore.getMessage?.(channelId, messageId) ?? null;
  } catch {
    return null;
  }
}

/** Messages near the click: the one in the fiber props, then the DOM-resolved one. */
function messagesNear(target: Element): any[] {
  const out: any[] = [];
  for (const props of getFiberPropsChain(target)) {
    const msg = props?.message;
    if (msg && typeof msg === "object" && typeof msg.content === "string") {
      out.push(msg);
      break;
    }
  }
  const fromDom = messageFromDom(target);
  if (fromDom && typeof fromDom === "object" && fromDom !== out[0]) out.push(fromDom);
  return out;
}

/**
 * The emoji's name as it is written in the message itself: `<:name:id>` for a
 * static emoji, `<a:name:id>` for an animated one, optionally carrying
 * Discord's `~1` disambiguator. This is exactly what Vencord reads, and it works
 * for emojis from servers you are not in — the whole point of cloning.
 */
function emojiNameFromMessages(target: Element, id: string): string | undefined {
  if (!SNOWFLAKE.test(id)) return undefined;
  const inContent = new RegExp(`<a?:(\\w+)(?:~\\d+)?:${id}>`);

  for (const msg of messagesNear(target)) {
    try {
      const m = typeof msg.content === "string" ? inContent.exec(msg.content) : null;
      const fromContent = emojiName(m?.[1]);
      if (fromContent) return fromContent;

      // Reactions: the row's <img> carries no name at all, but the message's
      // reaction list holds the emoji record.
      const reactions: any[] = Array.isArray(msg.reactions) ? msg.reactions : [];
      for (const r of reactions) {
        if (String(r?.emoji?.id ?? "") === id) {
          const hit = emojiName(r.emoji.name);
          if (hit) return hit;
        }
      }
    } catch {
      // odd message shape; try the next one
    }
  }
  return undefined;
}

/** A sticker's name from the message that carries it. */
function stickerNameFromMessages(target: Element, id: string): string | undefined {
  for (const msg of messagesNear(target)) {
    try {
      const items: any[] = Array.isArray(msg.stickerItems)
        ? msg.stickerItems
        : Array.isArray(msg.stickers)
          ? msg.stickers
          : [];
      for (const s of items) {
        if (String(s?.id ?? "") === id) {
          const hit = stickerName(s.name);
          if (hit) return hit;
        }
      }
    } catch {
      // odd message shape; try the next one
    }
  }
  return undefined;
}

// --- source 3: EmojiStore --------------------------------------------------

/** The name Discord itself stores for a custom emoji, for guilds you are in. */
function emojiNameFromStore(id: string): string | undefined {
  const store = EmojiStore as any;
  const tries: Array<() => any> = [
    () => store.getCustomEmojiById?.(id),
    () => store.getUsableCustomEmojiById?.(id),
    () => store.getDisambiguatedEmojiContext?.()?.getById?.(id)
  ];
  for (const attempt of tries) {
    try {
      const hit = emojiName(attempt()?.name);
      if (hit) return hit;
    } catch {
      // method absent or store not ready; try the next
    }
  }
  return undefined;
}

// --- source 4: DOM attributes ---------------------------------------------

const NAME_ATTRS = ["data-name", "alt", "aria-label", "title"] as const;

/**
 * Scan attributes on the clicked node and its nearest ancestors. Validation does
 * the heavy lifting here: a reaction's aria-label ("name, 2 reactions, press to
 * react") and a unicode emoji's alt are both rejected, so only an attribute that
 * really is a name can win.
 */
function emojiNameFromDom(elements: Element[]): string | undefined {
  for (const el of elements) {
    for (const attr of NAME_ATTRS) {
      const hit = emojiName(el.getAttribute?.(attr));
      if (hit) return hit;
    }
  }
  return undefined;
}

// --- locating the expression ----------------------------------------------

interface Located {
  kind: "emoji" | "sticker";
  id: string;
  /** Whatever name the DOM happened to expose right here (unvalidated). */
  domName?: string;
  img?: HTMLImageElement | null;
  isAnimated: boolean;
}

function locate(target: Element): Located | null {
  // 1. Expression picker / message emoji: id, name and type live in a dataset on
  //    the clicked cell (or an ancestor wrapping it).
  const dataEl = target.closest?.("[data-type='emoji'],[data-type='sticker']") as HTMLElement | null;
  if (dataEl) {
    const { id, name, type } = dataEl.dataset;
    const img = (dataEl.tagName === "IMG" ? dataEl : dataEl.querySelector("img")) as
      | HTMLImageElement
      | null;
    if (id && SNOWFLAKE.test(id) && type === "emoji") {
      return {
        kind: "emoji",
        id,
        domName: name,
        img,
        isAnimated: isGifUrl(img?.currentSrc || img?.src)
      };
    }
    if (id && SNOWFLAKE.test(id) && type === "sticker" && !isLottie(dataEl)) {
      return { kind: "sticker", id, domName: name, img, isAnimated: false };
    }
  }

  // 2. Anywhere else (message content, a reaction, a popout): read the CDN url
  //    off a nearby <img>.
  for (const img of gatherImages(target)) {
    const src = img.currentSrc || img.src || "";
    const emoji = parseEmojiUrl(src);
    if (emoji) {
      return {
        kind: "emoji",
        id: emoji.id,
        domName: emoji.name,
        img,
        isAnimated: emoji.isAnimated || isGifUrl(src)
      };
    }
    const sticker = parseStickerUrl(src);
    if (sticker) {
      if (isLottie(img)) return null;
      return { kind: "sticker", id: sticker.id, domName: img.alt, img, isAnimated: false };
    }
  }

  return null;
}

/** Resolve the right-clicked emoji / sticker, or null if it isn't one. */
export function resolveExpression(target: Element | null): ExpressionHit | null {
  if (!target) return null;

  const found = locate(target);
  if (!found) return null;

  // The <img> we identified the expression from is a name source too, even when
  // it is not on the ancestor path (a picker cell's inner image).
  const elements = selfAndAncestors(target);
  if (found.img && !elements.includes(found.img)) elements.push(found.img);

  if (found.kind === "sticker") {
    const record = recordFromFiber(target, found.id);
    const name =
      stickerName(record?.name) ??
      stickerNameFromMessages(target, found.id) ??
      stickerName(found.domName) ??
      stickerName(found.img?.alt);
    // No fallback string here: clone.ts resolves the real name from the
    // StickersStore / REST when we hand it none.
    return { kind: "sticker", id: found.id, name };
  }

  const record = recordFromFiber(target, found.id);
  const resolved =
    emojiName(record?.name) ??
    emojiNameFromMessages(target, found.id) ??
    emojiNameFromStore(found.id) ??
    emojiNameFromDom(elements) ??
    emojiName(found.domName);

  if (!resolved) {
    log.warn("could not resolve this emoji's name; falling back to \"emoji\"", { id: found.id });
  } else {
    log.debug("resolved emoji", { id: found.id, name: resolved });
  }

  return {
    kind: "emoji",
    id: found.id,
    name: resolved ?? "emoji",
    isAnimated: record?.animated ?? found.isAnimated
  };
}
