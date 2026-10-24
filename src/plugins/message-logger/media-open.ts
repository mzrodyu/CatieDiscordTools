// Opening recovered media.
//
// The thumbnails the recorder paints back (a deleted message's picture, or the
// version of an image an edit removed) are our own <img>s — Discord's click
// handlers know nothing about them, so a click did nothing.
//
// Earlier attempts forwarded the URL to the client's own media viewer. That
// module is internal and its export shape changes between builds; a wrong guess
// fails silently (the call "succeeds" and no modal appears), which is exactly
// how clicking looked dead. So the viewer here is ours: a body-mounted overlay
// with the full-size image. It cannot be broken by a client update, and it is
// the same behaviour on the web, the desktop shell and the extension.

import { originalSrc } from "../image-zoom/lens";

const OVERLAY_ID = "hc-media-overlay";

/** Remove the overlay and its listeners. Safe to call when none is open. */
function closeOverlay(): void {
  const el = document.getElementById(OVERLAY_ID);
  if (!el) return;
  el.remove();
}

/**
 * Show a recovered image full-size in a dismissable overlay.
 *
 * Uses the original (unresized) URL: the logged `proxy_url` carries the
 * thumbnail's `width`/`height` query params, which would otherwise open the
 * small copy. `originalSrc` strips those and keeps the signature params, so the
 * URL stays valid.
 */
export function openMedia(url: string | undefined): void {
  if (!url) return;
  let full = url;
  try {
    full = originalSrc(url);
  } catch {
    // keep the URL as-is
  }

  try {
    closeOverlay(); // one at a time

    const wrap = document.createElement("div");
    wrap.id = OVERLAY_ID;
    wrap.className = "hc-media-overlay";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");

    const img = document.createElement("img");
    img.className = "hc-media-overlay__img";
    img.src = full;
    img.alt = "";
    img.draggable = false;
    // Clicking the picture itself must not dismiss it.
    img.addEventListener("click", (event) => event.stopPropagation());

    const hint = document.createElement("div");
    hint.className = "hc-media-overlay__hint";
    hint.textContent = "点击空白处或按 Esc 关闭";

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    const close = (): void => {
      document.removeEventListener("keydown", onKey, true);
      wrap.remove();
    };
    wrap.addEventListener("click", close);
    document.addEventListener("keydown", onKey, true);

    wrap.appendChild(img);
    wrap.appendChild(hint);
    document.body.appendChild(wrap);
  } catch {
    // a click must never throw into Discord's tree
  }
}
