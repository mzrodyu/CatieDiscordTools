// message-cleaner core.
//
// Uses raw fetch + Authorization header (same approach as the original 冲水
// userscript). Token is extracted from Discord's webpack modules or pasted by
// the user. This is the only way that works reliably across userscript,
// extension, and desktop injection contexts.

import { UserStore, SelectedChannelStore, ChannelStore, GuildStore } from "../../core/common/discord";
import { logger } from "../../core/logger";

const log = logger("message-cleaner");

const API_BASE = "https://discord.com/api/v10";

export interface CleanTarget {
  guildId: string;
  channelId: string;
  serverWide: boolean;
}

export interface CleanOptions extends CleanTarget {
  order: "asc" | "desc";
  limit: number;
  delayMs: number;
  after: Date | null;
  before: Date | null;
}

export interface CollectedMessage {
  id: string;
  channelId: string;
  content: string;
  timestamp: string;
}

export interface Controller {
  stopped: boolean;
}

export type Progress = (state: string, detail: string) => void;

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
}

export interface ChannelInfo {
  id: string;
  name: string;
  type: number;
}

const skipList = new Set<string>();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// --- Snowflake helpers (same as original script) ---------------------------

const EPOCH = 1420070400000n;
const tsToSf = (d: Date): string => String((BigInt(d.getTime()) - EPOCH) << 22n);

// --- Token extraction (same logic as original 冲水 script) -----------------

export function extractToken(): string | null {
  try {
    const chunks = (window as any).webpackChunkdiscord_app;
    if (Array.isArray(chunks)) {
      let tok: string | null = null;
      chunks.push([[Symbol()], {}, (req: any) => {
        for (const id of Object.keys(req.m || {})) {
          try {
            for (const m of [req(id), req(id)?.default]) {
              if (m && typeof m.getToken === "function") {
                const t = m.getToken();
                if (t && t.length > 20) { tok = t; return; }
              }
            }
          } catch { /* skip */ }
        }
      }]);
      if (tok) return tok;
    }
  } catch { /* skip */ }
  try {
    const t = window.localStorage.getItem("token");
    if (t) return t.replace(/^"|"$/g, "");
  } catch { /* skip */ }
  return null;
}

// --- Discord REST (raw fetch, same as original) ----------------------------

async function apiFetch(
  token: string,
  path: string,
  opts: RequestInit = {},
  attempt = 0
): Promise<any> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      ...opts,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        ...(opts.headers as Record<string, string> || {})
      }
    });
  } catch (e: any) {
    if (attempt < 5) { await sleep(3000); return apiFetch(token, path, opts, attempt + 1); }
    throw new Error(`网络请求失败: ${e.message}`);
  }
  if (res.status === 429) {
    const j: any = await res.json().catch(() => ({}));
    const wait = j.retry_after ? Math.ceil(Number(j.retry_after) * 1000) : Math.pow(2, attempt) * 1000;
    if (attempt < 5) { await sleep(wait + 500); return apiFetch(token, path, opts, attempt + 1); }
    throw new Error("触发限速且重试次数耗尽。");
  }
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${b.slice(0, 120)}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- Discord stores (for "当前" button & picker) ----------------------------

export function currentUserId(): string | undefined {
  try {
    const u = UserStore.getCurrentUser?.();
    if (u?.id) return String(u.id);
  } catch { /* skip */ }
  return undefined;
}

/**
 * Fallback: get user id by calling /users/@me with the token (same as the
 * original 冲水 script). Used when the local UserStore doesn't resolve.
 */
export async function fetchUserId(token: string): Promise<string> {
  const me = await apiFetch(token, "/users/@me");
  if (!me?.id) throw new Error("无法通过 Token 获取账号信息，请检查 Token 是否有效。");
  return String(me.id);
}

export function currentTarget(): CleanTarget | null {
  // Parse directly from URL, same as the original 冲水 script — stores are
  // unreliable because the intl proxy can shadow them on newer builds.
  try {
    const m = location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);
    if (!m) return null;
    return { guildId: m[1], channelId: m[2], serverWide: false };
  } catch { return null; }
}

export function getGuilds(): GuildInfo[] {
  try {
    const raw = GuildStore.getGuilds?.();
    if (!raw) return [];
    return Object.values(raw).map((g: any) => ({
      id: g.id,
      name: g.name ?? "未知",
      icon: g.icon ?? null
    }));
  } catch { return []; }
}

export function getChannels(guildId: string): ChannelInfo[] {
  try {
    // Pull all channels for this guild from the store
    const all: any[] = [];
    const raw = ChannelStore.getMutableGuildChannelsForGuild?.(guildId);
    if (raw) {
      for (const ch of Object.values(raw) as any[]) {
        if (ch && ch.type !== 4) all.push({ id: ch.id, name: ch.name ?? "未知", type: ch.type });
      }
    }
    if (all.length === 0) {
      // fallback: GuildChannelStore (already imported at top level)
      try {
        const { GuildChannelStore } = require("../../core/common/discord");
        const result = GuildChannelStore?.getChannels?.(guildId);
        if (result) {
          for (const group of Object.values(result) as any[]) {
            if (!Array.isArray(group)) continue;
            for (const entry of group) {
              const ch = entry?.channel ?? entry;
              if (ch && ch.id && ch.type !== 4) {
                all.push({ id: ch.id, name: ch.name ?? "未知", type: ch.type ?? 0 });
              }
            }
          }
        }
      } catch { /* skip */ }
    }
    return all;
  } catch { return []; }
}

// --- Collect ---------------------------------------------------------------

export async function collect(
  token: string,
  opts: CleanOptions,
  meId: string,
  onProgress: Progress,
  ctrl: Controller
): Promise<CollectedMessage[]> {
  const out: CollectedMessage[] = [];

  // Server-wide: search API
  if (opts.serverWide && opts.guildId && opts.guildId !== "@me") {
    let offset = 0;
    while (out.length < opts.limit) {
      if (ctrl.stopped) break;
      onProgress("全服检索中", `已找到 ${out.length} 条（搜索接口较慢，请稍候）`);
      const params = new URLSearchParams({
        author_id: meId,
        offset: String(offset),
        include_nsfw: "true",
        sort_order: opts.order === "asc" ? "asc" : "desc"
      });
      if (opts.after) params.set("min_id", tsToSf(opts.after));
      if (opts.before) params.set("max_id", tsToSf(opts.before));

      let res: any;
      try {
        res = await apiFetch(token, `/guilds/${opts.guildId}/messages/search?${params}`);
      } catch (e: any) {
        throw new Error(`全服检索失败：${e.message}`);
      }
      if (res?.message === "Indexing") {
        onProgress("建立索引中", "Discord 正在建立全服索引，10 秒后自动重试…");
        await sleep(10_000);
        continue;
      }
      if (!res?.messages || res.messages.length === 0) break;
      for (const group of res.messages) {
        const m = group.find((x: any) => x?.hit) ?? group.find((x: any) => x?.author?.id === meId) ?? group[0];
        if (!m || m.author?.id !== meId || skipList.has(m.id)) continue;
        out.push({ id: m.id, channelId: m.channel_id, content: m.content ?? "", timestamp: m.timestamp });
        if (out.length >= opts.limit) break;
      }
      if (res.messages.length < 25) break;
      offset += res.messages.length;
      await sleep(1200);
    }
    return out;
  }

  // Single channel
  if (!opts.channelId) throw new Error("请填写频道 ID，或开启「全服扫描」并填写服务器 ID。");
  let boundary: string | null = null;
  if (opts.order === "desc") {
    boundary = opts.before ? tsToSf(opts.before) : null;
  } else {
    boundary = opts.after ? tsToSf(opts.after) : "0";
  }

  while (out.length < opts.limit) {
    if (ctrl.stopped) break;
    const params = new URLSearchParams({ limit: "100" });
    if (boundary) params.set(opts.order === "desc" ? "before" : "after", boundary);
    let batch: any[];
    try {
      batch = await apiFetch(token, `/channels/${opts.channelId}/messages?${params}`);
    } catch (e: any) {
      throw new Error(`读取频道消息失败：${e.message}`);
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const m of batch) {
      const t = new Date(m.timestamp);
      if (opts.order === "desc" && opts.after && t < opts.after) { return out; }
      if (opts.order === "asc" && opts.before && t > opts.before) { return out; }
      const inRange = (!opts.after || t >= opts.after) && (!opts.before || t <= opts.before);
      if (m.author?.id === meId && inRange && !skipList.has(m.id)) {
        out.push({ id: m.id, channelId: m.channel_id ?? opts.channelId, content: m.content ?? "", timestamp: m.timestamp });
        if (out.length >= opts.limit) break;
      }
    }
    boundary = batch[batch.length - 1].id;
    onProgress("扫描中", `已找到 ${out.length} 条`);
    await sleep(150);
  }
  return out;
}

// --- Delete ----------------------------------------------------------------

export async function remove(
  token: string,
  messages: CollectedMessage[],
  opts: CleanOptions,
  onProgress: Progress,
  ctrl: Controller
): Promise<{ deleted: number; skipped: number }> {
  let deleted = 0;
  let skipped = 0;
  for (const m of messages) {
    if (ctrl.stopped) break;
    const t0 = Date.now();
    try {
      await apiFetch(token, `/channels/${m.channelId || opts.channelId}/messages/${m.id}`, { method: "DELETE" });
      deleted++;
    } catch (e: any) {
      skipped++;
      if (!String(e?.message ?? "").includes("404")) skipList.add(m.id);
      log.warn(`skip ${m.id}: ${e?.message ?? e}`);
    }
    onProgress("删除中", `已删除 ${deleted} / ${messages.length}${skipped ? `（跳过 ${skipped}）` : ""}`);
    const elapsed = Date.now() - t0;
    if (elapsed < opts.delayMs) await sleep(opts.delayMs - elapsed);
  }
  return { deleted, skipped };
}

// --- Count -----------------------------------------------------------------

export async function count(
  token: string,
  target: CleanTarget,
  meId: string
): Promise<{ total: number; indexing: boolean }> {
  let url: string;
  const params = new URLSearchParams({ author_id: meId, include_nsfw: "true" });
  if (target.serverWide && target.guildId && target.guildId !== "@me") {
    url = `/guilds/${target.guildId}/messages/search?${params}`;
  } else if (target.channelId) {
    url = `/channels/${target.channelId}/messages/search?${params}`;
  } else if (target.guildId && target.guildId !== "@me") {
    url = `/guilds/${target.guildId}/messages/search?${params}`;
  } else {
    throw new Error("请填写服务器 ID 或频道 ID。");
  }
  const res = await apiFetch(token, url);
  if (res?.message === "Indexing") return { total: 0, indexing: true };
  return { total: res?.total_results ?? 0, indexing: false };
}
