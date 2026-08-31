// The composer button, and the floating panel it toggles.
//
// The button is a React element Discord renders itself: the source patch in
// index.tsx pushes it into the composer's own button array, so React owns it.
// The first attempt inserted a DOM node into that flex row instead, and React —
// which re-renders the row on every keystroke — threw while reconciling and took
// the whole icon cluster with it (gift / GIF / sticker / emoji vanished, and the
// orphaned button did nothing when clicked). Never hand-splice that container.
//
// The panel is different: it lives on document.body, so it cannot be clipped by
// the composer's overflow and cannot disturb any tree Discord manages. It is
// positioned just above the input on an interval while open.

import { React, mountDetached } from "../../core/common/react";
import { injectStyles } from "../../ui/inject-styles";
import { EyeIcon } from "../../icons";
import { logger } from "../../core/logger";
import { findEditor } from "./anchor";
import { PreviewHost } from "./ui/PreviewHost";

const log = logger("message-preview");

/** How often to re-anchor the open panel to the composer. */
const REPOSITION_MS = 250;
/** Gap between the panel's bottom edge and the composer's top edge. */
const GAP_PX = 8;

let panelHost: HTMLElement | null = null;
let unmountPanel: (() => void) | null = null;
let repositionTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Whether the plugin is running. The patch stays in Discord's code for the
 * session (source patches cannot be unwound), so the injector consults this
 * instead — toggling the plugin off makes the button disappear on the composer's
 * next render rather than needing a restart.
 */
let active = false;

export function setActive(next: boolean): void {
  active = next;
}

export function isActive(): boolean {
  return active;
}

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
  // Above the composer, clamped so a tall panel cannot run off the top.
  const top = Math.max(8, rect.top - height - GAP_PX);

  panelHost.style.width = `${Math.round(width)}px`;
  panelHost.style.left = `${Math.round(left)}px`;
  panelHost.style.top = `${Math.round(top)}px`;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isOpen()) {
    closePreviewPanel();
    // Don't let Escape also clear the draft: closing what was just opened is
    // the whole of what the key was pressed for.
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
    unmountPanel = mountDetached(React.createElement(PreviewHost, { onEmptied: closePreviewPanel }), el);
    panelHost = el;
  } catch (err) {
    el.remove();
    log.error("预览面板挂载失败", err);
    return;
  }

  reposition();
  repositionTimer = setInterval(reposition, REPOSITION_MS);
  window.addEventListener("resize", reposition);
  // Capture phase: Discord's composer also handles Escape, and ours should win
  // while the panel is up.
  document.addEventListener("keydown", onKeyDown, true);
}

export function closePreviewPanel(): void {
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
  if (isOpen()) closePreviewPanel();
  else openPanel();
}

/**
 * The button itself. Deliberately trivial: it renders inside Discord's composer
 * tree, so anything that throws here would take the composer down with it.
 */
export function PreviewButton(): React.ReactElement {
  return (
    <button
      type="button"
      className="hc-preview-btn"
      aria-label="预览这条消息"
      title="预览发出后的样子"
      onClick={(event: any) => {
        // The button row sits inside a form; a bare click submits it and SENDS
        // the draft — the exact opposite of previewing first.
        event?.preventDefault?.();
        event?.stopPropagation?.();
        togglePanel();
      }}
    >
      <EyeIcon size={24} />
    </button>
  );
}
