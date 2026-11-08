// hidden-channels — list the guild channels you are not allowed to view.
//
// Discord only renders channels the current member can see. The channel
// *metadata* for every channel in a joined guild is still in the client's
// cache (the client needs it to evaluate permission overwrites), so we can list
// the locked ones without asking the API for anything and without bypassing a
// single permission: the rows are inert, they never open a channel and never
// fetch a message.
//
// APPROACH — a DOM host appended to the channel list, not a source patch. The
// channel list is one of the most frequently rebuilt parts of the client; a
// factory rewrite aimed at it is the kind of patch that silently stops matching
// on the next update. Instead we append our own host to the sidebar's scroller
// and check once a second that it is still in place (Discord re-renders that
// container constantly, taking our node with it). Same strategy as
// member-count, and for the same reason.
//
// Everything is additive: no Discord node is modified or removed, and stop()
// unmounts the section and deletes the host, leaving the DOM as it was.

import { definePlugin } from "../../core/plugin";
import { React, mountDetached } from "../../core/common/react";
import { classNamesContaining, probeSelectors } from "../../core/dom-probe";
import { injectStyles } from "../../ui/inject-styles";
import { logger } from "../../core/logger";
import { settings } from "./settings";
import { collectHiddenChannels, currentGuildId } from "./channels";
import { HiddenChannelsSection } from "./ui/HiddenChannelsSection";

const log = logger("hidden-channels");

/**
 * Where the section attaches. The primary anchor is the channel list's own
 * items: Discord tags each of them `data-list-item-id="channels___<id>"`, which
 * is distinct from the server rail's `guildsnav___…`. Climbing from an item to
 * its scroller lands in the right server's channel list no matter how the
 * surrounding layout classes are named.
 *
 * The class-prefix selectors are fallbacks only. They MUST skip anything inside
 * the server rail (`guilds…`), because a build can put both columns under a
 * common `sidebar_` wrapper — which is exactly how an earlier version of this
 * anchor ended up drawing the section over the server icons.
 */
const FALLBACK_ANCHORS = [
  '[class*="sidebar_"] [class*="scroller_"]',
  '[class*="sidebar_"] [class*="container_"]',
  'nav[class*="container_"] [class*="scroller_"]'
];

/** How often we verify the host is still where it belongs. */
const ENSURE_MS = 1000;

interface Mounted {
  host: HTMLElement;
  unmount: () => void;
}

let mounted: Mounted | undefined;
let ensureTimer: ReturnType<typeof setInterval> | undefined;
let unsubscribePosition: (() => void) | undefined;
let warnedNoAnchor = false;

interface AnchorHit {
  element: Element;
  selector: string;
}

/** True when the node lives in the server (guild) rail, not a channel list. */
function inGuildRail(node: Element): boolean {
  try {
    return node.closest('[class*="guilds"]') != null;
  } catch {
    return false;
  }
}

/** Whether an anchor points at a channel (two ids), not a server icon (one). */
function isChannelLink(link: Element): boolean {
  const href = link.getAttribute("href") ?? "";
  return /\/channels\/[^/]+\/[^/?#]+/.test(href);
}

/**
 * The scroller of the current server's channel list.
 *
 * Primary anchor: one of the list's own items, which Discord tags
 * `data-list-item-id="channels___<id>"` — distinct from the server rail's
 * `guildsnav___…`. Climbing to its scroller lands in the right column no matter
 * what the surrounding layout classes are called. Everything below is a
 * fallback, and every candidate is filtered to exclude the server rail.
 */
function findAnchor(): AnchorHit | null {
  // 1. Discord's own channel-list item marker.
  try {
    const item = document.querySelector('[data-list-item-id^="channels___"]');
    if (item && !inGuildRail(item)) {
      const scroller = item.closest('[class*="scroller_"]');
      return {
        element: scroller ?? item.parentElement ?? item,
        selector: 'data-list-item-id="channels___…"'
      };
    }
  } catch {
    // fall through
  }

  // 2. A real channel link. The server rail's icons also link to /channels/,
  //    but only with a guild id; a channel link carries a second id.
  try {
    for (const link of document.querySelectorAll('a[href*="/channels/"]')) {
      if (!isChannelLink(link) || inGuildRail(link)) continue;
      const scroller = link.closest('[class*="scroller_"]');
      if (scroller) return { element: scroller, selector: "channel link → scroller" };
    }
  } catch {
    // fall through
  }

  // 3. Class-prefix fallbacks, never the server rail.
  for (const selector of FALLBACK_ANCHORS) {
    try {
      for (const element of document.querySelectorAll(selector)) {
        if (inGuildRail(element)) continue;
        return { element, selector };
      }
    } catch {
      // A selector this engine rejects; try the next.
    }
  }

  return null;
}

function detach(): void {
  if (!mounted) return;
  const { host, unmount } = mounted;
  mounted = undefined;
  try {
    unmount();
  } catch {
    // already gone
  }
  host.remove();
}

function attach(anchor: Element): void {
  const host = document.createElement("div");
  host.className = "hc-hiddenchannels-host";
  host.setAttribute("data-hc-plugin", "hidden-channels");

  try {
    // Insert, never replace: Discord's React keeps explicit references to the
    // children it owns, so an extra sibling is invisible to its reconciler.
    if (settings.store.position === "top") anchor.insertBefore(host, anchor.firstChild);
    else anchor.appendChild(host);
  } catch (err) {
    log.debug("无法插入隐藏频道列表", err);
    return;
  }

  try {
    const unmount = mountDetached(React.createElement(HiddenChannelsSection), host);
    mounted = { host, unmount };
  } catch (err) {
    host.remove();
    log.error("挂载隐藏频道列表失败", err);
  }
}

/** Move the host to its configured edge if React re-rendered around it. */
function place(host: HTMLElement, anchor: Element): void {
  const top = settings.store.position === "top";
  const correctlyPlaced = top
    ? host.parentElement === anchor && anchor.firstElementChild === host
    : host.parentElement === anchor && anchor.lastElementChild === host;
  if (correctlyPlaced) return;

  try {
    if (top) anchor.insertBefore(host, anchor.firstChild);
    else anchor.appendChild(host);
  } catch (err) {
    log.debug("重新放置隐藏频道列表失败", err);
  }
}

/**
 * Reconcile the mount with the live DOM. Cheap enough to run on a timer: one
 * `querySelector` and a parent check.
 */
function ensureMounted(): void {
  const hit = findAnchor();
  if (!hit) {
    if (!warnedNoAnchor) {
      warnedNoAnchor = true;
      log.warn(
        "找不到频道列表容器。请先打开一个服务器频道；若已经打开还是没有，" +
          "在控制台运行 HalcyonAPI.probe() 并把输出发回来 —— 说明这个 Discord 版本的容器类名变了。"
      );
    }
    return;
  }

  if (!mounted) {
    attach(hit.element);
    return;
  }

  // Discord can replace the sidebar wholesale, leaving our host detached. The
  // element itself survives, so re-parenting it keeps the React root (and the
  // user's collapsed state) alive.
  place(mounted.host, hit.element);
}

export default definePlugin({
  id: "hidden-channels",
  name: "隐藏频道列表",
  description:
    "在频道列表里列出当前服务器中没有权限查看的频道，按分类分组显示名称与类型。只是展示：点击不会进入频道，也不会读取任何消息。",
  authors: [{ name: "caitemm" }],
  category: "utility",

  settings,

  start() {
    injectStyles();
    warnedNoAnchor = false;

    ensureMounted();
    ensureTimer = setInterval(ensureMounted, ENSURE_MS);

    // Moving the section should take effect immediately, not after a tick.
    unsubscribePosition = settings.subscribe("position", () => {
      warnedNoAnchor = false;
      ensureMounted();
    });

    log.info("隐藏频道列表已启用");
  },

  stop() {
    if (ensureTimer) {
      clearInterval(ensureTimer);
      ensureTimer = undefined;
    }
    unsubscribePosition?.();
    unsubscribePosition = undefined;

    detach();
    log.info("隐藏频道列表已移除");
  },

  /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
  probe(): Record<string, unknown> {
    const guildId = currentGuildId();
    let snapshot: unknown;
    try {
      snapshot = collectHiddenChannels(guildId);
    } catch (err) {
      snapshot = { error: String(err) };
    }

    return {
      guildId,
      mounted: mounted
        ? {
            attached: document.contains(mounted.host),
            html: mounted.host.innerHTML.slice(0, 200)
          }
        : null,
      anchor: (() => {
        try {
          const hit = findAnchor();
          return hit ? hit.selector : null;
        } catch {
          return "error";
        }
      })(),
      channelItems: (() => {
        try {
          return document.querySelectorAll('[data-list-item-id^="channels___"]').length;
        } catch {
          return -1;
        }
      })(),
      fallbackAnchors: probeSelectors(FALLBACK_ANCHORS),
      classHints: {
        sidebar: classNamesContaining("sidebar"),
        guilds: classNamesContaining("guilds"),
        scroller: classNamesContaining("scroller"),
        container: classNamesContaining("container")
      },
      snapshot
    };
  }
});
