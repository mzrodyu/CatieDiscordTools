// Injects Halcyon's stylesheet into the document exactly once.
//
// Styles are bundled as text (see the esbuild `.css` loader) and mounted in a
// single <style> tag tagged with a stable id so hot reloads replace rather than
// stack. Design tokens come first so component rules can reference them.

import tokens from "./tokens.css";
import components from "./components.css";

const STYLE_ID = "halcyon-styles";

let mounted = false;

export function injectStyles(): void {
  if (mounted) return;

  const existing = document.getElementById(STYLE_ID);
  const style = existing instanceof HTMLStyleElement ? existing : document.createElement("style");

  style.id = STYLE_ID;
  style.textContent = `${tokens}\n${components}`;

  if (!existing) {
    document.head.appendChild(style);
  }
  mounted = true;
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
  mounted = false;
}
