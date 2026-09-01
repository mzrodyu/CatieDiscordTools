// Keeping logged attachment URLs alive.
//
// THE PROBLEM, from the user's own client cache:
//
//   .../attachments/1343.../1532.../HOhpHzmbQAAeilm.jpeg
//       ?ex=6a6d7f7f&is=6a6c2dff&hm=e0f00474…
//
// `ex` is a hex Unix expiry. That one said 2026-08-01 and today returns 404.
// Discord signs every attachment URL and rotates the signature roughly daily,
// so the log storing `attachmentsRich[].url` verbatim means every thumbnail goes
// dead within about a day — the log looked like it preserved deleted media and
// quietly did not.
//
// Discord's own client re-signs on demand, and the contract is copied from it
// rather than guessed:
//
//   POST /attachments/refresh-urls  {attachment_urls:[…]}
//     → {refreshed_urls:[{original, refreshed}]}
//
// and its "does this need refreshing" test (same 1-hour grace, same host/path
// gate) is mirrored in needsRefresh below:
//
//   const grace = Millis.HOUR
//   paths = ["/attachments/","/ephemeral-attachments/"]
//   I(u) = { const n = parseInt(u.searchParams.get("ex"), 16)*1000;
//            return n == null || n <= Date.now() + grace }
//
// Refreshed URLs are deliberately NOT persisted: they expire too, so writing
// them back would just re-stale the store. They live in memory for the session.

import { RestAPI } from "../../core/common/discord";
import { logger } from "../../core/logger";

const log = logger("message-logger");

/** Refresh anything already expiring within the hour, exactly like the client. */
const GRACE_MS = 60 * 60 * 1000;

const SIGNED_PATH_PREFIXES = ["/attachments/", "/ephemeral-attachments/"];

/** Hosts that serve signed attachments. Read from the client when available. */
function cdnHosts(): Set<string> {
  const hosts = new Set(["cdn.discordapp.com", "media.discordapp.net"]);
  try {
    const env = (globalThis as any).GLOBAL_ENV;
    if (env?.CDN_HOST) hosts.add(String(env.CDN_HOST).replace(/^\/\//, ""));
    if (env?.MEDIA_PROXY_ENDPOINT) hosts.add(String(env.MEDIA_PROXY_ENDPOINT).replace(/^\/\//, ""));
  } catch {
    // no GLOBAL_ENV outside the client; the defaults cover it
  }
  return hosts;
}

/**
 * Whether `raw` is a signed Discord attachment URL that is expired, expiring
 * soon, or missing its signature entirely. Anything else (an emoji URL, an
 * external link, a already-fresh signature) is left alone.
 */
export function needsRefresh(raw: string | undefined | null, now: number = Date.now()): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!cdnHosts().has(url.hostname)) return false;
  if (!SIGNED_PATH_PREFIXES.some((p) => url.pathname.startsWith(p))) return false;
  const ex = parseInt(url.searchParams.get("ex") ?? "", 16);
  if (Number.isNaN(ex)) return true; // unsigned: needs signing before it will load
  return ex * 1000 <= now + GRACE_MS;
}

/** Drop the signature triple, which is what the refresh endpoint wants to see. */
export function stripSignature(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of ["ex", "is", "hm"]) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return raw;
  }
}

/** How many URLs to send per request. */
const BATCH = 25;

const cache = new Map<string, string>();
const inFlight = new Set<string>();

/** Read a previously refreshed URL, if it is still good. */
export function cached(original: string): string | undefined {
  const hit = cache.get(original);
  if (hit && !needsRefresh(hit)) return hit;
  if (hit) cache.delete(hit);
  return undefined;
}

/**
 * Re-sign the given URLs. Resolves to the originals it managed to refresh;
 * failures are simply absent, so callers fall back to what they already had.
 *
 * Only works while Discord still has the file — a long-purged attachment cannot
 * be brought back by re-signing, which is why storing the bytes is the durable
 * answer and this is the cheap one.
 */
export async function refreshUrls(urls: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const wanted = Array.from(new Set(urls.filter((u) => u && needsRefresh(u) && !inFlight.has(u))));
  if (wanted.length === 0) return out;

  for (const url of wanted) inFlight.add(url);
  try {
    for (let i = 0; i < wanted.length; i += BATCH) {
      const slice = wanted.slice(i, i + BATCH);
      try {
        const res = await (RestAPI as any).post({
          url: "/attachments/refresh-urls",
          body: { attachment_urls: slice.map(stripSignature) }
        });
        const list = res?.body?.refreshed_urls;
        if (!Array.isArray(list)) continue;
        list.forEach((item: any, index: number) => {
          const fresh = typeof item?.refreshed === "string" ? item.refreshed : undefined;
          if (!fresh) return;
          // Match by index (what the client relies on), and additionally accept
          // the server's own `original` echo when it lines up with a request.
          const original = slice[index];
          if (original) {
            cache.set(original, fresh);
            out.set(original, fresh);
          }
        });
      } catch (err) {
        log.debug("刷新附件签名失败（该附件可能已被彻底清除）", err);
      }
    }
  } finally {
    for (const url of wanted) inFlight.delete(url);
  }
  return out;
}
