// The composer button, and the floating panel it toggles.
//
// Mounting follows the pattern message-logger's toolbar button established:
// find a DOM anchor, append a host, mount React into it, and re-check on an
// interval because Discord repaints the composer constantly and takes our node
// with it. Nothing here uses a source patch — the composer's React tree is far
// more volatile than its accessibility contract.
//
// The panel itself lives on document.body (like who-reacted's card) so it is
// never clipped by the composer's overflow, and is positioned just above the
// input on an interval while open.

import { React, mountDetached } from "../../core/common/react";
import { injectStyles } from "../../ui/inject-styles";
import { EyeIcon } from "../../icons";
import { logger } from "../../core/logger";
import { findEditor, findButtonRow, reportAnchorMiss, resetAnchorWarning } from "./anchor";
import { PreviewHost } from "./ui/PreviewHost";

const log = logger("message-preview");

/** How often to re-check that our button is still in the DOM. */
const ENSURE_MS = 1000;
/** How often to re-anchor the open panel to the composer. */
const REPOSITION_MS = 250;
/** Gap between the panel's bottom edge and the composer's top edge. */
const GAP_PX = 8;

let buttonHost: HTMLElement | null = null;
let unmountButton: (() => void) | null = null;
let ensureTimer: ReturnType<typeof setInterval> | undefined;

let panelHost: HTMLElement | null = null;
let unmountPanel: (() => void) | null = null;
let repositionTimer: ReturnType<typeof setInterval> | undefined;

function isOpen(): boolean {
  return panelHost !== null;
}

function reposition(): void {
  if (!panelHost) return;
  const editor = findEditor();
  const anchor = (editor?.closest("form") as HTMLElement | null) ?? editor;
  if (!anchor) return;

  let rect: DOMRect;
  try {
    rect = anchor.getBoundingClientRect();
  } catch {
    return;
  }

  const width = Math.min(Math.max(rect.width, 320), 720);
  const height = panelHost.offsetHeight || 96;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  // Above the composer, unless there is no room up there.
  const top = Math.max(8, rect.top - height - GAP_PX);

  panelHost.style.width = `${Math.round(width)}px`;
  panelHost.style.left = `${Math.round(left)}px`;
  panelHost.style.top = `${Math.round(top)}px`;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isOpen()) {
    closePanel();
    // Don't let Escape also clear the user's draft — closing the thing they
    // just opened is the whole of what they asked for.
    event.stopPropagation();
    event.preventDefault();
  }
}

function openPanel(): void {
  if (isOpen()) return;
  injectStyles();

  const el = document.createElement("div");
  el.className = "halcyon hc-preview-host";
  el.setAttribute("data-hc-plugin", "message-preview");
  document.body.appendChild(el);

  try {
    unmountPanel = mountDetached(React.createElement(PreviewHost, { onEmptied: closePanel }), el);
    panelHost = el;
  } catch (err) {
    el.remove();
    log.error("预览面板挂载失败", err);
    return;
  }

  reposition();
  repositionTimer = setInterval(reposition, REPOSITION_MS);
  window.addEventListener("resize", reposition);
  // Capture phase: Discord's composer also handles Escape (it clears the reply
  // / draft state), and we want ours to win while the panel is up.
  document.addEventListener("keydown", onKeyDown, true);
}

function closePanel(): void {
  if (repositionTimer) {
    clearInterval(repositionTimer);
    repositionTimer = undefined;
  }
  window.removeEventListener("resize", reposition);
  document.removeEventListener("keydown", onKeyDown, true);

  if (unmountPanel) {
    try {
      unmountPanel();
    } catch {
      // already torn down
    }
    unmountPanel = null;
  }
  if (panelHost) {
    panelHost.remove();
    panelHost = null;
  }
}

function togglePanel(): void {
  if (isOpen()) closePanel();
  else openPanel();
}

function PreviewButton(): React.ReactElement {
  return (
    <button
      type="button"
      className="hc-preview-btn"
      aria-label="预览这条消息"
      title="预览发出后的样子"
      onClick={(event: any) => {
        // The composer's button row lives inside a form; a bare click would
        // submit it and send the draft — the exact opposite of "preview first".
        event?.preventDefault?.();
        event?.stopPropagation?.();
        togglePanel();
      }}
    >
      <EyeIcon size={24} />
    </button>
  );
}

function teardownButton(): void {
  if (unmountButton) {
    try {
      unmountButton();
    } catch {
      // already gone
    }
    unmountButton = null;
  }
  if (buttonHost) {
    buttonHost.remove();
    buttonHost = null;
  }
}

function ensureMounted(): void {
  if (buttonHost && document.contains(buttonHost)) return;
  // A stale host (composer repainted and took ours with it): drop it first.
  if (buttonHost) teardownButton();

  const row = findButtonRow();
  if (!row) {
    reportAnchorMiss();
    return;
  }

  const el = document.createElement("div");
  el.className = "hc-preview-btn-host";
  el.setAttribute("data-hc-plugin", "message-preview");
  try {
    // Ahead of the icon cluster, so it does not shove the emoji button — the
    // one people reach for by muscle memory — out of its usual spot.
    row.insertBefore(el, row.firstChild);
  } catch {
    return;
  }

  try {
    unmountButton = mountDetached(React.createElement(PreviewButton), el);
    buttonHost = el;
  } catch (err) {
    el.remove();
    log.debug("预览按钮挂载失败", err);
  }
}

export function startPreviewButton(): void {
  injectStyles();
  stopPreviewButton();
  resetAnchorWarning();

  ensureMounted();
  ensureTimer = setInterval(ensureMounted, ENSURE_MS);
}

export function stopPreviewButton(): void {
  if (ensureTimer) {
    clearInterval(ensureTimer);
    ensureTimer = undefined;
  }
  closePanel();
  teardownButton();
}
