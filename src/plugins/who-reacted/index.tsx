// who-reacted — see who put a reaction on a message, without opening anything.
//
// Discord only shows the raw counter. Finding out who is behind it means
// right-clicking into the reaction details popout, one reaction at a time —
// which is also the only place the client fetches that data at all.
//
// APPROACH — no source patch, no component replacement. Reactions are one of
// the most-rewritten parts of Discord's message renderer (bursts, super
// reactions, the details popout rework), so a factory rewrite there ages badly.
// Instead:
//
//   1. One delegated `mouseover` listener on the document finds the reaction
//      pill under the cursor by its (hash-suffixed) class prefix.
//   2. React's own fiber back-reference on that node gives us the props it was
//      rendered with — the message and the emoji record — so we never have to
//      parse the DOM or guess ids from attributes.
//   3. Discord's authenticated REST module fetches the reactor list, cached for
//      30s so sweeping across a row of reactions costs one request.
//
// The card is a tooltip: it lives on `document.body` with pointer-events
// disabled, so it can't intercept the click that toggles your own reaction.
//
// PRIVACY NOTE: this makes a request to Discord's own API, and only when you
// hover a reaction (optionally only while holding Alt). Nothing is sent
// anywhere else.

import { definePlugin } from "../../core/plugin";
import { React, mountDetached } from "../../core/common/react";
import { RestAPI } from "../../core/common/discord";
import { classNamesContaining, probeSelectors } from "../../core/dom-probe";
import { injectStyles } from "../../ui/inject-styles";
import { logger } from "../../core/logger";
import { settings } from "./settings";
import { clearCache, resolveReaction, type ReactionTarget } from "./reactors";
import { ReactorCard } from "./ui/ReactorCard";
import { startInlineAvatars, stopInlineAvatars } from "./inline-avatars";

const log = logger("who-reacted");

/**
 * Discord's reaction pill. `reactionInner_…` is the interactive element;
 * `reaction_…` is its wrapper, kept as a fallback for builds that drop the
 * inner node. (`reactions_…`, the row container, does not contain the
 * "reaction_" substring, so it can't match by accident.)
 */
const REACTION_SELECTOR = '[class*="reactionInner"], [class*="reaction_"]';

/** Grace period before hiding, so a 1px gap between pills doesn't flicker. */
const HIDE_GRACE_MS = 140;
/** While a card is up, verify its anchor is still on screen this often. */
const ANCHOR_CHECK_MS = 500;

let host: HTMLElement | null = null;
let unmount: (() => void) | null = null;
let anchor: Element | null = null;
let observer: ResizeObserver | null = null;
let anchorTimer: ReturnType<typeof setInterval> | undefined;

let hovered: Element | null = null;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let altDown = false;

/** Unsubs for inline-avatars toggles + hover-popout toggle. */
let inlineToggleUnsub: (() => void) | undefined;
let inlineCountUnsub: (() => void) | undefined;
let hoverToggleUnsub: (() => void) | undefined;
let hoverListenersAttached = false;

// --- positioning -----------------------------------------------------------

function reposition(): void {
  if (!host || !anchor) return;

  const rect = anchor.getBoundingClientRect();
  const width = host.offsetWidth || 220;
  const height = host.offsetHeight || 110;
  const margin = 8;

  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.top - height - margin;
  // Not enough room above (the first message in a channel): flip below.
  if (top < margin) top = rect.bottom + margin;

  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));

  host.style.left = `${Math.round(left)}px`;
  host.style.top = `${Math.round(top)}px`;
}

// --- show / hide -----------------------------------------------------------

function hide(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  if (anchorTimer) {
    clearInterval(anchorTimer);
    anchorTimer = undefined;
  }
  if (observer) {
    try {
      observer.disconnect();
    } catch {
      // already gone
    }
    observer = null;
  }
  if (unmount) {
    try {
      unmount();
    } catch {
      // already torn down
    }
    unmount = null;
  }
  if (host) {
    host.remove();
    host = null;
  }
  anchor = null;
}

function scheduleHide(): void {
  if (!host || hideTimer) return;
  hideTimer = setTimeout(() => {
    hideTimer = undefined;
    hide();
  }, HIDE_GRACE_MS);
}

function cancelHide(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
}

function show(element: Element, target: ReactionTarget): void {
  hide();

  host = document.createElement("div");
  // `halcyon` brings the design tokens into scope; this is our own surface, not
  // a decoration of Discord's DOM, so it uses them rather than literal values.
  host.className = "halcyon hc-whoreacted-host";
  host.setAttribute("data-hc-plugin", "who-reacted");
  document.body.appendChild(host);
  anchor = element;

  try {
    unmount = mountDetached(React.createElement(ReactorCard, { target }), host);
  } catch (err) {
    log.error("无法显示 reaction 名单", err);
    hide();
    return;
  }

  reposition();
  // The card grows as the list arrives; follow its size instead of guessing.
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(() => reposition());
    observer.observe(host);
  } else {
    setTimeout(reposition, 120);
    setTimeout(reposition, 400);
  }

  anchorTimer = setInterval(() => {
    if (!anchor || !document.contains(anchor)) hide();
  }, ANCHOR_CHECK_MS);
}

/** Whether the configured trigger is currently satisfied. */
function triggerOpen(): boolean {
  return settings.store.trigger !== "alt-hover" || altDown;
}

function tryShow(element: Element): void {
  if (!triggerOpen()) return;
  const target = resolveReaction(element);
  // Not a reaction pill after all (the "add reaction" button, a decoration):
  // stay quiet.
  if (!target) return;
  show(element, target);
}

// --- listeners -------------------------------------------------------------

function clearShowTimer(): void {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = undefined;
  }
}

function onMouseOver(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const pill = target.closest(REACTION_SELECTOR);

  if (!pill) {
    hovered = null;
    clearShowTimer();
    scheduleHide();
    return;
  }

  if (pill === hovered) {
    cancelHide();
    return;
  }

  hovered = pill;
  clearShowTimer();
  cancelHide();

  const delay = Math.max(0, Math.min(2000, settings.store.delay));
  showTimer = setTimeout(() => {
    showTimer = undefined;
    if (hovered === pill && document.contains(pill)) tryShow(pill);
  }, delay);
}

function onMouseLeaveWindow(): void {
  hovered = null;
  clearShowTimer();
  hide();
}

function onKeyDown(event: KeyboardEvent): void {
  if (!event.altKey) return;
  altDown = true;
  // Alt pressed while already hovering a pill: honour it right away instead of
  // waiting for the cursor to move off and back.
  if (settings.store.trigger === "alt-hover" && hovered && !host) {
    if (document.contains(hovered)) tryShow(hovered);
  }
}

function onKeyUp(event: KeyboardEvent): void {
  if (event.key === "Alt" || !event.altKey) {
    altDown = false;
    if (settings.store.trigger === "alt-hover") hide();
  }
}

function onScrollOrResize(): void {
  // The anchor moved out from under the card; reposition is cheap, but a
  // scrolling message list makes the card meaningless, so just drop it.
  if (host) hide();
}

function onWindowBlur(): void {
  altDown = false;
}

function attachHoverListeners(): void {
  if (hoverListenersAttached) return;
  hoverListenersAttached = true;
  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseleave", onMouseLeaveWindow);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  // Capture phase: Discord's message list is an inner scroller, scroll events
  // don't bubble.
  document.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("blur", onWindowBlur);
}

function detachHoverListeners(): void {
  if (!hoverListenersAttached) return;
  hoverListenersAttached = false;
  document.removeEventListener("mouseover", onMouseOver, true);
  document.removeEventListener("mouseleave", onMouseLeaveWindow);
  document.removeEventListener("keydown", onKeyDown, true);
  document.removeEventListener("keyup", onKeyUp, true);
  document.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
  window.removeEventListener("blur", onWindowBlur);
  clearShowTimer();
  hovered = null;
  altDown = false;
  hide();
}

export default definePlugin({
  id: "who-reacted",
  name: "谁点了表情",
  description:
    "在每个反应回应内嵌一小行头像（前几个反应者），像 Discord 桌面近版的 Reaction Preview 一样，不用悬停就看得到。名单按需查询、缓存 30 秒。悬停完整名单浮层默认关闭，需要时可在设置里开。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "utility",

  settings,

  start() {
    injectStyles();
    clearCache();

    // Ambient avatar stack on every visible reaction — the primary surface.
    startInlineAvatars();
    inlineToggleUnsub = settings.subscribe("inlineAvatars", (on: boolean) => {
      if (on) startInlineAvatars();
      else stopInlineAvatars();
    });
    inlineCountUnsub = settings.subscribe("inlineAvatarCount", () => {
      // Force a full redraw so the new count lands on already-decorated pills.
      stopInlineAvatars();
      startInlineAvatars();
    });

    // Hover popover — optional, off by default now that the inline stack is
    // the primary surface. Listeners are only attached while it's enabled.
    if (settings.store.hoverPopout) attachHoverListeners();
    hoverToggleUnsub = settings.subscribe("hoverPopout", (on: boolean) => {
      if (on) attachHoverListeners();
      else detachHoverListeners();
    });

    log.info(
      `已启用（内嵌头像：${settings.store.inlineAvatars ? "开" : "关"}，悬停浮层：${settings.store.hoverPopout ? "开" : "关"}）`
    );
  },

  stop() {
    detachHoverListeners();
    inlineToggleUnsub?.();
    inlineToggleUnsub = undefined;
    inlineCountUnsub?.();
    inlineCountUnsub = undefined;
    hoverToggleUnsub?.();
    hoverToggleUnsub = undefined;
    stopInlineAvatars();

    clearShowTimer();
    hovered = null;
    altDown = false;
    hide();
    clearCache();

    log.info("已停用");
  },

  /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
  probe(): Record<string, unknown> {
    let nodes: NodeListOf<Element> | null = null;
    try {
      nodes = document.querySelectorAll(REACTION_SELECTOR);
    } catch {
      nodes = null;
    }

    let sample: unknown = null;
    if (nodes && nodes.length > 0) {
      const target = resolveReaction(nodes[0]);
      sample = target
        ? {
            channelId: target.channelId,
            messageId: target.messageId,
            emoji: { id: target.emoji.id ?? null, name: target.emoji.name ?? null },
            count: target.count,
            type: target.type
          }
        : "fiber props 里没有 message + emoji —— 说明这个版本的 reaction 组件 props 变了";
    }

    return {
      trigger: settings.store.trigger,
      cardShown: host != null,
      reactionNodes: nodes?.length ?? -1,
      sample,
      anchors: probeSelectors([REACTION_SELECTOR, '[class*="reactionInner"]', '[class*="reaction_"]']),
      classHints: classNamesContaining("reaction"),
      restApiAvailable: (() => {
        try {
          return typeof (RestAPI as any)?.get === "function";
        } catch {
          return false;
        }
      })()
    };
  }
});
