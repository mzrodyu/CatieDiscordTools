// The per-message hover button.
//
// Discord's message hover toolbar (the smiley / reply / edit / … cluster at the
// top-right of a message on hover) is React-managed, and — like the composer row
// — splicing a node into it can make React throw while reconciling. So we tread
// lightly: append our own plain DOM button, guard everything, and re-add it if a
// re-render drops it. We never touch Discord's own buttons.
//
// Which message a toolbar belongs to is read from the props React rendered its
// ancestors with (the `message` in the fiber chain) — the same read who-reacted
// uses — so a toolbar that isn't a message's (composer, etc.) resolves to
// nothing and is skipped. Clicking calls back into the plugin, which runs the
// same add/remove toggle the menu item does.

import { getFiberPropsChain } from "../../core/common/react";
import { logger } from "../../core/logger";
import { ensureQuickReactStyles } from "./ui/EmojiPicker";

const log = logger("quick-react");

const BTN_CLASS = "hc-qr-msgbtn";
const COALESCE_MS = 120;
const SWEEP_MS = 1500;

/** Candidate hover-toolbar containers; first selector that matches wins. */
const TOOLBAR_SELECTORS = ['[class*="buttonContainer"]', '[class*="buttons_"]'];

/** A smiley, drawn inline so a raw DOM button needs no React. Inherits color. */
const ICON_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="9"/>' +
  '<path d="M8.5 14.3c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7"/>' +
  '<path d="M9 9.5h.01M15 9.5h.01"/></svg>';

let observer: MutationObserver | undefined;
let sweepTimer: ReturnType<typeof setInterval> | undefined;
let pending: ReturnType<typeof setTimeout> | undefined;
let onClick: ((channelId: string, messageId: string) => void) | undefined;
let enabled: (() => boolean) | undefined;

function resolveMessage(node: Element): { channelId: string; messageId: string } | null {
  for (const props of getFiberPropsChain(node, 20)) {
    const m = props?.message;
    const channelId = m?.channel_id ?? m?.channelId;
    if (m?.id && channelId) return { channelId: String(channelId), messageId: String(m.id) };
  }
  return null;
}

function makeButton(channelId: string, messageId: string): HTMLElement {
  const btn = document.createElement("div");
  btn.className = BTN_CLASS;
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", "一键反应");
  btn.title = "一键反应";
  btn.innerHTML = ICON_SVG;
  const fire = (ev: Event): void => {
    ev.preventDefault();
    ev.stopPropagation();
    onClick?.(channelId, messageId);
  };
  btn.addEventListener("click", fire);
  btn.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") fire(ev);
  });
  return btn;
}

/** First toolbar selector that matches anything, as an array of elements. */
function toolbars(): Element[] {
  for (const selector of TOOLBAR_SELECTORS) {
    try {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length > 0) return Array.from(nodes);
    } catch {
      // bad selector on this engine; try the next
    }
  }
  return [];
}

/** Pull our buttons out of everywhere (used when disabled / on stop). */
function removeAll(): void {
  for (const btn of Array.from(document.querySelectorAll(`.${BTN_CLASS}`))) btn.remove();
}

function scan(): void {
  if (enabled && !enabled()) {
    removeAll();
    return;
  }
  for (const bar of toolbars()) {
    try {
      if (bar.querySelector(`.${BTN_CLASS}`)) continue; // already ours
      const msg = resolveMessage(bar);
      if (!msg) continue; // not a message's toolbar
      bar.insertBefore(makeButton(msg.channelId, msg.messageId), bar.firstChild);
    } catch (err) {
      log.debug("注入 hover 按钮失败", err);
    }
  }
}

function schedule(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = undefined;
    scan();
  }, COALESCE_MS);
}

/**
 * Start injecting the hover button. `click` runs the toggle; `isEnabled` gates
 * whether the button shows at all (so it stays hidden until reactions exist).
 */
export function startToolbarButton(
  click: (channelId: string, messageId: string) => void,
  isEnabled: () => boolean
): void {
  ensureQuickReactStyles();
  onClick = click;
  enabled = isEnabled;

  if (typeof document !== "undefined" && document.body) {
    try {
      observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (err) {
      log.warn("MutationObserver 挂接失败，改用轮询兜底", err);
    }
  }
  sweepTimer = setInterval(schedule, SWEEP_MS);
  scan();
}

export function stopToolbarButton(): void {
  observer?.disconnect();
  observer = undefined;
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = undefined;
  }
  if (pending) {
    clearTimeout(pending);
    pending = undefined;
  }
  removeAll();
  onClick = undefined;
  enabled = undefined;
}

/** Re-scan on demand (e.g. after the configured count changes). */
export function refreshToolbarButtons(): void {
  scan();
}
