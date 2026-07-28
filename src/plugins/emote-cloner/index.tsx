// emote-cloner — right-click an emoji or sticker, clone it into one of your
// servers.
//
// Inspired by Vencord's ExpressionCloner, but the "which expression did you
// click" part is resolved from the DOM + React fiber rather than Discord's
// internal menu arguments: we read the element under the cursor (via the
// context-menu framework's target tracking) and recover the expression's id,
// name and animated-ness from it. That sidesteps the fragile argument-capture
// source patch (which was a syntax error inside class fields and broke unrelated
// modules) and is a more direct fit for "right-click the emoji itself". See
// resolve.ts for how the name is recovered — that part is subtle.
//
// The added menu item opens a modal picker of the servers you can manage
// expressions in — a searchable list with each server's icon, so it's hard to
// mis-click even with many servers. Picking one uploads the emote there via
// Discord's own REST module.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { React } from "../../core/common/react";
import { GuildStore, PermissionStore } from "../../core/common/discord";
import {
  addContextMenuPatch,
  getContextMenuTarget,
  getMenuItemComponent
} from "../../core/common/context-menu";
import { cloneEmoji, cloneSticker } from "./clone";
import { resolveExpression, type EmojiHit, type ExpressionHit, type StickerHit } from "./resolve";
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
function pickServerAndClone(hit: ExpressionHit): void {
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

  const label =
    hit.kind === "emoji"
      ? `复制表情 :${hit.name}: 到服务器`
      : hit.name
        ? `复制贴纸 ${hit.name} 到服务器`
        : "复制贴纸到服务器";

  children.push(
    React.createElement(MenuItem, {
      id: hit.kind === "emoji" ? "halcyon-clone-emoji" : "halcyon-clone-sticker",
      label,
      action: () => pickServerAndClone(hit)
    })
  );
}

let unpatchers: Array<() => void> = [];

export default definePlugin({
  id: "emote-cloner",
  name: "表情克隆",
  description:
    "右键任意自定义表情或贴纸，即可把它复制到你有管理权限的服务器（保留原名）。支持消息里的表情 / 表情回应 / 贴纸，以及表情选择器里的项目。",
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
