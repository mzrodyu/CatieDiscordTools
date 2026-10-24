// Opening recovered media.
//
// The thumbnails the recorder paints back (a deleted message's picture, or the
// version of an image an edit removed) are our own <img>s — Discord's own click
// handlers know nothing about them, so without this a click did nothing.
//
// The client's media viewer is the action creators module that builds the
// "Media Viewer Modal" (the same module Vencord resolves by the
// `hasMediaOptions` / `shouldHideMediaOptions` pair). It takes a list of
// `{ type: "IMAGE", url, width, height }` items — both dimensions are required
// unless the client carries Vencord's DynamicImageModalAPI patch, which this
// project does not. When the dimensions are unknown they are measured first;
// when the module cannot be resolved at all, the signed URL opens in a new tab.

import { findBySource, find } from "../../core/modules/webpack";
import { originalSrc } from "../image-zoom/lens";

type MediaModalFn = (props: { items: any[] }) => void;

let mediaModal: MediaModalFn | null | undefined;
let legacyImageModal: ((url: string) => void) | null | undefined;

function resolveMediaModal(): MediaModalFn | null {
  if (mediaModal !== undefined) return mediaModal;
  let resolved: MediaModalFn | null = null;
  try {
    const mod: any = findBySource("hasMediaOptions", "shouldHideMediaOptions");
    if (typeof mod === "function") {
      resolved = mod as MediaModalFn;
    } else if (typeof mod?.openMediaModal === "function") {
      resolved = mod.openMediaModal.bind(mod);
    } else if (typeof mod?.default === "function") {
      resolved = mod.default;
    }
  } catch {
    resolved = null;
  }
  mediaModal = resolved;
  return resolved;
}

/** Older builds exposed a plain `openImageModal(url)`. */
function resolveLegacyModal(): ((url: string) => void) | null {
  if (legacyImageModal !== undefined) return legacyImageModal;
  let resolved: ((url: string) => void) | null = null;
  try {
    const mod: any = find((m: any) => typeof m?.openImageModal === "function");
    if (mod) resolved = (url: string) => mod.openImageModal(url);
  } catch {
    resolved = null;
  }
  legacyImageModal = resolved;
  return resolved;
}

function openInTab(url: string): void {
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    // a click must never throw into Discord's tree
  }
}

function showInModal(url: string, width?: number, height?: number): boolean {
  const modal = resolveMediaModal();
  if (modal) {
    const open = (w: number, h: number): boolean => {
      try {
        modal({ items: [{ type: "IMAGE", url, original: url, width: w, height: h }] });
        return true;
      } catch {
        return false;
      }
    };
    if (width && height && open(width, height)) return true;
    // Dimensions missing: measure the picture, then open. This is why opening
    // can land a beat after the click — the alternative is a modal that renders
    // at 0×0 on clients without the one-dimension patch.
    try {
      const img = new Image();
      img.onload = () => {
        if (!open(img.naturalWidth || 1, img.naturalHeight || 1)) openInTab(url);
      };
      img.onerror = () => openInTab(url);
      img.src = url;
      return true;
    } catch {
      // fall through
    }
  }
  const legacy = resolveLegacyModal();
  if (legacy) {
    try {
      legacy(url);
      return true;
    } catch {
      // fall through
    }
  }
  return false;
}

/**
 * Show a recovered image full-size.
 *
 * Uses the original (unresized) URL: the logged `proxy_url` carries the
 * thumbnail's `width`/`height` query params, which would make the viewer open
 * the small copy. `originalSrc` strips those and keeps the signature params, so
 * the URL stays valid.
 */
export function openMedia(url: string | undefined, width?: number, height?: number): void {
  if (!url) return;
  let full = url;
  try {
    full = originalSrc(url);
  } catch {
    // keep the URL as-is
  }
  if (!showInModal(full, width, height)) openInTab(full);
}
