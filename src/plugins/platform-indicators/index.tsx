// platform-indicators — show which client someone is talking to you from.
//
// Discord knows, and uses it for exactly one thing: the little phone badge on an
// avatar. Everywhere else the information is dropped, even though "is this
// person at a keyboard or on their phone" changes how you read a short reply,
// and a web-only session is a useful signal about alt accounts.
//
// APPROACH — DOM anchors plus React's fiber back-reference, no source patch.
// The message header is already source-patched by the show-username plugin;
// stacking a second, differently-anchored rewrite on the same minified module is
// how patches start fighting each other and silently stop matching. Instead:
//
//   1. Message authors are found through `span[id^="message-username-"]` — an
//      id Discord writes itself, so it survives every class-name rehash.
//   2. Member-list rows are found by class prefix, best effort.
//   3. The user behind an anchor comes from the props React rendered its
//      ancestors with (`message.author.id` / `user.id`), never from parsing DOM.
//
// A once-a-second scan mounts an indicator into anchors that don't have one and
// prunes the ones Discord has since removed. Presence changes come in through a
// coalesced bus so a busy friends list doesn't re-render 50 nodes per second.

import { definePlugin } from "../../core/plugin";
import { React, mountDetached, getFiberPropsChain } from "../../core/common/react";
import { flux } from "../../core/flux";
import { UserStore } from "../../core/common/discord";
import { classNamesContaining, probeSelectors } from "../../core/dom-probe";
import { injectStyles } from "../../ui/inject-styles";
import { logger } from "../../core/logger";
import {
  bumpPresence,
  isBot,
  presenceDiagnostics,
  readPlatforms,
  resetPresenceBus
} from "./platforms";
import { settings } from "./settings";
import { PlatformIndicator } from "./ui/PlatformIndicator";

const log = logger("platform-indicators");

type Kind = "message" | "member";

/** Marks an anchor as handled. "0" means "no user here, don't retry". */
const MARK = "data-hc-platform";

/**
 * Message author anchors. `id="message-username-<messageId>"` is written by
 * Discord itself, which makes it the single most stable hook in the message
 * header; the class-prefix variants are fallbacks for a build that drops it.
 * Only the first selector that matches anything is used, so we never
 * double-mount onto nested anchors.
 */
const MESSAGE_SELECTORS = [
  '[id^="message-username-"]',
  '[class*="headerText"] [class*="username"]',
  '[class*="header_"] [class*="username"]'
];

/** Member-list row anchors, same first-match-wins rule. */
const MEMBER_SELECTORS = [
  '[class*="membersWrap"] [class*="nameAndDecorators"]',
  '[class*="members"] [class*="nameAndDecorators"]',
  '[class*="nameAndDecorators"]',
  '[class*="membersWrap"] [class*="memberInner"]',
  '[class*="member_"] [class*="username"]'
];

/** Actions after which someone's platform may have changed. */
const WATCHED_ACTIONS = [
  "PRESENCE_UPDATES",
  "PRESENCE_UPDATE",
  "SESSIONS_REPLACE",
  "GUILD_MEMBER_LIST_UPDATE"
] as const;

const SCAN_MS = 1000;

interface Mounted {
  kind: Kind;
  host: HTMLElement;
  anchor: Element;
  unmount: () => void;
}

const mounted = new Map<HTMLElement, Mounted>();
let scanTimer: ReturnType<typeof setInterval> | undefined;
let unsubscribes: Array<() => void> = [];

function currentUserId(): string | null {
  try {
    const id = UserStore.getCurrentUser?.()?.id;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/**
 * The user an anchor belongs to. For a message header the message's own author
 * is the answer and is checked first; a member-list row carries a plain `user`.
 */
function resolveUserId(node: Element, kind: Kind): string | null {
  const chain = getFiberPropsChain(node, 16);

  if (kind === "message") {
    for (const props of chain) {
      const id = props?.message?.author?.id;
      if (id) return String(id);
    }
  }
  for (const props of chain) {
    const id = props?.user?.id;
    if (id) return String(id);
  }
  for (const props of chain) {
    const id = props?.message?.author?.id;
    if (id) return String(id);
  }
  return null;
}

/** Mount one indicator. Returns false if the anchor should be retried later. */
function attach(anchor: Element, kind: Kind, userId: string, selfId: string | null): boolean {
  const host = document.createElement("span");
  host.className = "hc-platform-host";
  host.setAttribute("data-hc-plugin", "platform-indicators");

  try {
    anchor.appendChild(host);
  } catch {
    return false;
  }

  try {
    const unmount = mountDetached(
      React.createElement(PlatformIndicator, { userId, isSelf: userId === selfId }),
      host
    );
    mounted.set(host, { kind, host, anchor, unmount });
    return true;
  } catch (err) {
    host.remove();
    log.debug("挂载平台图标失败", err);
    return false;
  }
}

function mountInto(nodes: ArrayLike<Element>, kind: Kind, selfId: string | null): void {
  for (let i = 0; i < nodes.length; i++) {
    const anchor = nodes[i];
    if (anchor.hasAttribute(MARK)) continue;

    const userId = resolveUserId(anchor, kind);
    if (!userId) {
      // A system message or a row with no user behind it. Mark so we don't walk
      // its fiber chain again on every scan.
      anchor.setAttribute(MARK, "0");
      continue;
    }
    anchor.setAttribute(MARK, kind);
    // A failed mount clears the mark, so the next scan gets another go rather
    // than the row being silently skipped for the rest of the session.
    if (!attach(anchor, kind, userId, selfId)) anchor.removeAttribute(MARK);
  }
}

function detach(entry: Mounted): void {
  mounted.delete(entry.host);
  try {
    entry.unmount();
  } catch {
    // already torn down
  }
  entry.host.remove();
  try {
    entry.anchor.removeAttribute(MARK);
  } catch {
    // anchor already gone with its subtree
  }
}

/** Drop indicators whose host (or whose anchor) Discord has removed. */
function prune(): void {
  for (const entry of [...mounted.values()]) {
    if (!document.contains(entry.host)) detach(entry);
  }
}

/** Remove every indicator of one kind (used when a placement is switched off). */
function detachKind(kind: Kind): void {
  for (const entry of [...mounted.values()]) {
    if (entry.kind === kind) detach(entry);
  }
}

/** First selector in the list that matches anything, with what it matched. */
function firstMatchAll(selectors: string[]): { nodes: NodeListOf<Element>; selector: string } | null {
  for (const selector of selectors) {
    try {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length > 0) return { nodes, selector };
    } catch {
      // selector rejected by this engine; try the next
    }
  }
  return null;
}

/** Selector that last worked, per kind — logged once so it stays quiet after. */
const lastSelector = new Map<Kind, string>();
let warnedNoAnchor = false;

function scanKind(kind: Kind, selectors: string[], selfId: string | null): boolean {
  const hit = firstMatchAll(selectors);
  if (!hit) return false;
  if (lastSelector.get(kind) !== hit.selector) {
    lastSelector.set(kind, hit.selector);
    log.info(`${kind} 锚点：${hit.selector}（${hit.nodes.length} 个）`);
  }
  mountInto(hit.nodes, kind, selfId);
  return true;
}

function scan(): void {
  prune();

  const s = settings.store;
  const selfId = currentUserId();
  let anyAnchor = false;

  if (s.inMessages && scanKind("message", MESSAGE_SELECTORS, selfId)) anyAnchor = true;
  if (s.inMemberList && scanKind("member", MEMBER_SELECTORS, selfId)) anyAnchor = true;

  if (!anyAnchor && !warnedNoAnchor && (s.inMessages || s.inMemberList)) {
    warnedNoAnchor = true;
    log.warn(
      "找不到可挂载的位置（消息作者 / 成员列表）。请先打开一个有消息的频道；若已经打开还是没有，" +
        "在控制台运行 HalcyonAPI.probe() 并把输出发回来。"
    );
  }
}

/** Clear our marks from anywhere, so a re-enable starts from a clean slate. */
function clearMarks(): void {
  try {
    for (const node of document.querySelectorAll(`[${MARK}]`)) {
      node.removeAttribute(MARK);
    }
  } catch {
    // best effort
  }
}

export default definePlugin({
  id: "platform-indicators",
  name: "平台标识",
  description:
    "在消息作者与成员列表旁显示对方当前所在的平台（桌面端 / 手机 / 网页 / 游戏主机），图标按在线状态着色。数据取自 Discord 自己的状态 store，不发任何请求。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "appearance",

  settings,

  start() {
    injectStyles();
    warnedNoAnchor = false;
    lastSelector.clear();

    scan();
    scanTimer = setInterval(scan, SCAN_MS);

    unsubscribes = WATCHED_ACTIONS.map((type) => flux.subscribe(type, bumpPresence));

    // Placement toggles take effect at once; appearance changes just need a
    // re-render, which the presence bus already does.
    unsubscribes.push(
      settings.subscribe("inMessages", (on) => {
        if (!on) detachKind("message");
        else scan();
      }),
      settings.subscribe("inMemberList", (on) => {
        if (!on) detachKind("member");
        else scan();
      }),
      settings.subscribe("colorize", () => bumpPresence()),
      settings.subscribe("iconSize", () => bumpPresence()),
      settings.subscribe("ignoreBots", () => bumpPresence()),
      settings.subscribe("ignoreSelf", () => bumpPresence())
    );

    log.info("平台标识已启用");
  },

  stop() {
    if (scanTimer) {
      clearInterval(scanTimer);
      scanTimer = undefined;
    }
    for (const off of unsubscribes) {
      try {
        off();
      } catch {
        // best effort
      }
    }
    unsubscribes = [];

    for (const entry of [...mounted.values()]) detach(entry);
    clearMarks();
    resetPresenceBus();
    lastSelector.clear();

    log.info("平台标识已移除");
  },

  /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
  probe(): Record<string, unknown> {
    const selfId = currentUserId();
    const messageHit = firstMatchAll(MESSAGE_SELECTORS);
    const memberHit = firstMatchAll(MEMBER_SELECTORS);

    /** Resolve one sample anchor end to end, to see where the chain breaks. */
    const sample = (hit: ReturnType<typeof firstMatchAll>, kind: Kind): unknown => {
      if (!hit || hit.nodes.length === 0) return null;
      const node = hit.nodes[0];
      const userId = resolveUserId(node, kind);
      return {
        selector: hit.selector,
        matches: hit.nodes.length,
        userId,
        platforms: userId ? readPlatforms(userId) : null,
        isBot: userId ? isBot(userId) : null
      };
    };

    return {
      settings: {
        inMessages: settings.store.inMessages,
        inMemberList: settings.store.inMemberList,
        ignoreBots: settings.store.ignoreBots
      },
      mountedCount: mounted.size,
      selfId,
      selfPlatforms: selfId ? readPlatforms(selfId) : null,
      message: sample(messageHit, "message"),
      member: sample(memberHit, "member"),
      anchors: {
        message: probeSelectors(MESSAGE_SELECTORS),
        member: probeSelectors(MEMBER_SELECTORS)
      },
      classHints: {
        username: classNamesContaining("username"),
        nameAndDecorators: classNamesContaining("nameAndDecorators")
      },
      stores: presenceDiagnostics()
    };
  }
});
