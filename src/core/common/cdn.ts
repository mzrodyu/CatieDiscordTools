// Discord CDN URL builders.
//
// One place, because several plugins hand these URLs to *other people's*
// clients (fake-nitro pastes them into outgoing messages) and a malformed one
// ships as a dead link that can't be taken back.
//
// THE EMOJI `.gif` TRAP
// --------------------
// The obvious shape for an animated emoji — `/emojis/<id>.gif?size=48` — is
// REJECTED by the CDN with `415 Unsupported Media Type`:
//
//   $ curl -i 'https://cdn.discordapp.com/emojis/1506584667904675881.gif?size=48'
//   HTTP/1.1 415 Unsupported Media Type
//   {"message":"Invalid resource \"…1506584667904675881.gif?size=48\""}
//
// The CDN only serves `.gif` when the stored asset is *itself* a GIF (animated
// avatars, whose hash starts with `a_`, still work that way). Modern animated
// custom emoji are stored as animated WebP, so `.gif` has no source to serve
// and 415s — for EVERY animated emoji, not a few unlucky ones.
//
// Discord's own client never asks for `.gif` here. Its getEmojiURL, read out of
// the live web bundle, is:
//
//   let s = canWebp ? "webp" : "png",         // static
//       l = canWebp ? "webp" : "gif",         // animated
//       d = forcePNG ? "png" : animated ? l : s,
//       c = canWebp && animated ? "&animated=true" : "";
//   `${CDN_HOST}/emojis/${id}.${d}?size=${size}${c}`
//
// i.e. animated → `.webp` + `animated=true`, and `.gif` is only the fallback
// for a browser with no WebP support (never Discord's Chromium). Requesting
// `.webp?size=48&animated=true` returns a real animated WebP (verified: the
// payload carries an `ANIM` chunk and is ~24KB vs ~630B for the still frame).
//
// So: always `.webp`, plus `animated=true` when animated. Adding the flag to a
// static emoji is harmless — the CDN returns byte-identical output — so callers
// that only *suspect* animation can pass `true` safely.

/** Sizes the CDN accepts for the `size` query param. */
const ALLOWED_SIZES = [16, 32, 48, 56, 64, 80, 96, 128, 160, 256, 300, 512, 600, 1024, 2048, 4096];

/** Snap an arbitrary size to the nearest size the CDN will honour. */
function normalizeSize(size: number, fallback: number): number {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  let best = ALLOWED_SIZES[0];
  for (const candidate of ALLOWED_SIZES) {
    if (Math.abs(candidate - n) < Math.abs(best - n)) best = candidate;
  }
  return best;
}

/**
 * CDN URL for a custom emoji, in the exact shape Discord's own client requests.
 *
 * Animated emoji get `.webp?size=<n>&animated=true` — NOT `.gif`, which the
 * CDN answers with 415 (see the note at the top of this file). Recipients see
 * an inline animated image; a `.gif` link renders as dead plain text.
 */
export function emojiCdnUrl(id: string, animated: boolean, size: number): string {
  const px = normalizeSize(size, 48);
  const query = `size=${px}${animated ? "&animated=true" : ""}`;
  return `https://cdn.discordapp.com/emojis/${id}.webp?${query}`;
}

/** Sticker format_type values, as Discord numbers them. */
export const StickerFormat = {
  PNG: 1,
  APNG: 2,
  LOTTIE: 3,
  GIF: 4
} as const;

/**
 * CDN URL for a sticker. Mirrors the client's own mapping: format_type GIF →
 * `.gif` (the stored asset is itself a gif, which is the one case the CDN
 * honours that extension), everything else → `.png`. APNG stickers stay `.png`
 * and animate on their own; asking for `.gif` there 415s, same trap as emoji.
 * Lottie is vector JSON with no image form — callers must reject it before
 * getting here.
 */
export function stickerCdnUrl(id: string, formatType: number | undefined, size: number): string {
  const px = normalizeSize(size, 160);
  const ext = formatType === StickerFormat.GIF ? "gif" : "png";
  return `https://media.discordapp.net/stickers/${id}.${ext}?size=${px}`;
}
