// mark-all-read — clear every unread across every server in one click.
//
// Discord only offers "mark as read" per-guild (right-click a server). This
// plugin adds a global version: one BULK_ACK dispatch that acks every unread
// channel (text, voice-text, and joined threads) in every joined guild at once
// (see mark.ts) — the exact channel-collection Vencord's ReadAllNotificationsButton
// performs. It surfaces three ways:
//
//   - a button in the left server rail, right below the friends/DM button. The
//     rail is an SVG whose items are `<foreignObject>`s positioned by SVG
//     coordinates, so a raw DOM node can't get a proper slot (it either lands
//     off-screen or shoves the friends button out). Vencord solves this with a
//     source patch on the guild-nav component, concatenating its button into the
//     render array right after the friends button so Discord's own layout places
//     it — and Halcyon has the same webpack source-patch machinery, so we do
//     exactly that (see `patches` below + `renderRailButton`),
//   - a "全部服务器标为已读" item in the guild right-click menu, and
//   - a settings page with the same button.
//
// Marking read is not destructive and needs no network calls of our own — the
// dispatch goes through Discord's own read-state pipeline.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { MessageCheckIcon } from "../../icons";
import {
  addContextMenuPatch,
  removeContextMenuPatch,
  getMenuItemComponent,
  type ContextMenuPatchCallback
} from "../../core/common/context-menu";
import { showToast } from "../../core/common/discord";
import { React } from "../../core/common/react";
import { injectStyles } from "../../ui/inject-styles";
import { markAllRead } from "./mark";
import { MarkAllReadPage } from "./ui/MarkAllReadPage";

const log = logger("mark-all-read");

/** Run the mark, then report the outcome through a toast. Shared by every surface. */
function runMark(): void {
  try {
    const result = markAllRead();
    if (result.channels === 0) {
      showToast("没有未读消息", "info");
    } else {
      showToast(`已标记 ${result.channels} 个频道为已读`, "success");
    }
  } catch (err) {
    showToast("标记失败", "failure");
    log.error("mark all read failed", err);
  }
}

/**
 * The rail button — a rounded-square icon styled to match Discord's own guild
 * icons. Rendered by the source patch into the guild nav, right after the
 * friends button, so it sits just below it in the rail.
 */
function RailButton(): React.ReactElement {
  return (
    <div className="hc-rail-item">
      <button
        type="button"
        className="hc-rail-btn"
        aria-label="全部服务器标为已读"
        title="全部服务器标为已读"
        onClick={runMark}
      >
        <MessageCheckIcon size={24} />
      </button>
    </div>
  );
}

// Guild-list / guild-header right-click menus. We append our item at the end of
// the top-level children so it sits with the other guild-wide actions.
const GUILD_MENUS = ["guild-context", "guild-header-popout"];

const patchGuildMenu: ContextMenuPatchCallback = (children) => {
  const MenuItem = getMenuItemComponent();
  // No item-bearing menu has rendered yet, so we don't have Discord's exact
  // MenuItem reference. Injecting a mismatched one crashes the menu — skip.
  if (!MenuItem) return;

  const already = children.some((c: any) => c?.props?.id === "hc-mark-all-read");
  if (already) return;

  children.push(
    React.createElement(MenuItem, {
      id: "hc-mark-all-read",
      label: "全部服务器标为已读",
      action: runMark
    })
  );
};

export default definePlugin({
  id: "mark-all-read",
  name: "一键已读",
  description:
    "在服务器列表的好友按钮下方加一个按钮，一键把所有服务器的未读消息标为已读。也可右键任意服务器，或在本页点击。标记已读不会删除消息，但无法撤销。",
  authors: [{ name: "caitemm" }, { name: "Vencord" }],
  category: "utility",
  dependencies: ["context-menu-api"],

  // Same target and transform Vencord's ServerListAPI uses for
  // ServerListRenderPosition.Above, but anchored on the plain runtime string
  // `tutorialId:"friends-list"` instead of Vencord's build-time intl-hash macro
  // (which we can't reproduce). It wraps the friends-button element the guild
  // nav returns into an array and concatenates our button, letting Discord's own
  // SVG layout give it a real slot right after friends.
  patches: [
    {
      label: "read-all-rail-button",
      find: 'tutorialId:"friends-list"',
      replacement: {
        match: /return(\(.{0,200}?tutorialId:"friends-list".+?\}\))(?=\}function)/,
        replace: "return[$1].concat($self.renderRailButton())"
      }
    }
  ],

  /** Called from the patched guild-nav render (via `$self`). Returns the button
   *  as a keyed single-element array so it slots in right after friends. */
  renderRailButton(): React.ReactNode[] {
    return [React.createElement(RailButton, { key: "hc-mark-all-read-rail" })];
  },

  page: {
    title: "一键已读",
    icon: MessageCheckIcon,
    component: MarkAllReadPage
  },

  start() {
    injectStyles();
    addContextMenuPatch(GUILD_MENUS, patchGuildMenu);
    log.info("mark-all-read ready");
  },

  stop() {
    removeContextMenuPatch(GUILD_MENUS, patchGuildMenu);
  }
});
