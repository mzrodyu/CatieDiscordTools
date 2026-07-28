// member-count — show how many members a server has, and how many are online.
//
// Discord hides both numbers: the total only appears in the invite/discovery
// surfaces, and the online count is buried in the member list's group headers
// where you have to scroll and add them up yourself.
//
// APPROACH — deliberately not a source patch. The member list and the channel
// header are two of Discord's most frequently reshuffled components, so a
// factory rewrite aimed at either is the kind of patch that silently stops
// matching on the next client update. Instead we insert our own host element
// next to a stable structural anchor and mount a small React chip into it,
// re-checking once a second that the host is still attached (Discord re-renders
// those containers constantly, taking our node with them). The chip reads
// Discord's own stores, so the numbers are the client's, not ours.
//
// Class names carry a per-build hash, so anchors are matched by prefix and
// tried in order, most specific first. When none of them match, that is a
// FACT worth reporting rather than a silent no-op: the plugin says so in the
// log, and `HalcyonAPI.probe()` dumps what the DOM actually looks like.
//
// Everything is additive: no Discord node is modified or removed, and stop()
// unmounts the chips and deletes the hosts, leaving the DOM as it was.

import { definePlugin } from "../../core/plugin";
import { React, mountDetached } from "../../core/common/react";
import { SelectedChannelStore } from "../../core/common/discord";
import { classNamesContaining, probeSelectors } from "../../core/dom-probe";
import { injectStyles } from "../../ui/inject-styles";
import { logger } from "../../core/logger";
import { settings } from "./settings";
import {
  countsDiagnostics,
  guildIdOfChannel,
  readCounts,
  startCountTracking,
  stopCountTracking
} from "./counts";
import { MemberCountChip } from "./ui/MemberCountChip";

const log = logger("member-count");

type Variant = "header" | "list";

/**
 * Where each variant attaches, most specific first. The channel header's
 * toolbar is a flex row, so an inline child is layout-safe; the member-list
 * wrapper is a column, so a first child sits above the roster.
 *
 * The last entry of each list is deliberately loose — a bare `[class*="…"]` —
 * so a build that renames the surrounding structure still lands somewhere
 * sensible instead of nowhere at all.
 */
const ANCHORS: Record<Variant, string[]> = {
  header: [
    'section[class*="title_"] [class*="toolbar_"]',
    'section[class*="title"] [class*="toolbar"]',
    '[class*="upperContainer"] [class*="toolbar"]',
    '[class*="chat_"] [class*="toolbar_"]',
    '[class*="toolbar_"]'
  ],
  // Most-specific first. The two "scroller" entries are what the chip should
  // actually attach to — inside the member list, above the first group header —
  // so the row reads as a natural roster header instead of floating in the
  // aside above everything. The outer `membersWrap` / `aside[class*="members"]`
  // fallbacks are kept in case a build renames the scroller, but they anchor
  // OUTSIDE the scrollable content, which is what produced the "chip floats in
  // empty space above the roster" symptom on the current build.
  list: [
    '[class*="membersWrap"] [class*="members_"]',
    'aside[class*="members"] [class*="members_"]',
    '[class*="members_"]:not([class*="membersWrap"])',
    '[class*="memberList"]',
    '[class*="membersWrap"]',
    'aside[class*="members"]'
  ]
};

/** How often we verify our hosts are still in the document. */
const ENSURE_MS = 1000;

interface Mounted {
  host: HTMLElement;
  unmount: () => void;
  selector: string;
}

const mounted = new Map<Variant, Mounted>();
let ensureTimer: ReturnType<typeof setInterval> | undefined;
let selfCheckTimer: ReturnType<typeof setTimeout> | undefined;
let unsubscribePlacement: (() => void) | undefined;
/** Selector that last worked, per variant — logged once, then kept quiet. */
const lastSelector = new Map<Variant, string>();
let warnedNoAnchor = false;

interface AnchorHit {
  element: Element;
  selector: string;
}

function firstMatch(selectors: string[]): AnchorHit | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) return { element: el, selector };
    } catch {
      // A selector this engine rejects; try the next.
    }
  }
  return null;
}

function wantedVariants(): Set<Variant> {
  const placement = settings.store.placement;
  const want = new Set<Variant>();
  if (placement === "header" || placement === "both") want.add("header");
  if (placement === "member-list" || placement === "both") want.add("list");
  return want;
}

function teardown(variant: Variant): void {
  const entry = mounted.get(variant);
  if (!entry) return;
  mounted.delete(variant);
  try {
    entry.unmount();
  } catch {
    // already gone
  }
  entry.host.remove();
}

function attach(variant: Variant, hit: AnchorHit): void {
  const host = document.createElement("div");
  host.className = "hc-membercount-host";
  host.setAttribute("data-hc-plugin", "member-count");

  try {
    // Insert, never replace: Discord's React keeps explicit references to the
    // children it owns, so an extra sibling is invisible to its reconciler.
    hit.element.insertBefore(host, hit.element.firstChild);
  } catch (err) {
    log.debug(`无法在 ${variant} 位置插入宿主节点`, err);
    return;
  }

  try {
    const unmount = mountDetached(React.createElement(MemberCountChip, { variant }), host);
    mounted.set(variant, { host, unmount, selector: hit.selector });
    if (lastSelector.get(variant) !== hit.selector) {
      lastSelector.set(variant, hit.selector);
      log.info(`已挂载到 ${variant}：${hit.selector}`);
    }
  } catch (err) {
    host.remove();
    log.error(`挂载成员数标签失败（${variant}）`, err);
  }
}

/**
 * Reconcile what's mounted with what's wanted. Cheap enough to run on a timer:
 * a couple of `querySelector` calls and a `document.contains` check.
 */
function ensureMounted(): void {
  const want = wantedVariants();

  for (const [variant, entry] of [...mounted]) {
    if (!want.has(variant) || !document.contains(entry.host)) teardown(variant);
  }

  let anyAnchor = false;
  for (const variant of want) {
    if (mounted.has(variant)) {
      anyAnchor = true;
      continue;
    }
    const hit = firstMatch(ANCHORS[variant]);
    if (!hit) continue;
    anyAnchor = true;
    attach(variant, hit);
  }

  if (!anyAnchor && !warnedNoAnchor && mounted.size === 0) {
    warnedNoAnchor = true;
    log.warn(
      "找不到可插入的位置（频道顶栏 / 成员列表）。请先打开一个服务器频道；若已经打开还是没有，" +
        "在控制台运行 HalcyonAPI.probe() 并把输出发回来 —— 说明这个 Discord 版本的容器类名变了。"
    );
  }
}

/** The channel the user is looking at, or null. */
function currentChannelId(): string | null {
  try {
    return SelectedChannelStore.getChannelId?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * A mounted chip that renders nothing looks exactly like a plugin that never
 * started. Once, a few seconds after start, check whether we are in a guild
 * channel with no numbers to show and say so — with the full source breakdown,
 * so the log alone is enough to tell which lookup failed.
 */
function selfCheck(): void {
  const channelId = currentChannelId();
  if (!guildIdOfChannel(channelId)) return; // a DM: nothing to show, by design

  const { total, online } = readCounts(channelId);
  if (total != null || online != null) return;

  log.warn(
    "已挂载但拿不到成员数（所有数据源都是空）。下面是每个来源的实际结果；" +
      "也可以在控制台运行 HalcyonAPI.probe() 拿到完整报告。",
    countsDiagnostics(channelId)
  );
}

export default definePlugin({
  id: "member-count",
  name: "成员数显示",
  description:
    "在频道顶栏或成员列表顶部显示当前服务器的在线人数与总成员数。数字取自 Discord 自己的 store；若某服务器还没有成员列表数据，会调用一次 Discord 自身的频道预加载来取（可在设置里关闭）。切换服务器自动更新。",
  authors: [{ name: "caitemm" }],
  category: "utility",

  settings,

  start() {
    injectStyles();
    warnedNoAnchor = false;
    lastSelector.clear();

    // Capture member-list group updates as they fly past, so the online count
    // survives a collapsed sidebar and a changed store shape.
    startCountTracking();

    ensureMounted();
    ensureTimer = setInterval(ensureMounted, ENSURE_MS);

    // Changing the placement should move the chip immediately, not after the
    // next tick.
    unsubscribePlacement = settings.subscribe("placement", () => {
      warnedNoAnchor = false;
      ensureMounted();
    });

    // Stores and the preload round-trip both need a moment; check after.
    selfCheckTimer = setTimeout(selfCheck, 8000);

    log.info(`成员数标签已启用（位置：${settings.store.placement}）`);
  },

  stop() {
    if (ensureTimer) {
      clearInterval(ensureTimer);
      ensureTimer = undefined;
    }
    if (selfCheckTimer) {
      clearTimeout(selfCheckTimer);
      selfCheckTimer = undefined;
    }
    unsubscribePlacement?.();
    unsubscribePlacement = undefined;
    stopCountTracking();

    for (const variant of [...mounted.keys()]) teardown(variant);
    lastSelector.clear();
    log.info("成员数标签已移除");
  },

  /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
  probe(): Record<string, unknown> {
    const channelId = currentChannelId();

    return {
      placement: settings.store.placement,
      mounted: [...mounted.entries()].map(([variant, entry]) => ({
        variant,
        selector: entry.selector,
        attached: document.contains(entry.host),
        renderedHtml: entry.host.innerHTML.slice(0, 200)
      })),
      anchors: {
        header: probeSelectors(ANCHORS.header),
        list: probeSelectors(ANCHORS.list)
      },
      classHints: {
        toolbar: classNamesContaining("toolbar"),
        members: classNamesContaining("members"),
        title: classNamesContaining("title_")
      },
      data: countsDiagnostics(channelId)
    };
  }
});
