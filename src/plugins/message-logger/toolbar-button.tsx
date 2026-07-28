// A "message log" button in the channel header toolbar.
//
// One click opens Halcyon's settings straight to the message-logger page, so
// the captured deleted/edited messages are one tap away instead of buried in
// the plugin list. Mounted the same DOM-anchor way member-count uses (no source
// patch): find the toolbar, append a host, mount a React button, and keep an
// eye on it since Discord re-renders that toolbar constantly.

import { React, mountDetached } from "../../core/common/react";
import { openSettings } from "../../ui/settings/overlay";
import { injectStyles } from "../../ui/inject-styles";
import { ClockIcon } from "../../icons";
import { logger } from "../../core/logger";
import { settings } from "./settings";

const log = logger("message-logger");

/** The channel header toolbar, matched by class prefix (hash-suffixed). */
const TOOLBAR_ANCHORS = [
  'section[class*="title_"] [class*="toolbar_"]',
  'section[class*="title"] [class*="toolbar"]',
  '[class*="chat_"] [class*="toolbar_"]',
  '[class*="toolbar_"]'
];

const ENSURE_MS = 1000;

let host: HTMLElement | null = null;
let unmount: (() => void) | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let unsubscribe: (() => void) | undefined;

function LogButton(): React.ReactElement {
  return (
    <button
      type="button"
      className="hc-mlog-toolbtn"
      aria-label="消息记录"
      title="消息记录（被删 / 编辑）"
      onClick={() => openSettings({ pluginId: "message-logger" })}
    >
      <ClockIcon size={24} />
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
  if (!settings.store.toolbarButton) {
    teardown();
    return;
  }
  // Still attached? Nothing to do.
  if (host && document.contains(host)) return;
  // A stale host (toolbar repainted and took ours with it): drop it first.
  if (host) teardown();

  const toolbar = findToolbar();
  if (!toolbar) return;

  const el = document.createElement("div");
  el.className = "hc-mlog-toolbtn-host";
  el.setAttribute("data-hc-plugin", "message-logger");
  try {
    // First child so it sits at the left edge of the toolbar's icon cluster.
    toolbar.insertBefore(el, toolbar.firstChild);
  } catch {
    return;
  }

  try {
    const off = mountDetached(React.createElement(LogButton), el);
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

export function startToolbarButton(): void {
  injectStyles();
  stopToolbarButton();

  ensureMounted();
  timer = setInterval(ensureMounted, ENSURE_MS);
  unsubscribe = settings.subscribe("toolbarButton", () => ensureMounted());
}

export function stopToolbarButton(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
  unsubscribe?.();
  unsubscribe = undefined;
  teardown();
}
