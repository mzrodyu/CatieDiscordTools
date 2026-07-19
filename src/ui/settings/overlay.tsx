// Fallback entry point: mount the settings panel in a self-contained overlay.
//
// This path depends only on React and a DOM node we append ourselves, so it
// works even when the native settings-sidebar injection cannot find its anchor
// on a given Discord build. Exposed to the runtime as `open()`.

import { React, ReactDOM } from "../../core/common/react";
import { injectStyles } from "../inject-styles";
import { logger } from "../../core/logger";
import { SettingsRoot } from "./SettingsRoot";

const log = logger("settings");

let host: HTMLDivElement | null = null;
let keyHandler: ((event: KeyboardEvent) => void) | null = null;

export function openSettings(): void {
  injectStyles();
  if (host) return; // already open

  host = document.createElement("div");
  host.className = "halcyon";
  document.body.appendChild(host);

  keyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeSettings();
  };
  document.addEventListener("keydown", keyHandler);

  try {
    ReactDOM.render(React.createElement(Overlay, { onClose: closeSettings }), host);
  } catch (err) {
    log.error("could not open settings overlay", err);
    closeSettings();
  }
}

export function closeSettings(): void {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
  if (host) {
    try {
      ReactDOM.unmountComponentAtNode(host);
    } catch {
      // Nothing mounted; fall through to removal.
    }
    host.remove();
    host = null;
  }
}

export function isSettingsOpen(): boolean {
  return host != null;
}

function Overlay({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <div
      className="hc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Halcyon 设置"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <SettingsRoot onClose={onClose} />
    </div>
  );
}
