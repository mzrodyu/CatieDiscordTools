// Magnifier maths and the rules for which images get one.
//
// Pure so the fiddly part is testable: the lens has to keep the pixel under the
// cursor under the cursor, and it must not reveal blank space past the edge of
// the image when you drag it into a corner.

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LensStyle {
  /** Scaled backdrop size, in px. */
  bgWidth: number;
  bgHeight: number;
  /** Backdrop offset, in px (negative = shifted left/up). */
  bgX: number;
  bgY: number;
}

/**
 * Where to put the magnified backdrop so the point under the cursor sits at the
 * centre of the lens, clamped so the lens never shows past the image edges.
 */
export function lensStyle(rect: Rect, cursorX: number, cursorY: number, lens: number, zoom: number): LensStyle {
  const bgWidth = Math.max(1, rect.width * zoom);
  const bgHeight = Math.max(1, rect.height * zoom);
  const cx = Math.min(Math.max(cursorX - rect.left, 0), rect.width);
  const cy = Math.min(Math.max(cursorY - rect.top, 0), rect.height);

  const half = lens / 2;
  // Ideal: the cursor's point, scaled up, lands in the middle of the lens.
  let bgX = half - cx * zoom;
  let bgY = half - cy * zoom;

  // Clamp so the lens stays filled. When the scaled image is smaller than the
  // lens there is nothing to clamp against, so centre it instead.
  bgX = bgWidth <= lens ? (lens - bgWidth) / 2 : Math.min(0, Math.max(lens - bgWidth, bgX));
  bgY = bgHeight <= lens ? (lens - bgHeight) / 2 : Math.min(0, Math.max(lens - bgHeight, bgY));

  return { bgWidth, bgHeight, bgX, bgY };
}

/** Clamp a zoom step into range, keeping one decimal so the label reads well. */
export function stepZoom(current: number, direction: number, min: number, max: number): number {
  const next = current + (direction < 0 ? 0.5 : -0.5);
  return Math.round(Math.min(max, Math.max(min, next)) * 10) / 10;
}

/** Clamp a lens-size step. */
export function stepLens(current: number, direction: number): number {
  const next = current + (direction < 0 ? 40 : -40);
  return Math.min(800, Math.max(120, Math.round(next)));
}

const MEDIA_HOSTS = /(^|\.)(discordapp\.com|discordapp\.net|discord\.com)$/i;

/**
 * Parse a src without depending on `location`. An absolute URL is the normal
 * case; the relative fallback only matters for a protocol-relative or root-path
 * src, and going through `location` unconditionally would throw everywhere
 * `location` is absent — which also made this untestable outside a browser.
 */
function parseUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch {
    // not absolute; fall through
  }
  try {
    const base = typeof location !== "undefined" ? location.href : "https://discord.com/";
    return new URL(src, base);
  } catch {
    return null;
  }
}

/**
 * The best source to magnify. Discord serves resized copies via `width`/`height`
 * (and `size` for emoji-ish paths), so dropping those asks for the original and
 * the lens stops showing an upscaled thumbnail.
 *
 * The `ex` / `is` / `hm` signature params are deliberately KEPT: attachment URLs
 * are signed, and stripping them turns a working link into a 404 — the same trap
 * that silently broke saved attachment URLs elsewhere in this project.
 */
export function originalSrc(src: string): string {
  const url = parseUrl(src);
  if (!url || !MEDIA_HOSTS.test(url.hostname)) return src;
  for (const param of ["width", "height", "size", "quality", "format"]) url.searchParams.delete(param);
  return url.toString();
}

/**
 * Whether this element is worth magnifying. Size is the discriminator rather
 * than a class name: emoji (~22-48px) and avatars (~32-80px) are small, real
 * pictures are not, and a size test cannot rot when Discord rehashes its CSS.
 */
export function qualifies(el: Element | null, minSize: number): el is HTMLImageElement {
  if (!(el instanceof HTMLImageElement)) return false;
  if (!el.currentSrc && !el.src) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < minSize || rect.height < minSize) return false;
  // Our own preview panel and settings UI should stay untouched.
  if (el.closest(".halcyon") !== null) return false;
  return true;
}
