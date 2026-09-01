// Turning an image URL into something Discord will render.
//
// Rich-presence images are not URLs: they are asset ids belonging to an
// application. An arbitrary image has to be registered first, via
// `POST /applications/{appId}/external-assets` with `{urls:[…]}`, which answers
// with `external_asset_path` values that become `mp:<path>` image keys. That is
// the same endpoint the client itself uses (APPLICATION_EXTERNAL_ASSETS in its
// endpoint table), so nothing here is a private API.
//
// Results are cached: the mapping never changes for a given URL, and the presence
// is rebuilt on every settings keystroke.

import { RestAPI, Constants } from "../../core/common/discord";
import { logger } from "../../core/logger";

const log = logger("custom-rpc");

/** url -> `mp:external/…` key, or null once a lookup has definitively failed. */
const cache = new Map<string, string | null>();

function endpoint(appId: string): string {
  try {
    const builder = (Constants as any)?.Endpoints?.APPLICATION_EXTERNAL_ASSETS;
    if (typeof builder === "function") return builder(appId);
  } catch {
    // fall through to the literal path
  }
  return `/applications/${appId}/external-assets`;
}

/** The cached key for a URL, if we already traded it in. */
export function cachedAsset(url: string): string | null | undefined {
  return cache.get(url);
}

/**
 * Register `urls` with the application and cache the resulting keys. Resolves
 * once, whatever the outcome, so a dead image cannot make the caller retry on
 * every keystroke.
 */
export async function resolveAssets(appId: string, urls: string[]): Promise<void> {
  const pending = urls.filter((u) => u && !cache.has(u));
  if (!appId || pending.length === 0) return;

  try {
    const response = await (RestAPI as any).post({
      url: endpoint(appId),
      body: { urls: pending }
    });
    const list: any[] = response?.body ?? [];
    pending.forEach((url, i) => {
      const path = list[i]?.external_asset_path;
      if (typeof path === "string" && path) cache.set(url, `mp:${path}`);
      else cache.set(url, null);
    });
  } catch (err) {
    // Most often a wrong application id (404) or an unreachable image.
    for (const url of pending) cache.set(url, null);
    log.debug("图片换取资源 id 失败（应用 ID 是否正确？图片能公开访问吗？）", err);
  }
}

export function clearAssetCache(): void {
  cache.clear();
}
