// Clone logic for emote-cloner.
//
// Ported from Vencord's ExpressionCloner. The important part — and the reason an
// earlier raw-REST version "succeeded" but the emoji never showed up — is that
// emojis are created through Discord's OWN upload action
// (`findByCode(".GUILD_EMOJIS(", "EMOJI_UPLOAD_START")`), not a hand-rolled
// `POST /guilds/{id}/emojis`. The action performs the upload AND updates the
// client's EmojiStore, so the new emoji appears immediately; a raw POST returns
// 2xx but leaves the store stale, so it looked like nothing happened. Stickers
// still go up as a multipart POST, but we then dispatch the same Flux event the
// client fires itself so the StickersStore updates too.
//
// Images are fetched at decreasing sizes until they fit under Discord's caps
// (256KB emoji / 512KB sticker), exactly like Vencord.

import { RestAPI, UserStore, StickersStore, Constants, getDispatcher } from "../../core/common/discord";
import { findByCode } from "../../core/modules/webpack";
import { logger } from "../../core/logger";

const log = logger("emote-cloner");

export interface EmojiRef {
  id: string;
  name: string;
  isAnimated: boolean;
}

export interface StickerRef {
  id: string;
  name?: string;
  /** The related unicode emoji Discord requires as the sticker's tag. */
  tags?: string;
  description?: string;
}

const MAX_EMOJI_SIZE_BYTES = 256 * 1024;
const MAX_STICKER_SIZE_BYTES = 512 * 1024;

// Discord's own emoji-upload action. Located by a snippet of its body so it
// survives minification/renames. Cached after first lookup.
let uploadEmojiAction: ((opts: { guildId: string; name: string; image: string }) => any) | null = null;
function getUploadEmoji(): typeof uploadEmojiAction {
  if (uploadEmojiAction) return uploadEmojiAction;
  uploadEmojiAction = findByCode(".GUILD_EMOJIS(", "EMOJI_UPLOAD_START") ?? null;
  return uploadEmojiAction;
}

/** Discord emoji names must be 2–32 chars of word characters. */
function sanitizeEmojiName(name: string): string {
  let n = (name || "emoji").split("~")[0].replace(/[^\w]/g, "_");
  if (n.length < 2) n = `${n}_e`;
  return n.slice(0, 32);
}

/**
 * Sticker format_type → CDN extension. 1 PNG, 2 APNG, 3 LOTTIE, 4 GIF. Lottie
 * is vector JSON and can't be re-uploaded as an image; callers reject it.
 */
function stickerExt(formatType: number | undefined): "png" | "gif" | "json" {
  if (formatType === 4) return "gif";
  if (formatType === 3) return "json";
  return "png";
}

function emojiUrl(id: string, size: number): string {
  return `https://cdn.discordapp.com/emojis/${id}.webp?size=${size}&lossless=true&animated=true`;
}

function stickerUrl(id: string, ext: string, size: number): string {
  return `https://media.discordapp.net/stickers/${id}.${ext}?size=${size}&lossless=true&animated=true`;
}

/** Fetch a CDN asset, shrinking the requested size until it fits under `maxBytes`. */
async function fetchBlobUnderLimit(makeUrl: (size: number) => string, maxBytes: number): Promise<Blob> {
  for (let size = 4096; size >= 16; size /= 2) {
    const url = makeUrl(size);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载图片失败：HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob.size <= maxBytes) return blob;
  }
  throw new Error(`图片超出大小限制（${Math.round(maxBytes / 1024)}KB）`);
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("读取图片失败"));
    reader.readAsDataURL(blob);
  });
}

/**
 * The parsed JSON payload of a superagent-style RestAPI response. On some
 * Discord builds `res.body` is left null (the client only reads `res.text` for
 * these routes), so fall back to parsing the raw text. This was the actual
 * cause of "upload returned 200 but no id": the sticker WAS created, we just
 * couldn't read the echoed body — and the confirm-by-list also read an empty
 * body, so both looked like failure.
 */
function resPayload(res: any): any {
  if (res == null) return null;
  if (res.body != null && !(typeof res.body === "object" && Object.keys(res.body).length === 0)) {
    return res.body;
  }
  if (typeof res.text === "string" && res.text) {
    try {
      return JSON.parse(res.text);
    } catch {
      // not JSON
    }
  }
  return res.body ?? null;
}

/** Best-effort extraction of Discord's API error message from a failed call. */
function restErrorMessage(err: any): string {
  const body = err?.body ?? err?.response?.body;
  if (body) {
    try {
      const walk = (o: any): string | undefined => {
        if (!o || typeof o !== "object") return undefined;
        if (Array.isArray(o._errors) && o._errors[0]?.message) return o._errors[0].message;
        for (const k of Object.keys(o)) {
          const hit = walk(o[k]);
          if (hit) return hit;
        }
        return undefined;
      };
      const specific = walk(body.errors);
      if (specific) return specific;
    } catch {
      // fall through
    }
    if (typeof body.message === "string") return body.message;
  }
  // Discord's RestAPI rejections carry the raw response text on `.text`.
  if (typeof err?.text === "string") {
    try {
      const parsed = JSON.parse(err.text);
      if (parsed?.message) return parsed.message;
    } catch {
      // not JSON
    }
  }
  return err?.message ? String(err.message) : "未知错误";
}

/**
 * Clone one custom emoji into `guildId`. Prefers Discord's own upload action so
 * the client store updates and the emoji shows up right away; falls back to a
 * raw REST POST only if that action can't be located on this build.
 */
export async function cloneEmoji(guildId: string, emoji: EmojiRef): Promise<void> {
  const blob = await fetchBlobUnderLimit((size) => emojiUrl(emoji.id, size), MAX_EMOJI_SIZE_BYTES);
  const image = await blobToDataUri(blob);
  const name = sanitizeEmojiName(emoji.name);

  const upload = getUploadEmoji();
  if (typeof upload === "function") {
    try {
      await upload({ guildId, name, image });
      return;
    } catch (err) {
      log.error("emoji 上传（action）失败", err);
      throw new Error(restErrorMessage(err));
    }
  }

  // Fallback: raw REST. Works, but won't refresh the store until reload.
  try {
    await RestAPI.post({ url: `/guilds/${guildId}/emojis`, body: { image, name, roles: [] } });
  } catch (err) {
    log.error("emoji 上传（REST）失败", err);
    throw new Error(restErrorMessage(err));
  }
}

/**
 * A sticker's full metadata (name / tags / description / format_type). Mirrors
 * Vencord's `fetchSticker`: the client's StickersStore is checked first (a
 * sticker you can right-click is almost always cached there), and only on a
 * miss do we hit `GET /stickers/{id}`. On that fetch we also dispatch
 * `STICKER_FETCH_SUCCESS` so the store learns it, same as the client would.
 */
async function fetchStickerInfo(id: string): Promise<any | null> {
  try {
    const cached = (StickersStore as any).getStickerById?.(id);
    if (cached) return cached;
  } catch {
    // store not ready; fall through to REST
  }

  try {
    const res = await RestAPI.get({ url: `/stickers/${id}` });
    const body = resPayload(res);
    if (body) {
      try {
        getDispatcher()?.dispatch({ type: "STICKER_FETCH_SUCCESS", sticker: body });
      } catch {
        // non-fatal
      }
    }
    return body;
  } catch (err) {
    log.warn("could not fetch sticker info; using fallbacks", err);
    return null;
  }
}

/**
 * Clone one sticker into `guildId`. Metadata (name / tags / description /
 * format) comes from `fetchStickerInfo` — Discord *requires* a non-empty `tags`
 * (a related unicode emoji) on upload, so we always resolve real metadata
 * rather than guessing. Uploaded as a multipart file, then we dispatch the same
 * `GUILD_STICKERS_CREATE_SUCCESS` event the client fires so the StickersStore
 * updates and the sticker is usable without a reload. Lottie (vector) stickers
 * can't be re-uploaded as an image and are rejected.
 */
export async function cloneSticker(guildId: string, sticker: StickerRef): Promise<void> {
  const info = await fetchStickerInfo(sticker.id);

  // format_type 3 === LOTTIE: a vector sticker, not an image. Can't be cloned.
  if (info?.format_type === 3) {
    throw new Error("这是 Lottie 动态贴纸，无法复制");
  }

  const name = (sticker.name || info?.name || "sticker").slice(0, 30);
  const tags = sticker.tags || info?.tags || "🙂";
  const description = (sticker.description ?? info?.description ?? "").slice(0, 100);
  const ext = stickerExt(info?.format_type);

  const blob = await fetchBlobUnderLimit(
    (size) => stickerUrl(sticker.id, ext, size),
    MAX_STICKER_SIZE_BYTES
  );

  const form = new FormData();
  form.append("name", name);
  form.append("tags", tags);
  form.append("description", description);
  form.append("file", new File([blob], `sticker.${ext}`, { type: ext === "gif" ? "image/gif" : "image/png" }));

  // Exactly what Vencord does: POST the multipart through Discord's RestAPI to
  // the sticker-packs endpoint. With RestAPI now resolving to the REAL API
  // client (the one with getAPIBaseURL), this creates the sticker and echoes it
  // back under `body`.
  const url =
    (Constants as any)?.Endpoints?.GUILD_STICKER_PACKS?.(guildId) ?? `/guilds/${guildId}/stickers`;

  let created: any;
  try {
    const res = await RestAPI.post({ url, body: form });
    created = resPayload(res);
    if (created && !created.id && created.sticker?.id) created = created.sticker;
  } catch (err) {
    log.error("sticker 上传失败", err);
    throw new Error(restErrorMessage(err));
  }

  log.info("sticker uploaded", { id: created?.id, name: created?.name });

  // Mirror the event the client fires itself so the StickersStore updates and
  // the sticker is usable without a reload.
  try {
    getDispatcher()?.dispatch({
      type: "GUILD_STICKERS_CREATE_SUCCESS",
      guildId,
      sticker: { ...created, user: UserStore.getCurrentUser?.() }
    });
  } catch {
    // non-fatal — the sticker is created server-side regardless
  }
}
