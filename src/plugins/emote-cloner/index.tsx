// emote-cloner — right-click an emoji or sticker, clone it into one of your
// servers.
//
// Inspired by Vencord's ExpressionCloner, but the "which expression did you
// click" part is resolved from the DOM rather than Discord's internal menu
// arguments: we read the element under the cursor (via the context-menu
// framework's target tracking) and pull the id / name / animated-ness out of
// its emoji/sticker <img> URL or its picker dataset. That sidesteps the fragile
// argument-capture source patch (which was a syntax error inside class fields
// and broke unrelated modules) and is a more direct fit for "right-click the
// emoji itself".
//
// The added menu item opens a modal picker of the servers you can manage
// expressions in — a searchable list with each server's icon, so it's hard to
// mis-click even with many servers. Picking one uploads the emote there via
// Discord's own REST module.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { React } from "../../core/common/react";
import { GuildStore, PermissionStore, EmojiStore } from "../../core/common/discord";
import {
  addContextMenuPatch,
  getContextMenuTarget,
  getMenuItemComponent
} from "../../core/common/context-menu";
import { cloneEmoji, cloneSticker } from "./clone";
import { openGuildPicker, type GuildInfo } from "./picker";

const log = logger("emote-cloner");

// Any one of these lets an account add emojis/stickers to a guild. Newer builds
// split the old "manage emojis & stickers" into create/manage expressions; we
// accept any, so the target list is right on old and new clients alike.
const PERM = {
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,
  MANAGE_GUILD_EXPRESSIONS: 1n << 40n,
  MANAGE_EMOJIS_AND_STICKERS: 1n << 30n
};

interface EmojiHit {
  kind: "emoji";
  id: string;
  name: string;
  isAnimated: boolean;
}

interface StickerHit {
  kind: "sticker";
  id: string;
  name?: string;
}

// --- expression resolution (from the clicked DOM node) ---------------------

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
    // no query string — leave name undefined, callers fall back to alt/dataset
  }
  return { id: m[1], isAnimated: m[2] === "gif" || /animated=true/.test(src), name };
}

/**
 * The canonical name Discord itself stores for a custom emoji, looked up by id
 * in the EmojiStore. This is THE authoritative source — the same one fake-nitro
 * uses — and it works whenever the emoji is from a server you're in (which is
 * exactly the case Discord's own picker shows). The DOM (`?name=`, alt, dataset)
 * is only a fallback for emojis not in any of your guilds.
 */
function emojiNameFromStore(id: string): string | undefined {
  try {
    const rec = (EmojiStore as any).getCustomEmojiById?.(id) ?? (EmojiStore as any).getUsableCustomEmojiById?.(id);
    return cleanName(rec?.name);
  } catch {
    return undefined;
  }
}

/**
 * The custom emoji's name, dug out of every place Discord might stash it. The
 * EmojiStore (by id) is authoritative; the DOM sources (`?name=` CDN param, the
 * `:name:` alt / aria-label / title, the picker's data-name) are fallbacks for
 * an emoji from a server you're not in. Returns undefined only if nothing has
 * it (callers then fall back to "emoji").
 */
function bestEmojiName(
  id: string,
  img: HTMLImageElement | null | undefined,
  urlName?: string
): string | undefined {
  const el = img as (HTMLImageElement & { dataset?: DOMStringMap }) | null | undefined;
  return (
    emojiNameFromStore(id) ??
    cleanName(urlName) ??
    cleanName(el?.getAttribute?.("alt")) ??
    cleanName(el?.getAttribute?.("aria-label")) ??
    cleanName(el?.getAttribute?.("title")) ??
    cleanName(el?.dataset?.name)
  );
}

function parseStickerUrl(src: string): { id: string } | null {
  const m = src.match(/\/stickers\/(\d+)\./);
  return m ? { id: m[1] } : null;
}

/** Clean a `:name:` alt string down to `name`. */
function cleanName(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const n = raw.replace(/:/g, "").trim();
  return n || undefined;
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

/** Resolve the right-clicked emoji / sticker, or null if it isn't one. */
function resolveExpression(target: Element | null): EmojiHit | StickerHit | null {
  if (!target) return null;

  // 1. Expression picker: id / name / type live in a dataset on the target
  //    (or an ancestor wrapping the clicked cell).
  const dataEl = target.closest?.(
    "[data-type='emoji'],[data-type='sticker'],[data-id]"
  ) as HTMLElement | null;
  if (dataEl) {
    const { id, name, type } = dataEl.dataset;
    if (id && type === "emoji") {
      const img = dataEl.querySelector("img") as HTMLImageElement | null;
      return {
        kind: "emoji",
        id,
        name: bestEmojiName(id, img, name) ?? "emoji",
        isAnimated: isGifUrl(img?.currentSrc || img?.src)
      };
    }
    if (id && type === "sticker" && !String(dataEl.className).toLowerCase().includes("lottie")) {
      return { kind: "sticker", id, name: cleanName(name) };
    }
  }

  // 2. Anywhere else (a message, a reaction): read the emoji/sticker <img> URL.
  for (const img of gatherImages(target)) {
    const src = img.currentSrc || img.src || "";
    const emoji = parseEmojiUrl(src);
    if (emoji) {
      return {
        kind: "emoji",
        id: emoji.id,
        name: bestEmojiName(emoji.id, img, emoji.name) ?? "emoji",
        isAnimated: emoji.isAnimated || isGifUrl(src)
      };
    }
    const sticker = parseStickerUrl(src);
    if (sticker) {
      if (String(img.className).toLowerCase().includes("lottie")) return null;
      return { kind: "sticker", id: sticker.id, name: cleanName(img.alt) };
    }
  }

  return null;
}

// --- target servers --------------------------------------------------------

function canManageExpressions(guild: any): boolean {
  try {
    return Boolean(
      PermissionStore.can?.(PERM.CREATE_GUILD_EXPRESSIONS, guild) ||
        PermissionStore.can?.(PERM.MANAGE_GUILD_EXPRESSIONS, guild) ||
        PermissionStore.can?.(PERM.MANAGE_EMOJIS_AND_STICKERS, guild)
    );
  } catch {
    return false;
  }
}

/** The servers the current account may add emotes to, sorted by name. */
function eligibleGuilds(): GuildInfo[] {
  try {
    const map = GuildStore.getGuilds?.() ?? {};
    return Object.values(map)
      .filter((g: any) => canManageExpressions(g))
      .map((g: any) => ({
        id: String(g?.id ?? ""),
        name: String(g?.name ?? g?.id ?? "未知服务器"),
        icon: g?.icon ? String(g.icon) : null
      }))
      .filter((g) => g.id)
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  } catch {
    return [];
  }
}

// --- menu building ---------------------------------------------------------

/**
 * Open the server picker for a hit. `onPick` returns the clone promise; the
 * picker itself drives the visible "copying / done / failed" state, so feedback
 * never depends on Discord's Toasts module (which isn't guaranteed to resolve).
 */
function pickServerAndClone(hit: EmojiHit | StickerHit): void {
  const isEmoji = hit.kind === "emoji";
  openGuildPicker({
    title: isEmoji ? "复制表情到服务器" : "复制贴纸到服务器",
    guilds: eligibleGuilds(),
    onPick: (guildId) =>
      isEmoji ? cloneEmoji(guildId, hit as EmojiHit) : cloneSticker(guildId, hit as StickerHit)
  });
}

/**
 * Shared patch: resolve the clicked expression and, if any, add a single clone
 * item. Clicking it opens a modal server picker (with icons + search) rather
 * than a nested submenu — easier to hit the right server when there are many.
 */
function cloneMenuPatch(children: any[]): void {
  const hit = resolveExpression(getContextMenuTarget());
  if (!hit) return;

  // Use Discord's own MenuItem reference (learned from this very menu's
  // existing items). If it hasn't been learned yet, skip rather than push a
  // mismatched component and crash the menu.
  const MenuItem = getMenuItemComponent();
  if (!MenuItem) {
    log.warn("MenuItem component not learned yet; skipping clone item this open");
    return;
  }

  children.push(
    React.createElement(MenuItem, {
      id: hit.kind === "emoji" ? "halcyon-clone-emoji" : "halcyon-clone-sticker",
      label: hit.kind === "emoji" ? "复制表情到服务器" : "复制贴纸到服务器",
      action: () => pickServerAndClone(hit)
    })
  );
}

let unpatchers: Array<() => void> = [];

export default definePlugin({
  id: "emote-cloner",
  name: "表情克隆",
  description:
    "右键任意自定义表情或贴纸，即可把它复制到你有管理权限的服务器。支持消息里的表情 / 贴纸，以及表情选择器里的项目。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "utility",

  start() {
    unpatchers.push(addContextMenuPatch(["message", "expression-picker"], cloneMenuPatch));
    log.info("emote-cloner ready — right-click an emoji or sticker");
  },

  stop() {
    for (const un of unpatchers) {
      try {
        un();
      } catch {
        // best-effort teardown
      }
    }
    unpatchers = [];
  }
});
