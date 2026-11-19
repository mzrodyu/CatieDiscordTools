// A "flush" button in the channel header toolbar.
//
// Mirrors message-logger's clock shortcut: one click opens Halcyon's settings
// straight to the cleaner page, and — since the button lives in a channel's
// header — pre-fills that channel as the cleanup target. Mounted the same
// DOM-anchor way as the log button and the member-count chip (no source patch):
// find the toolbar, insert a host, mount a React button, and re-check once a
// second because Discord repaints that toolbar constantly.

import { React, mountDetached } from "../../core/common/react";
import { openSettings } from "../../ui/settings/overlay";
import { injectStyles } from "../../ui/inject-styles";
import { TrashIcon } from "../../icons";
import { logger } from "../../core/logger";
import { currentTarget, setPendingTarget } from "./cleaner";

const log = logger("message-cleaner");

/** The channel header toolbar, matched by class prefix (hash-suffixed). */
const TOOLBAR_ANCHORS = [
  'section[class*="title_"] [class*="toolbar_"]',
  'section[class*="title"] [class*="toolbar"]',
  '[class*="upperContainer"] [class*="toolbar"]',
  '[class*="chat_"] [class*="toolbar_"]',
  '[class*="toolbar_"]'
];

const ENSURE_MS = 1000;

let host: HTMLElement | null = null;
let unmount: (() => void) | null = null;
let timer: ReturnType<typeof setInterval> | undefined;

function CleanerButton(): React.ReactElement {
  const onClick = () => {
    // The header belongs to a concrete channel, so aim the cleaner there.
    // Outside a channel (e.g. friends list) this is a no-op and the page opens
    // with its last/manual target.
    setPendingTarget(currentTarget());
    openSettings({ pluginId: "message-cleaner" });
  };

  return (
    <button
      type="button"
      className="hc-cleaner-toolbtn"
      aria-label="消息清理"
      title="冲水（删除自己的消息）"
      onClick={onClick}
    >
      <TrashIcon size={24} />
    </button>
  );
}

function findToolbar(): Element | null {
  for (const selector of TOOLBAR_ANCHORS) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {
      // bad selector for this engine; try next
    }
  }
  return null;
}

function ensureMounted(): void {
  // Still attached? Nothing to do.
  if (host && document.contains(host)) return;
  // A stale host (toolbar repainted and took ours with it): drop it first.
  if (host) teardown();

  const toolbar = findToolbar();
  if (!toolbar) return;

  const el = document.createElement("div");
  el.className = "hc-cleaner-toolbtn-host";
  el.setAttribute("data-hc-plugin", "message-cleaner");
  try {
    // First child so it sits at the left edge of the toolbar's icon cluster,
    // next to the message-log clock and the member-count chip.
    toolbar.insertBefore(el, toolbar.firstChild);
  } catch {
    return;
  }

  try {
    const off = mountDetached(React.createElement(CleanerButton), el);
    host = el;
    unmount = off;
  } catch (err) {
    el.remove();
    log.debug("toolbar button mount failed", err);
  }
}

function teardown(): void {
  if (unmount) {
    try {
      unmount();
    } catch {
      // already gone
    }
    unmount = null;
  }
  if (host) {
    host.remove();
    host = null;
  }
}

export function startCleanerToolbarButton(): void {
  injectStyles();
  stopCleanerToolbarButton();

  ensureMounted();
  timer = setInterval(ensureMounted, ENSURE_MS);
}

export function stopCleanerToolbarButton(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
  teardown();
}
