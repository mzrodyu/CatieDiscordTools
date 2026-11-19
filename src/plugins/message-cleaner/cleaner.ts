// message-cleaner core.
//
// Uses raw fetch + Authorization header (same approach as the original 冲水
// userscript). Token is extracted from Discord's webpack modules or pasted by
// the user. Guild/channel listings for the picker also go through the REST
// API (/users/@me/guilds, /guilds/:id/channels, /users/@me/channels) rather
// than Discord's internal Flux stores — on some client builds those stores
// resolve to the i18n message proxy instead of the real module (it happens to
// satisfy the same shape check), which fails silently. The REST API has no
// such ambiguity, and it's what the original 冲水 script always used.

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
  if (res.status === 204) return null;
  const body = await res.json();
  // Search indexing is identified by HTTP status, not an English message:
  // Discord also returns localized bodies containing code 110000.
  return res.status === 202 ? { ...body, indexing: true } : body;
}

// --- Current user / current channel ----------------------------------------

/**
 * Get the signed-in account's id by calling /users/@me with the token — same
 * as the original 冲水 script. There is no local-store fast path: on this
 * client build UserStore's shape check can match the i18n message proxy
 * instead of the real store, so a store read cannot be trusted here either.
 */
export async function fetchUserId(token: string): Promise<string> {
  const me = await apiFetch(token, "/users/@me");
  if (!me?.id) throw new Error("无法通过 Token 获取账号信息，请检查 Token 是否有效。");
  return String(me.id);
}

export function currentTarget(): CleanTarget | null {
  // Parse directly from the URL, same as the original 冲水 script's
  // "fill-cur" button — stores are unreliable because the intl proxy can
  // shadow them on some client builds.
  try {
    const m = location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);
    if (!m) return null;
    return { guildId: m[1], channelId: m[2], serverWide: false };
  } catch { return null; }
}

// The header button opens the settings panel, which mounts the page a tick
// later — hand the "current channel" target over through a one-shot slot so
// the page starts already aimed at the channel whose header was clicked.
let pendingTarget: CleanTarget | null = null;

export function setPendingTarget(target: CleanTarget | null): void {
  pendingTarget = target;
}

export function takePendingTarget(): CleanTarget | null {
  const target = pendingTarget;
  pendingTarget = null;
  return target;
}

// --- Picker (REST, same endpoints as the original 冲水 script) -------------

const SNOWFLAKE = /^\d{15,25}$/;

/** Human-readable guild name for an id, or null when it can't be resolved. */
export async function fetchGuildName(token: string, guildId: string): Promise<string | null> {
  if (!SNOWFLAKE.test(guildId)) return null;
  try {
    const guild = await apiFetch(token, `/guilds/${guildId}`);
    return guild?.name ?? null;
  } catch {
    return null;
  }
}

/** Channel name (or DM participant list) for an id, plus its guild when known. */
export async function fetchChannelName(
  token: string,
  channelId: string
): Promise<{ name: string; guildId: string | null } | null> {
  if (!SNOWFLAKE.test(channelId)) return null;
  try {
    const channel = await apiFetch(token, `/channels/${channelId}`);
    if (!channel) return null;
    const name =
      channel.name ||
      (Array.isArray(channel.recipients)
        ? channel.recipients.map((r: any) => r.global_name || r.username).join("、")
        : "") ||
      "未知频道";
    return { name, guildId: channel.guild_id ? String(channel.guild_id) : null };
  } catch {
    return null;
  }
}

export async function fetchGuilds(token: string): Promise<GuildInfo[]> {
  const guilds = await apiFetch(token, "/users/@me/guilds");
  if (!Array.isArray(guilds)) return [];
  return guilds.map((g: any) => ({ id: String(g.id), name: g.name ?? "未知", icon: g.icon ?? null }));
}

export async function fetchChannels(token: string, guildId: string): Promise<ChannelInfo[]> {
  if (guildId === "@me") {
    const dms = await apiFetch(token, "/users/@me/channels");
    if (!Array.isArray(dms)) return [];
    return dms.map((c: any) => {
      const name = c.name || (Array.isArray(c.recipients)
        ? c.recipients.map((r: any) => r.global_name || r.username).join("、")
        : "") || "未知私聊";
      return { id: String(c.id), name, type: c.type ?? 1 };
    });
  }
  const channels = await apiFetch(token, `/guilds/${guildId}/channels`);
  if (!Array.isArray(channels)) return [];
  return channels
    .filter((c: any) => c.type !== 4) // categories aren't selectable targets
    .map((c: any) => ({ id: String(c.id), name: c.name ?? "未知", type: c.type ?? 0 }));
}

// --- Search (shared by preview and count) -----------------------------------

const SEARCH_PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 1200;
const MAX_INDEXING_ATTEMPTS = 10;
const MAX_EMPTY_PAGE_ATTEMPTS = 3;

interface SearchScope {
  path: string;
  /** Only guild search uses a channel_id query filter. */
  channelId?: string;
}

interface SearchMessage {
  id: string;
  channel_id: string;
  author?: { id: string };
  hit?: boolean;
  content?: string;
  timestamp: string;
}

interface SearchResponse {
  messages?: SearchMessage[][];
  total_results?: number;
  indexing?: boolean;
  code?: number;
  message?: string;
  retry_after?: number;
}

async function resolveSearchScope(token: string, target: CleanTarget): Promise<SearchScope> {
  let guildId = target.guildId.trim();
  const channelId = target.channelId.trim();
  if (target.serverWide || !channelId) {
    if (!SNOWFLAKE.test(guildId)) throw new Error("全服检索需要有效的服务器 ID。");
    return { path: `/guilds/${guildId}/messages/search` };
  }
  if (!SNOWFLAKE.test(channelId)) throw new Error("请填写有效的频道 ID。");
  if (!guildId) {
    // Resolve a pasted channel id before choosing the endpoint. A failed
    // lookup must surface, not silently classify a guild channel as a DM.
    const channel = await apiFetch(token, `/channels/${channelId}`);
    if (!channel?.id) throw new Error("未获取到频道信息，请检查频道 ID。");
    guildId = channel.guild_id ? String(channel.guild_id) : "@me";
  }
  if (guildId === "@me") return { path: `/channels/${channelId}/messages/search` };
  if (!SNOWFLAKE.test(guildId)) throw new Error("请填写有效的服务器 ID。");
  // Same split as Undiscord: channel search is DM-only. Guild channels use
  // guild search plus channel_id, otherwise Discord returns 50024.
  return { path: `/guilds/${guildId}/messages/search`, channelId };
}

function searchParams(scope: SearchScope, meId: string): URLSearchParams {
  const params = new URLSearchParams({ author_id: meId, include_nsfw: "true" });
  if (scope.channelId) params.set("channel_id", scope.channelId);
  return params;
}

function isIndexing(res: SearchResponse): boolean {
  return res?.indexing === true || res?.code === 110000 || res?.message === "Indexing";
}

function searchTotal(res: SearchResponse): number | null {
  const total = res?.total_results;
  return typeof total === "number" && Number.isFinite(total) && total >= 0 ? total : null;
}

/** Stop promptly between requests, including during an indexing wait. */
async function waitForSearch(ms: number, ctrl: Controller): Promise<void> {
  while (ms > 0 && !ctrl.stopped) {
    const part = Math.min(ms, 250);
    await sleep(part);
    ms -= part;
  }
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
  if (ctrl.stopped) return out;
  if (!opts.serverWide && !opts.channelId.trim()) throw new Error("请填写频道 ID，或开启全服检索。");
  for (const date of [opts.after, opts.before]) {
    if (date && !Number.isFinite(date.getTime())) throw new Error("请填写有效的时间范围。");
  }
  if (opts.after && opts.before && opts.after >= opts.before) throw new Error("起始时间必须早于结束时间。");

  const scope = await resolveSearchScope(token, opts);
  const params = searchParams(scope, meId);
  params.set("sort_by", "timestamp");
  params.set("sort_order", opts.order);
  if (opts.after) params.set("min_id", tsToSf(opts.after));
  if (opts.before) params.set("max_id", tsToSf(opts.before));

  const seen = new Set<string>();
  const expectedChannel = opts.serverWide ? "" : opts.channelId.trim();
  let offset = 0;
  let page = 1;
  let indexingAttempts = 0;
  let emptyPageAttempts = 0;
  while (out.length < opts.limit && !ctrl.stopped) {
    params.set("offset", String(offset));
    onProgress("检索中", `正在请求第 ${page} 页（offset ${offset}），仅搜索你的消息…`);
    if (ctrl.stopped) break;
    const res: SearchResponse = await apiFetch(token, `${scope.path}?${params}`);
    if (ctrl.stopped) break;
    if (isIndexing(res)) {
      if (++indexingAttempts >= MAX_INDEXING_ATTEMPTS) throw new Error("搜索索引仍未就绪，请稍后重新预览。");
      const seconds = Number(res.retry_after);
      const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : 1000;
      onProgress("建立索引中", `Discord 正在建立搜索索引，${(wait / 1000).toFixed(1)} 秒后重试…`);
      await waitForSearch(wait, ctrl);
      continue;
    }
    indexingAttempts = 0;
    if (!Array.isArray(res?.messages)) throw new Error("搜索响应缺少消息列表，请稍后重新预览。");
    const total = searchTotal(res);
    // The index can briefly expose a total before the page is available.
    // Retry that page, never call a positive total + empty page a completed zero.
    if (res.messages.length === 0 && total !== null && offset < total) {
      if (++emptyPageAttempts >= MAX_EMPTY_PAGE_ATTEMPTS) {
        throw new Error(`搜索命中 ${total} 条，但分页仍为空，请稍后重新预览。`);
      }
      onProgress("索引同步中", `搜索命中 ${total} 条，当前分页暂未返回，稍后自动重试…`);
      await waitForSearch(SEARCH_DELAY_MS, ctrl);
      continue;
    }
    emptyPageAttempts = 0;

    let hits = 0;
    let newHits = 0;
    let filtered = 0;
    for (const group of res.messages) {
      if (!Array.isArray(group)) throw new Error("搜索响应的消息分组格式异常。");
      for (const m of group) {
        // Search includes nearby context (sometimes our own messages). Only
        // explicit hits are candidates; never fall back to group[0]/author.
        if (m?.hit !== true || !SNOWFLAKE.test(m.id)) continue;
        hits++;
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        newHits++;
        const time = new Date(m.timestamp).getTime();
        if (
          m.author?.id !== meId ||
          !SNOWFLAKE.test(m.channel_id) ||
          (expectedChannel && m.channel_id !== expectedChannel) ||
          skipList.has(m.id) || !Number.isFinite(time) ||
          (opts.after && time < opts.after.getTime()) ||
          (opts.before && time > opts.before.getTime())
        ) {
          filtered++;
          continue;
        }
        out.push({ id: m.id, channelId: m.channel_id, content: m.content ?? "", timestamp: m.timestamp });
        if (out.length >= opts.limit) break;
      }
      if (out.length >= opts.limit) break;
    }
    if (hits > 0 && newHits === 0) throw new Error("搜索接口返回重复分页，请稍后重新预览。");

    onProgress("检索中", `第 ${page} 页 · 搜索命中 ${total ?? "未知"} 条，已找到 ${out.length} 条${filtered ? `（本页过滤 ${filtered} 条非本人/非本频道等结果）` : ""}`);
    // Offset advances by raw search groups, not accepted/filtered messages.
    // If Discord returns a short intermediate page, trust total_results and
    // continue rather than prematurely reporting a partial preview as done.
    offset += res.messages.length;
    if (
      res.messages.length === 0 || out.length >= opts.limit ||
      (total !== null ? offset >= total : res.messages.length < SEARCH_PAGE_SIZE)
    ) break;
    page++;
    await waitForSearch(SEARCH_DELAY_MS, ctrl);
  }
  return out;
}

// --- Delete ----------------------------------------------------------------

export async function remove(
  token: string,
  messages: CollectedMessage[],
  opts: CleanOptions,
  onProgress: Progress,
  ctrl: Controller,
  onItem?: (message: CollectedMessage, ok: boolean, error?: string) => void
): Promise<{ deleted: number; skipped: number }> {
  let deleted = 0;
  let skipped = 0;
  for (const m of messages) {
    if (ctrl.stopped) break;
    const t0 = Date.now();
    try {
      await apiFetch(token, `/channels/${m.channelId || opts.channelId}/messages/${m.id}`, { method: "DELETE" });
      deleted++;
      onItem?.(m, true);
    } catch (e: any) {
      skipped++;
      if (!String(e?.message ?? "").includes("404")) skipList.add(m.id);
      log.warn(`skip ${m.id}: ${e?.message ?? e}`);
      onItem?.(m, false, String(e?.message ?? e));
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
  const scope = await resolveSearchScope(token, target);
  const res: SearchResponse = await apiFetch(token, `${scope.path}?${searchParams(scope, meId)}`);
  if (isIndexing(res)) return { total: 0, indexing: true };
  const total = searchTotal(res);
  if (total === null) throw new Error("搜索响应缺少发言总数，请稍后重新统计。");
  return { total, indexing: false };
}
