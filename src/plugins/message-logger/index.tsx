// message-logger — keep a record of deleted messages and edit history.
//
// Two layers, by reliability:
//
//   1. The recorder (robust). We hook the Flux dispatcher *before* it fans an
//      action out to the stores. At that instant a message being deleted is
//      still in the cache, so we can snapshot it; a message being edited still
//      holds its previous text, so we can keep it. Everything captured lands in
//      the plugin's own store and shows up on its page — no source patches, no
//      version-specific selectors, so this part just works.
//
//   2. In-chat preservation (best-effort). Keeping a deleted message visible in
//      place, tinted red, requires editing Discord's own message store and
//      message component as they load. Those are the two source patches below.
//      They target internal shapes that shift between client versions; if a
//      patch does not match, it no-ops and the recorder above still does its
//      job. `start()` reports which patches took, so the state is never a
//      mystery.

import { definePlugin } from "../../core/plugin";
import { patcher, type Unpatch, type PatchContext } from "../../core/patcher";
import { getSourcePatchReport, findAll, isFluxDispatcher, dumpFactorySource } from "../../core/modules/webpack";
import { getDispatcher, MessageStore, UserStore } from "../../core/common/discord";
import { useState, useEffect } from "../../core/common/react";
import { logger } from "../../core/logger";
import { ClockIcon } from "../../icons";
import { settings } from "./settings";
import { messageLog, type Author, type DeletedEntry, type RichAttachment } from "./store";
import { renderContent } from "./render-content";
import { LogPage } from "./ui/LogPage";

const log = logger("message-logger");

let unpatchDispatch: Unpatch | undefined;
let unsubscribeRetention: (() => void) | undefined;
let unsubscribeDeleteStyle: (() => void) | undefined;

// --- reading Discord's message shapes ------------------------------------
// Message records mix camelCase and snake_case across versions, and timestamps
// may be numbers, ISO strings, or moment-like objects. Read defensively.

function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  if (value && typeof (value as { valueOf?: () => unknown }).valueOf === "function") {
    const raw = (value as { valueOf: () => unknown }).valueOf();
    if (typeof raw === "number") return raw;
  }
  return Date.now();
}

function displayName(author: any): string {
  return author?.globalName || author?.global_name || author?.username || author?.name || "未知用户";
}

function toAuthor(author: any): Author {
  return { id: String(author?.id ?? "0"), name: displayName(author), bot: Boolean(author?.bot) };
}

function attachmentsOf(message: any): string[] {
  const list = message?.attachments;
  if (!Array.isArray(list)) return [];
  return list.map((a: any) => a?.filename || a?.url || "附件").slice(0, 20);
}

/**
 * Full attachment records, JSON-safe, for re-rendering on revive. Store
 * records and raw payloads differ in casing (proxyURL vs proxy_url etc.), so
 * both spellings are read.
 */
function richAttachmentsOf(message: any): RichAttachment[] {
  const list = message?.attachments;
  if (!Array.isArray(list)) return [];
  return list
    .map((a: any) => ({
      id: a?.id != null ? String(a.id) : undefined,
      filename: a?.filename ?? a?.fileName ?? undefined,
      url: a?.url ?? undefined,
      proxy_url: a?.proxy_url ?? a?.proxyURL ?? a?.proxyUrl ?? undefined,
      content_type: a?.content_type ?? a?.contentType ?? undefined,
      width: typeof a?.width === "number" ? a.width : undefined,
      height: typeof a?.height === "number" ? a.height : undefined,
      size: typeof a?.size === "number" ? a.size : undefined
    }))
    .filter((a: RichAttachment) => a.url || a.proxy_url)
    .slice(0, 10);
}

/**
 * Embeds, JSON-cloned so no live class instances (with methods/cycles) end up
 * persisted. GIF-picker messages are `content: <gif url>` + a gifv embed, so
 * without this the revived message shows a bare link and no image.
 */
function embedsOf(message: any): any[] {
  const list = message?.embeds;
  if (!Array.isArray(list) || list.length === 0) return [];
  try {
    return JSON.parse(JSON.stringify(list)).slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * Sticker items off a message. Sticker messages carry EMPTY `content` — the
 * payload lives in `sticker_items` (raw gateway/API) or `stickerItems`
 * (store records) — so capture that treats empty-content as "nothing to keep"
 * silently drops them without this.
 */
function stickersOf(message: any): Array<{ id: string; name: string; format_type?: number }> {
  const list = message?.sticker_items ?? message?.stickerItems ?? message?.stickers;
  if (!Array.isArray(list)) return [];
  return list
    .filter((s: any) => s?.id != null)
    .map((s: any) => ({
      id: String(s.id),
      name: String(s.name ?? "贴纸"),
      format_type: typeof s.format_type === "number" ? s.format_type : s.formatType
    }))
    .slice(0, 4);
}

function currentUserId(): string | undefined {
  try {
    return UserStore.getCurrentUser?.()?.id;
  } catch {
    return undefined;
  }
}

let selfIgnoreLogged = false;

function isIgnored(channelId: string, author: { id?: string; bot?: boolean } | undefined): boolean {
  const s = settings.store;
  if (channelId && s.ignoredChannels.includes(channelId)) return true;
  // Ids are snowflake strings, but a record may hand back a number or a boxed
  // value — String() both sides so the compare can't miss on type alone (that
  // was a suspected cause of "屏蔽自己没生效").
  const authorId = author?.id != null ? String(author.id) : "";
  if (authorId && s.ignoredUsers.includes(authorId)) return true;
  if (s.ignoreBots && author?.bot) return true;
  if (s.ignoreSelf) {
    const me = currentUserId();
    // One-time ground-truth line (visible in the in-app 日志 view): if 屏蔽自己
    // still doesn't bite, this says whether it's the current-user id that can't
    // be read, or the two ids simply differing.
    if (!selfIgnoreLogged) {
      selfIgnoreLogged = true;
      const hit = Boolean(authorId && me && authorId === String(me));
      log.info(
        `屏蔽自己 自检 — 开关=on，消息作者id=${authorId || "(空)"}，当前用户id=${me ?? "(取不到)"}，判定=${
          hit ? "命中→会屏蔽" : "未命中→不屏蔽"
        }`
      );
    }
    if (authorId && me && authorId === String(me)) return true;
  }
  return false;
}

// --- the recorder ---------------------------------------------------------

// Last-seen snapshot per message, kept by us. Discord's own cache can't be the
// only source of truth: your own edits are applied to the cache optimistically
// (so the "before" text is gone by MESSAGE_UPDATE), and hooks that only fire
// after the stores run find deleted messages already evicted. The shadow map
// is fed from create/load/update traffic and keeps enough of the message to
// reconstruct a record without the cache.
interface Snap {
  content: string;
  author?: any;
  attachments?: string[];
  attachmentsRich?: RichAttachment[];
  embeds?: any[];
  stickers?: Array<{ id: string; name: string; format_type?: number }>;
  sentAt?: number;
  guildId?: string;
}
const shadow = new Map<string, Snap>(); // `${channelId}:${id}` -> snapshot
const SHADOW_MAX = 4000;

function remember(channelId: unknown, id: unknown, message: any): void {
  const content = message?.content;
  if (!channelId || !id || typeof content !== "string") return;
  const key = `${channelId}:${id}`;
  const prior = shadow.get(key);
  if (prior) shadow.delete(key); // reinsert to refresh eviction order
  const stickers = stickersOf(message);
  const rich = richAttachmentsOf(message);
  const embeds = embedsOf(message);
  shadow.set(key, {
    content,
    // Partial payloads (some MESSAGE_UPDATEs) may omit these; keep what we had.
    author: message?.author ?? prior?.author,
    attachments: Array.isArray(message?.attachments) ? attachmentsOf(message) : prior?.attachments,
    attachmentsRich: rich.length ? rich : prior?.attachmentsRich,
    embeds: embeds.length ? embeds : prior?.embeds,
    stickers: stickers.length ? stickers : prior?.stickers,
    sentAt: message?.timestamp != null ? toMillis(message.timestamp) : prior?.sentAt,
    guildId: message?.guild_id ?? message?.guildId ?? prior?.guildId
  });
  if (shadow.size > SHADOW_MAX) {
    const oldest = shadow.keys().next().value;
    if (oldest !== undefined) shadow.delete(oldest);
  }
}

function readMessage(channelId: string, id: string): any {
  try {
    return MessageStore.getMessage(channelId, id);
  } catch {
    return undefined;
  }
}

/**
 * Tint a kept-deleted message's row live, by hand, in the DOM.
 *
 * This is the piece that makes the red show WITHOUT a reload. The store patch
 * keeps the record with `deleted: true` (the live self-check confirms this), so
 * the message's `<li>` is still on screen — but Discord wraps each row in a
 * memo whose comparator doesn't look at `deleted`, so committing the flag does
 * not repaint the row, and the className injection (which only runs on render)
 * never re-runs. The tint therefore only appeared after a reload, when the list
 * mounts fresh. Discord tags every message row with the DOM id
 * `chat-messages-<channelId>-<messageId>` (the same handle Vencord toggles), so
 * we add the `.hc-deleted` hook straight to that element. `<html>` already
 * carries `hc-mlog-<style>`, so the CSS lights up immediately.
 *
 * It re-applies across the next few frames because a row that DOES repaint
 * right after the commit would drop a class set before that paint; any later
 * natural re-render keeps it because `deletedClass` re-adds the same class from
 * the persisted record.
 */
// The red tint is maintained by a DOM sweep, not left to Discord's render.
// Reason: when a deleted row repaints (our forced MESSAGE_UPDATE, a hover, an
// embed unfurl), Discord recomputes the row's className from scratch, and on
// some row shapes (jumbo emoji, sticker-only) that recompute dropped our
// `.hc-deleted` hook — so the red showed, then flickered off. A MutationObserver
// re-adds the hook to every deleted row on any DOM change, so a repaint can't
// lose it. The class alone lights the CSS (<html> carries hc-mlog-<style>).

let tintObserver: MutationObserver | undefined;
let tintInterval: ReturnType<typeof setInterval> | undefined;
let sweepScheduled = false;

/**
 * Re-assert everything the red tint needs, for every rendered deleted row:
 *   1. `<html>` carries `hc-mlog-<style>` — the CSS `.hc-mlog-tint .hc-deleted`
 *      needs BOTH this and the row class. If a repaint (or anything) strips the
 *      root class, the row background/left-bar dies while the marker — whose
 *      color is unconditional — stays red. That is exactly the reported "整行
 *      红底没了、只剩小红标记" state, so we restore it here too, not just the row.
 *   2. `.hc-deleted` on each deleted row's `<li>`.
 * Cheap and idempotent: only writes when a class is actually missing.
 */
function sweepDeletedRows(): void {
  try {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const want = `hc-mlog-${settings.store.deleteStyle || "tint"}`;
    if (root && !root.classList.contains(want)) {
      for (const s of DELETE_STYLE_CLASSES) root.classList.remove(`hc-mlog-${s}`);
      root.classList.add(want);
    }
    const rows = document.querySelectorAll('li[id^="chat-messages-"]');
    rows.forEach((el) => {
      // id is `chat-messages-<channelId>-<messageId>` (older: `chat-messages-<messageId>`).
      if (!el.classList.contains("hc-deleted") && rowIsDeleted(el)) el.classList.add("hc-deleted");
    });
  } catch {
    // best-effort; the reload path still tints via the render patch
  }
}

/** Coalesce sweeps triggered by bursts of DOM mutations. */
function scheduleSweep(): void {
  if (sweepScheduled) return;
  sweepScheduled = true;
  setTimeout(() => {
    sweepScheduled = false;
    sweepDeletedRows();
  }, 60);
}

/** True if a `chat-messages-…` row's id maps to a message we recorded deleted. */
function rowIsDeleted(el: Element): boolean {
  const parts = el.id.split("-");
  const messageId = parts[parts.length - 1];
  const channelId = parts.length >= 4 ? parts[parts.length - 2] : undefined;
  return channelId
    ? messageLog.isDeleted(channelId, messageId)
    : messageLog.getDeleted().some((d) => d.id === messageId);
}

function startDomTinter(): void {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;

  tintObserver = new MutationObserver((mutations) => {
    // Fast path: the moment a repaint rewrites a deleted row's className and
    // drops our hook, re-add it synchronously in the same batch, so the red
    // never visibly flickers off. `attributeFilter: ["class"]` is what makes
    // this fire — a className rewrite adds/removes no nodes, so childList alone
    // (the earlier bug) never saw it.
    for (const mu of mutations) {
      const t = mu.target as Element;
      if (
        mu.type === "attributes" &&
        t instanceof Element &&
        t.id &&
        t.id.startsWith("chat-messages-") &&
        !t.classList.contains("hc-deleted") &&
        rowIsDeleted(t)
      ) {
        t.classList.add("hc-deleted");
      }
    }
    // Slow path: new rows scrolled/loaded into view get caught by the sweep.
    scheduleSweep();
  });

  // Attach to `documentElement`, not `body`: it exists even at document-start
  // (the earlier bug observed `body`, which was null then, so observe(null)
  // threw and the observer never attached), AND watching it means a strip of
  // the `hc-mlog-<style>` class on `<html>` itself fires the observer too — the
  // body-scoped version never saw that, so a lost root class stayed lost.
  const attach = (): boolean => {
    const target = document.documentElement ?? document.body;
    if (!target) return false;
    sweepDeletedRows();
    tintObserver?.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
    return true;
  };
  if (!attach()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (attach() || ++tries > 100) clearInterval(timer);
    }, 100);
  }

  // Safety net. The observer SHOULD catch every strip, but its timing depends on
  // Discord's repaint plumbing; a low-frequency sweep guarantees the tint (and
  // the root class) are restored within a beat even if a repaint slips past.
  // Idempotent and cheap — it only writes when a class is actually missing.
  if (tintInterval) clearInterval(tintInterval);
  tintInterval = setInterval(sweepDeletedRows, 300);
}

function stopDomTinter(): void {
  tintObserver?.disconnect();
  tintObserver = undefined;
  if (tintInterval) {
    clearInterval(tintInterval);
    tintInterval = undefined;
  }
}

/** Instant tint for a just-deleted row, before the observer's next sweep. */
function tintRowInDom(channelId: string, messageId: string): void {
  try {
    const el =
      document.getElementById(`chat-messages-${channelId}-${messageId}`) ||
      document.getElementById(`chat-messages-${messageId}`);
    if (el) el.classList.add("hc-deleted");
  } catch {
    // best-effort
  }
  scheduleSweep();
}

// Deletes we've already asked Discord to repaint, so multiple recorder seams
// firing for one delete don't each dispatch a redundant update. Cleared after a
// beat — a later genuine re-delete of the same id (rare) can still repaint.
const rerendered = new Set<string>();

/**
 * Force Discord to repaint a kept-deleted message row, in full — tint AND the
 * "此消息已删除" marker — without a reload.
 *
 * The store patch keeps the record with `deleted:true`, but Discord memoizes
 * each row on fields that don't include `deleted`, so committing the flag never
 * repaints the row: the tint/marker code only runs on render, so both appeared
 * only after a reload remounts the list. Re-dispatching the message as a
 * MESSAGE_UPDATE makes the store rebuild the Message record — a NEW reference —
 * so the memo can't skip it. On that repaint the render patches run and, keyed
 * off the persisted log, paint the exact red row + marker a reload produces.
 *
 * The payload is a faithful raw (snake_case) message rebuilt from the kept
 * record, so nothing is degraded; content and timestamps are unchanged, so it
 * never reads as an edit. Deferred and guarded — a throw here must never break
 * the client, and dispatching mid-dispatch would throw, so callers defer.
 */
function forceRowRerender(channelId: string, messageId: string): void {
  try {
    const dispatcher = getDispatcher();
    if (!dispatcher || typeof dispatcher.dispatch !== "function") return;

    const msg = readMessage(channelId, messageId);
    if (!msg) return; // not kept (store patch missed) — nothing to repaint

    const a: any = msg.author ?? {};
    const iso = (v: any): string | null => {
      if (v == null) return null;
      if (typeof v?.toISOString === "function") return v.toISOString();
      if (typeof v === "string") return v;
      return new Date(toMillis(v)).toISOString();
    };

    // The kept record is the best source, but some fields are populated
    // asynchronously — an image/emoji/sticker URL's auto-embed lands a beat
    // after the message is sent. If the live record is missing them at delete
    // time, fall back to what the recorder captured earlier (the exact data a
    // reload uses), so the repaint shows the inline image instead of a bare
    // link. This is what made a deleted emoji/sticker show only its URL.
    const entry = messageLog.findDeleted(channelId, messageId);
    let embeds = embedsOf(msg);
    if ((!embeds || embeds.length === 0) && entry?.embeds?.length) embeds = entry.embeds;
    let stickerItems: any[] = stickersOf(msg);
    if (stickerItems.length === 0 && entry?.stickers?.length) stickerItems = entry.stickers;
    let rich = richAttachmentsOf(msg);
    if (rich.length === 0 && entry?.attachmentsRich?.length) rich = entry.attachmentsRich;
    const content =
      typeof msg.content === "string" && msg.content !== "" ? msg.content : entry?.content ?? "";

    const raw: any = {
      id: String(messageId),
      channel_id: String(channelId),
      guild_id: msg.guild_id ?? msg.guildId ?? entry?.guildId ?? null,
      type: typeof msg.type === "number" ? msg.type : 0,
      content,
      author: {
        id: String(a.id ?? entry?.author.id ?? "0"),
        username: a.username ?? a.global_name ?? a.globalName ?? entry?.author.name ?? "user",
        global_name: a.globalName ?? a.global_name ?? a.username ?? entry?.author.name ?? null,
        discriminator: String(a.discriminator ?? "0"),
        avatar: a.avatar ?? null,
        bot: Boolean(a.bot ?? entry?.author.bot),
        public_flags: a.publicFlags ?? a.public_flags ?? 0
      },
      timestamp: iso(msg.timestamp) ?? new Date().toISOString(),
      edited_timestamp: iso(msg.editedTimestamp ?? msg.edited_timestamp),
      tts: Boolean(msg.tts),
      mention_everyone: Boolean(msg.mentionEveryone ?? msg.mention_everyone),
      mentions: [],
      mention_roles: [],
      attachments: rich.map((x, i) => ({
        id: x.id ?? `${messageId}${i}`,
        filename: x.filename ?? "file",
        url: x.url ?? x.proxy_url,
        proxy_url: x.proxy_url ?? x.url,
        content_type: x.content_type,
        width: x.width,
        height: x.height,
        size: x.size ?? 0
      })),
      embeds,
      sticker_items: stickerItems,
      pinned: Boolean(msg.pinned),
      flags: typeof msg.flags === "number" ? msg.flags : 0,
      // Carried so the rebuilt record keeps the flag where our patch preserves it.
      deleted: true
    };

    dispatcher.dispatch({ type: "MESSAGE_UPDATE", message: raw });
  } catch (err) {
    log.debug("force row re-render failed (non-fatal)", err);
  }
}

/** Defer + dedupe a forced repaint so it lands after the current dispatch. */
function scheduleRerender(channelId: string, messageId: string): void {
  const key = `${channelId}:${messageId}`;
  if (rerendered.has(key)) return;
  rerendered.add(key);
  setTimeout(() => {
    forceRowRerender(channelId, messageId);
    setTimeout(() => rerendered.delete(key), 1500);
  }, 0);
}

function captureDelete(channelId: string, id: string): void {
  if (!channelId || !id) return;

  // A hook that fires after the stores ran finds the message already evicted
  // from Discord's cache — the shadow snapshot is the fallback that still
  // lets the record be written.
  const message = readMessage(channelId, id);
  const snap = shadow.get(`${channelId}:${id}`);
  if (!message && !snap) {
    log.debug(`delete of ${id} skipped: message not in cache or shadow`);
    return;
  }

  const author = message?.author ?? snap?.author ?? {};
  if (isIgnored(channelId, author)) return;

  const content =
    typeof message?.content === "string" && message.content !== ""
      ? message.content
      : snap?.content ?? "";
  const attachments = message ? attachmentsOf(message) : snap?.attachments ?? [];
  const liveRich = message ? richAttachmentsOf(message) : [];
  const attachmentsRich = liveRich.length ? liveRich : snap?.attachmentsRich ?? [];
  const liveEmbeds = message ? embedsOf(message) : [];
  const embeds = liveEmbeds.length ? liveEmbeds : snap?.embeds ?? [];
  const liveStickers = message ? stickersOf(message) : [];
  const stickers = liveStickers.length ? liveStickers : snap?.stickers ?? [];
  if (!content && attachments.length === 0 && attachmentsRich.length === 0 && embeds.length === 0 && stickers.length === 0) return;

  messageLog.recordDeleted({
    id: String(id),
    channelId: String(channelId),
    guildId: message?.guild_id ?? message?.guildId ?? snap?.guildId ?? undefined,
    author: toAuthor(author),
    content,
    attachments,
    attachmentsRich: attachmentsRich.length ? attachmentsRich : undefined,
    embeds: embeds.length ? embeds : undefined,
    stickers: stickers.length ? stickers : undefined,
    sentAt: message?.timestamp != null ? toMillis(message.timestamp) : snap?.sentAt ?? Date.now(),
    deletedAt: Date.now()
  });

  // Flag the live record so the in-chat patches (if they matched) can keep it.
  if (message && settings.store.keepDeletedInChat) {
    try {
      (message as { deleted?: boolean }).deleted = true;
    } catch {
      // Frozen record: nothing we can do, the recorder already has it.
    }
  }

  // Make the deletion show live, without a reload. Two complementary moves:
  //   1. tintRowInDom — paints the red hook straight onto the row's element for
  //      instant feedback, even before React does anything.
  //   2. scheduleRerender — re-dispatches the kept message as a MESSAGE_UPDATE
  //      so Discord rebuilds the row and the render patches repaint the FULL
  //      treatment (red + "此消息已删除" marker), matching a reload exactly.
  // The store keeps the record, so both operate on a row that's really there.
  if (settings.store.keepDeletedInChat) {
    tintRowInDom(String(channelId), String(id));
    scheduleRerender(String(channelId), String(id));
  }

  // One-time live diagnostic (visible in the in-app 日志 view, no console needed).
  // After the store has handled this delete, is the message still there? This
  // separates the three states cleanly: the source patch kept it (OK), the patch
  // is missing so the store dropped it (FAILED — only reappears on reload via the
  // revive path, exactly the "刷新才有、实时没有" symptom), or it was kept but not
  // flagged (PARTIAL — stays but won't tint). Runs on a macrotask so it observes
  // the post-store state regardless of which dispatcher seam called us.
  if (settings.store.keepDeletedInChat && !liveKeepChecked) {
    liveKeepChecked = true;
    const cid = String(channelId);
    const mid = String(id);
    setTimeout(() => {
      const still = readMessage(cid, mid);
      const domEl =
        typeof document !== "undefined"
          ? document.getElementById(`chat-messages-${cid}-${mid}`) || document.getElementById(`chat-messages-${mid}`)
          : null;
      const tinted = !!domEl && domEl.classList.contains("hc-deleted");
      if (still && (still as { deleted?: boolean }).deleted === true) {
        log.info(
          `live keep-deleted 自检 OK — 被删消息仍留在 store 且已标记 deleted；DOM 行${
            domEl ? (tinted ? "已直接染红（实时红条生效）" : "找到但未染红，请反馈") : "未找到（可能已滚出视图）"
          }`
        );
      } else if (still) {
        log.warn("live keep-deleted 自检 PARTIAL — 消息保留但未标记 deleted，改用 DOM 直接染红兜底");
      } else {
        log.error(
          "live keep-deleted 自检 FAILED — MessageStore 已丢弃被删消息，说明 “keep deleted message in store” 补丁未命中当前构建；" +
            "被删消息只会在重新加载频道后由 revive 重新出现（正是你说的“刷新才有、实时没有”）。"
        );
      }
    }, 0);
  }
}

function captureEdit(payload: any): void {
  if (!settings.store.logEdits || !payload) return;
  const channelId = payload.channel_id ?? payload.channelId;
  const id = payload.id;
  if (!channelId || !id) return;
  if (typeof payload.content !== "string") return; // embed-only updates aren't edits

  // The shadow map is the trustworthy "before" — Discord's cache may already
  // hold the new text (own edits apply optimistically; other client mods
  // rewrite records in place). The cache is only a fallback for messages we
  // never saw arrive, and then only its author metadata is always usable.
  const key = `${channelId}:${id}`;
  const existing = readMessage(channelId, id);
  const snap = shadow.get(key);
  const previous = snap?.content ?? (typeof existing?.content === "string" ? existing.content : undefined);

  // Whatever we record, the newest text becomes the next edit's "before".
  remember(channelId, id, payload);

  if (previous === undefined) {
    log.debug(`edit to ${id} skipped: no prior content known (message predates the recorder)`);
    return;
  }
  if (previous === payload.content) return;

  const author = existing?.author ?? snap?.author ?? payload.author ?? {};
  if (isIgnored(channelId, author)) return;

  const guildId = payload.guild_id ?? payload.guildId ?? existing?.guild_id ?? snap?.guildId;
  messageLog.recordEdit(
    String(id),
    String(channelId),
    toAuthor(author),
    previous,
    guildId != null ? String(guildId) : undefined
  );
}

// --- resurrecting deleted messages after a reload ---------------------------
//
// The record store persists to disk, so the log page survives a refresh. The
// in-chat red rows do not, on their own: after a reload Discord fetches history
// from the server, and the deleted message is gone there. So when a channel's
// history arrives (LOAD_MESSAGES_SUCCESS, seen pre-store by the interceptor
// seam), we splice our persisted records back into the payload as minimal raw
// messages; the store ingests them like any other message, and the post-store
// pass below flags them `deleted` so they render red again.

/** Rebuild a minimal raw API message from a persisted record. */
function entryToRaw(entry: DeletedEntry): any {
  const attachments = (entry.attachmentsRich ?? []).map((a, i) => ({
    id: a.id ?? `${entry.id}${i}`,
    filename: a.filename ?? "attachment",
    url: a.url ?? a.proxy_url,
    proxy_url: a.proxy_url ?? a.url,
    content_type: a.content_type,
    width: a.width,
    height: a.height,
    size: a.size ?? 0,
    spoiler: false
  }));

  return {
    id: entry.id,
    type: 0,
    channel_id: entry.channelId,
    guild_id: entry.guildId,
    sticker_items: entry.stickers?.length ? entry.stickers : undefined,
    content:
      entry.content ||
      (attachments.length === 0 && entry.attachments.length ? `📎 ${entry.attachments.join(", ")}` : ""),
    author: {
      id: entry.author.id,
      username: entry.author.name,
      global_name: entry.author.name,
      discriminator: "0000",
      bot: entry.author.bot,
      avatar: null
    },
    timestamp: new Date(entry.sentAt).toISOString(),
    attachments,
    embeds: entry.embeds ?? [],
    mentions: [],
    mention_roles: [],
    mention_everyone: false,
    pinned: false,
    tts: false,
    flags: 0
  };
}

/** Snowflake-safe id comparison (numeric, ids exceed Number precision). */
function compareIds(a: string, b: string): number {
  try {
    const x = BigInt(a);
    const y = BigInt(b);
    return x < y ? -1 : x > y ? 1 : 0;
  } catch {
    return a < b ? -1 : a > b ? 1 : 0;
  }
}

// Each LOAD_MESSAGES_SUCCESS is seen once per seam; inject only once.
const injectedActions = new WeakSet<object>();

function resurrectIntoLoad(action: any): void {
  if (!settings.store.keepDeletedInChat) return;
  if (injectedActions.has(action)) return;
  injectedActions.add(action);

  const channelId = String(action.channelId ?? action.channel_id ?? "");
  const msgs = action.messages;
  if (!channelId || !Array.isArray(msgs)) return;

  const mine = messageLog.getDeleted().filter((d) => d.channelId === channelId);
  if (!mine.length) return;

  const present = new Set(msgs.map((m: any) => String(m?.id)));
  // Only resurrect records at or above the batch's oldest id: anything older
  // belongs to history pages not yet loaded and would render out of place.
  let minId: string | undefined;
  for (const m of msgs) {
    const id = m?.id != null ? String(m.id) : undefined;
    if (id && (minId === undefined || compareIds(id, minId) < 0)) minId = id;
  }

  const revived = mine.filter(
    (d) =>
      !present.has(d.id) &&
      (minId === undefined || compareIds(d.id, minId) >= 0) &&
      // Respect the ignore rules at revive time too, so toggling "屏蔽机器人"
      // or "屏蔽自己" takes effect for already-recorded messages on reload.
      !isIgnored(channelId, d.author)
  );
  if (!revived.length) return;

  // Match the batch's existing order (the API sends newest first).
  const descending =
    msgs.length >= 2 ? compareIds(String(msgs[0].id), String(msgs[msgs.length - 1].id)) > 0 : true;
  msgs.push(...revived.map(entryToRaw));
  msgs.sort((a: any, b: any) => {
    const c = compareIds(String(a?.id ?? "0"), String(b?.id ?? "0"));
    return descending ? -c : c;
  });

  log.info(`revived ${revived.length} deleted message(s) into ${channelId}`);
}

/**
 * Post-store: flag revived (and freshly loaded) records as deleted so the row
 * patch tints them. Runs from the subscribe seam, i.e. after the store built
 * its Message records; a pre-store call finds nothing in the cache and no-ops.
 */
function reflagLoaded(action: any): void {
  if (!settings.store.keepDeletedInChat) return;
  const channelId = String(action.channelId ?? action.channel_id ?? "");
  if (!channelId) return;

  for (const d of messageLog.getDeleted()) {
    if (d.channelId !== channelId) continue;
    const msg = readMessage(channelId, d.id);
    if (msg && !msg.deleted) {
      try {
        msg.deleted = true;
      } catch {
        // frozen record; the row just won't tint
      }
    }
  }
}

/** Feed the shadow map from message traffic so edits always have a "before". */
function trackContent(action: any, type: string): void {
  try {
    if (type === "MESSAGE_CREATE") {
      const m = action.message;
      remember(m?.channel_id ?? m?.channelId ?? action.channelId, m?.id, m);
    } else if (type === "LOAD_MESSAGES_SUCCESS") {
      const channelId = action.channelId ?? action.channel_id;
      if (Array.isArray(action.messages)) {
        for (const m of action.messages) remember(m?.channel_id ?? channelId, m?.id, m);
      }
    }
  } catch {
    // Tracking is best-effort; a malformed action must not break dispatch.
  }
}

let firstCaptureLogged = false;
/** Total watched actions seen since start — the recorder's pulse. */
let actionsSeen = 0;
/** One-time live check: did the store keep a freshly deleted message in place? */
let liveKeepChecked = false;

function onAction(action: any): void {
  const type = action?.type;
  if (typeof type !== "string") return;

  if (WATCHED.includes(type)) actionsSeen++;

  trackContent(action, type);

  if (type === "LOAD_MESSAGES_SUCCESS") {
    try {
      // Pre-store (interceptor/dispatch seams see the action first): splice
      // persisted deleted messages back into the incoming history page.
      resurrectIntoLoad(action);
      // Post-store: flag them deleted so they tint. Deferred a tick so the
      // store has ingested the batch whichever seam this call came from.
      setTimeout(() => reflagLoaded(action), 0);
    } catch (err) {
      log.error("failed to revive deleted messages on channel load", err);
    }
  }

  try {
    if (type === "MESSAGE_DELETE") {
      captureDelete(action.channelId ?? action.channel_id, action.id ?? action.messageId);
    } else if (type === "MESSAGE_DELETE_BULK") {
      const channelId = action.channelId ?? action.channel_id;
      for (const id of action.ids ?? []) captureDelete(channelId, id);
    } else if (type === "MESSAGE_UPDATE") {
      captureEdit(action.message);
    } else {
      return;
    }
    // One-time proof the recorder sits on the dispatcher events actually flow
    // through — its absence after a delete/edit points at the wrong instance.
    if (!firstCaptureLogged) {
      firstCaptureLogged = true;
      log.info(`recorder saw its first ${type}`);
    }
  } catch (err) {
    log.error("recorder failed for", type, err);
  }
}

function onDispatch(ctx: PatchContext): void {
  onAction(ctx.args[0]);
}

/** The action types the recorder consumes. */
const WATCHED = ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK", "LOAD_MESSAGES_SUCCESS"];

/**
 * Attach the recorder to ONE dispatcher, on every seam it offers:
 *
 *   - the interceptor list (pre-store, best source for "before" state),
 *   - a wrap of dispatch itself (equivalent timing, different plumbing),
 *   - subscribe() per watched action (the only *public* API, and the seam
 *     other client mods demonstrably receive events through). It fires after
 *     the stores ran, which is why capture reads from the shadow snapshot and
 *     not just Discord's cache.
 *
 * Multiple seams firing for one event is harmless: deletes dedupe by id, and
 * a repeated captureEdit sees shadow == new content and no-ops. Missing every
 * seam is what's fatal — that is exactly the silent-recorder bug this replaces.
 */
function attachRecorder(dispatcher: any, tag: string): Unpatch {
  const undo: Unpatch[] = [];
  const seams: string[] = [];

  if (typeof dispatcher.addInterceptor === "function") {
    try {
      const interceptor = (action: any) => {
        onAction(action);
        return false;
      };
      dispatcher.addInterceptor(interceptor);
      undo.push(() => {
        const list = dispatcher._interceptors;
        if (Array.isArray(list)) {
          const at = list.indexOf(interceptor);
          if (at >= 0) list.splice(at, 1);
        }
      });
      seams.push("interceptor");
    } catch {
      // fine — other seams below
    }
  }

  for (const method of ["dispatch", "_dispatch"]) {
    if (typeof dispatcher[method] === "function") {
      try {
        undo.push(patcher.before(dispatcher, method, onDispatch));
        seams.push(method);
      } catch {
        // e.g. non-writable property; other seams still apply
      }
      break;
    }
  }

  if (typeof dispatcher.subscribe === "function") {
    try {
      const handler = (action: any) => onAction(action);
      for (const type of WATCHED) dispatcher.subscribe(type, handler);
      undo.push(() => {
        if (typeof dispatcher.unsubscribe === "function") {
          for (const type of WATCHED) {
            try {
              dispatcher.unsubscribe(type, handler);
            } catch {
              // unsubscribe of a never-fired type may throw on some builds
            }
          }
        }
      });
      seams.push("subscribe");
    } catch {
      // fine
    }
  }

  log.info(`recorder on dispatcher ${tag}: seams [${seams.join(", ") || "none"}]`);
  return () => undo.forEach((u) => u());
}

/**
 * Hook every dispatcher-shaped instance in the module graph, not just the
 * first: popouts/overlay own extra instances, and betting on one is exactly
 * how the recorder ends up attached where no gateway event ever flows.
 * Re-scans shortly after boot to catch instances created late.
 */
function attachRecorderEverywhere(): Unpatch {
  const hooked = new Set<any>();
  const undo: Unpatch[] = [];

  const sweep = (): number => {
    const candidates = [...findAll(isFluxDispatcher), getDispatcher()].filter(Boolean);
    let added = 0;
    for (const d of candidates) {
      if (hooked.has(d)) continue;
      hooked.add(d);
      undo.push(attachRecorder(d, `#${hooked.size}`));
      added++;
    }
    return added;
  };

  const first = sweep();
  log.info(`recorder attached to ${first} dispatcher instance(s)`);

  // Instances created after boot (or modules that load late) get picked up here.
  const timer = setInterval(() => {
    const added = sweep();
    if (added > 0) log.info(`recorder attached to ${added} late dispatcher instance(s)`);
  }, 5000);
  const stopTimer = setTimeout(() => clearInterval(timer), 60_000);

  return () => {
    clearInterval(timer);
    clearTimeout(stopTimer);
    undo.forEach((u) => u());
  };
}

// --- deleted-message marker -------------------------------------------------

// Thunks, not elements: this table sits at module top level, which is
// evaluated while the bundle IIFE runs — before Discord's React exists.
// Creating the elements eagerly here crashed every build at document-start
// ("React.createElement is not a function"), taking the whole runtime down.
const MARKER_ICON_PATHS: Record<string, () => React.ReactNode> = {
  trash: () => (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7" />
      <path d="M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7" />
    </>
  ),
  shield: () => (
    <>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z" />
      <path d="M9.5 12l1.8 1.8 3.2-3.6" />
    </>
  ),
  warning: () => (
    <>
      <path d="M12 4.5L3.5 19h17L12 4.5z" />
      <path d="M12 10v4" />
      <path d="M12 16.75h.01" />
    </>
  )
};

function formatDeletedAt(at: number | undefined, mode: string): string | undefined {
  if (at == null || mode === "none") return undefined;
  const d = new Date(at);
  if (mode === "datetime") {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${d.toLocaleTimeString("zh-CN", { hour12: false })}`;
  }
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}

/**
 * A marker line under a message — "此消息已删除" or "此消息已编辑" — with the icon,
 * look, and time format taken from settings. `edited` gives it a calmer amber
 * tone so an edit doesn't read as a deletion.
 */
function MessageMarker(props: { text: string; at?: number; edited?: boolean }): React.ReactElement {
  const s = settings.store;
  const icon = MARKER_ICON_PATHS[s.markerIcon]?.();
  const stamp = formatDeletedAt(props.at, s.markerTime);
  const cls =
    `hc-deleted-marker hc-deleted-marker--${s.markerLook || "plain"}` +
    (props.edited ? " hc-deleted-marker--edited" : "");
  return (
    <div className={cls}>
      {icon && (
        <svg
          className="hc-deleted-marker__icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {icon}
        </svg>
      )}
      <span>{props.text}{stamp ? `（${stamp}）` : ""}</span>
    </div>
  );
}

// The settings that decide what the in-chat extras look like. A mounted
// MessageExtras subscribes to these so flipping any of them in settings updates
// the message on screen at once — Discord won't re-render the row for us.
const MARKER_SETTING_KEYS = ["logEdits", "deleteStyle", "showDeletedMarker", "showEditedMarker", "markerIcon", "markerLook", "markerTime"] as const;

/** Re-render the calling component whenever any in-chat appearance setting changes. */
function useMlogSettings(): void {
  const [, bump] = useState(0);
  useEffect(() => {
    const unsubs = MARKER_SETTING_KEYS.map((key) => settings.subscribe(key, () => bump((n) => n + 1)));
    return () => unsubs.forEach((unsub) => unsub());
  }, []);
}

/**
 * The per-message extras rendered inside Discord's message: the persisted edit
 * history and the "此消息已删除" marker. It's a real component (not inline nodes)
 * so it can subscribe to settings and re-render live — that's what lets the
 * appearance options take effect without a reload. It stays mounted whenever a
 * message *could* show either extra (has history, or is deleted) even if the
 * matching toggle is currently off, so turning a toggle on updates it in place.
 */
function MessageExtras(props: {
  history?: Array<{ content: string; at: number }>;
  deletedAt?: number;
  editedAt?: number;
  isDeleted: boolean;
  isEdited: boolean;
}): React.ReactElement | null {
  useMlogSettings();
  const s = settings.store;
  const nodes: React.ReactNode[] = [];

  if (s.logEdits && props.history && props.history.length > 0) {
    nodes.push(
      <div className="hc-edit-history" key="hc-edit-history">
        {props.history.map((version, index) => {
          // Each old version carries the time it was superseded; show it inline
          // at the end of the line (always HH:MM:SS — datetime would be too long
          // per row), so "when was each edit" reads down the stack.
          const time = formatDeletedAt(version.at, "time");
          return (
            <div
              className={`hc-edit-history__version hc-edit-history__version--${s.deleteStyle || "tint"}`}
              key={index}
            >
              {renderContent(version.content)}
              {time ? <span className="hc-edit-history__time">{time}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  // Deleted takes precedence: a message that was edited *then* deleted shows
  // the deletion marker, not both.
  if (s.showEditedMarker && props.isEdited && !props.isDeleted) {
    nodes.push(<MessageMarker key="hc-edited-marker" text="此消息已编辑" at={props.editedAt} edited />);
  }

  if (s.showDeletedMarker && props.isDeleted) {
    nodes.push(<MessageMarker key="hc-deleted-marker" text="此消息已删除" at={props.deletedAt} />);
  }

  return nodes.length ? <>{nodes}</> : null;
}

// --- deleted-message style, applied live ----------------------------------

// The chosen deleted-message style is applied through a class on the document
// root, not baked into each row's className. Discord won't re-render message
// rows just because our setting changed, so a per-row variant would only show
// on messages painted after the change — which reads as "the setting does
// nothing". One root class, swapped live, restyles every kept message at once.
const DELETE_STYLE_CLASSES = ["tint", "text", "ghost", "strike"];
function syncDeleteStyleClass(): void {
  try {
    const root = document.documentElement;
    if (!root) return;
    for (const s of DELETE_STYLE_CLASSES) root.classList.remove(`hc-mlog-${s}`);
    root.classList.add(`hc-mlog-${settings.store.deleteStyle || "tint"}`);
  } catch {
    // no DOM to decorate (shouldn't happen inside the client)
  }
}

// --- boot-time diagnostic -------------------------------------------------

function reportPatches(): void {
  const mine = getSourcePatchReport().filter((p) => p.pluginId === "message-logger");
  if (!mine.length) return;
  // Per-patch breakdown, so the 日志 page shows exactly which in-chat patch
  // matched this Discord build without needing the console. This is the ground
  // truth when something renders on reload but not live: a MISS on "declare
  // deleted field on message record" is precisely that symptom.
  for (const p of mine) {
    if (p.applied) {
      log.info(`patch OK   · ${p.label} (${p.hits} hit${p.hits === 1 ? "" : "s"})`);
    } else {
      log.warn(`patch MISS · ${p.label} — 未匹配当前 Discord 构建`);
    }
  }
  const missed = mine.filter((p) => !p.applied);
  if (missed.length === 0) {
    log.info("in-chat patches applied — 全部命中");
  } else {
    log.warn(
      "部分 in-chat patch 未匹配当前 Discord 构建：" +
        missed.map((p) => `"${p.label}"`).join("、") +
        "。删除消息仍会记录在插件页，但可能无法在聊天内保留 / 变红。"
    );
  }

  // When the store patch misses, stop guessing at the handler's shape: dump the
  // real MESSAGE_DELETE handler source straight into the 日志 page. Comparing
  // this slice against the patch regex is the ground truth — it shows the exact
  // syntax this Discord build ships and whether "MessageStore" sits in the same
  // module as the handler (the co-location the find string depends on).
  const storeMissed = mine.some((p) => p.label === "keep deleted message in store" && !p.applied);
  const recordMissed = mine.some((p) => p.label === "declare deleted field on message record" && !p.applied);
  if (storeMissed || recordMissed) {
    try {
      // Reveal the handler shape regardless of how this build spells it —
      // property form `MESSAGE_DELETE:function(e){` or method shorthand
      // `MESSAGE_DELETE(e){`. Whichever the factory actually contains is dumped;
      // comparing that slice against the patch regex is the ground truth for
      // fixing a miss without another guessing round.
      const forms = ["MESSAGE_DELETE:function", "MESSAGE_DELETE(", "MESSAGE_DELETE_BULK"];
      const dumps = forms
        .map((needle) => {
          const out = dumpFactorySource(needle, 220);
          return out.startsWith("<no loaded factory") || out.startsWith("<webpack") ? "" : `【${needle}】${out}`;
        })
        .filter(Boolean);
      const combined = dumps.join("  ||  ").replace(/\s+/g, " ");
      const slice = combined.length > 3800 ? combined.slice(0, 3800) + " …(截断)" : combined;
      log.warn(
        "MESSAGE_DELETE 处理器真实源码切片（补丁未命中，用于修正，请整段发给开发者）：" +
          (slice || "未在已加载模块中找到 MESSAGE_DELETE 处理器；请先打开一个频道后再查看日志。")
      );
    } catch (err) {
      log.error("could not dump MESSAGE_DELETE handler shape", err);
    }
  }
}

export default definePlugin({
  id: "message-logger",
  name: "消息记录器",
  description: "保留被删除的消息与编辑历史，可按用户或频道忽略，支持导出。",
  authors: [{ name: "caitemm" }],
  category: "utility",

  settings,

  page: {
    title: "消息记录",
    icon: ClockIcon,
    component: LogPage
  },

  patches: [
    {
      // The message store drops records when it handles MESSAGE_DELETE /
      // MESSAGE_DELETE_BULK. Instead of letting it, we rebuild the channel
      // cache ourselves: kept messages are re-committed flagged `deleted:true`,
      // everything else is removed exactly as the original would. Without this
      // the row simply vanishes the instant a message is deleted and only
      // reappears (red) on reload via the revive path — precisely the
      // "刷新才有、实时没有" symptom.
      label: "keep deleted message in store",
      // Ported VERBATIM from Vencord's MessageLogger "MessageStore" patch.
      // The module is selected by the store's registered name — the quoted
      // string "MessageStore" the minifier keeps — and the handler is patched
      // by a ZERO-WIDTH insertion right after `MESSAGE_DELETE:function(e){`:
      // the original body stays byte-for-byte intact and merely becomes
      // unreachable after our early `return`. Vencord tracks the current
      // Discord build, so this is the shape that actually ships; the earlier
      // hand-rolled regexes guessed at method-shorthand / multi-dot shapes this
      // client no longer uses, which is exactly why they missed 4×. Vencord's
      // `\i` token is expanded here to its definition [A-Za-z_$][\w$]*.
      find: '"MessageStore"',
      replacement: [
        {
          // Single delete. $1 = raw action param, $2 = store ref (e.g. `d.A`).
          match: /(?<=MESSAGE_DELETE:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,
          replace: "let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!1);$2.commit(cache);return;"
        },
        {
          // Bulk delete.
          match: /(?<=MESSAGE_DELETE_BULK:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,
          replace: "let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!0);$2.commit(cache);return;"
        }
      ]
    },
    {
      // Base message row: append our class to the "li" so kept messages tint
      // red. The find string is a dev assertion that survives minification.
      // The prefix character before `("li",{` can be `)` (a `(0, X.createElement)`
      // style call preserved by some minifiers) OR a plain identifier
      // (`_jsx("li",` in a jsx-runtime build), so match either — the old
      // pattern only accepted `)` and no-op'd on jsx-runtime builds.
      label: "tint deleted message row (base)",
      find: "Message must not be a thread starter message",
      replacement: {
        match: /([)\w$\]])\("li",\{(.+?),className:/,
        replace: '$1("li",{$2,className:($self.deletedClass(arguments[0])||"")+" "+'
      }
    },
    {
      // The message row builds a className. When the record is flagged deleted,
      // append our modifier so it renders tinted. The argument list may carry
      // nested calls/strings, so parens are matched one level deep instead of
      // `[^)]*` (which used to cut mid-expression and produce code that failed
      // to compile).
      label: "tint deleted message row",
      find: "childrenRepliedMessage",
      replacement: {
        match: /(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,
        replace: '$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'
      }
    },
    {
      // Message content renderer: prepend the persisted edit history above the
      // current content, so old versions read top-to-bottom. Located via the
      // ".SEND_FAILED," module; the history comes from OUR persisted store, so
      // it survives client reloads.
      label: "inline edit history",
      find: ".SEND_FAILED,",
      replacement: {
        match: /\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,
        replace: "$&$self.renderEdits(arguments[0]),"
      }
    },
    {
      // Force a live re-render when a message is flagged deleted.
      //
      // This is the fix for "红条只有刷新后才出现". The store patch above keeps a
      // deleted message with `deleted: true` (confirmed live by the self-check
      // log), but Discord wraps each message row in React.memo with a custom
      // comparator that only re-renders when content / state / flags /
      // editedTimestamp change — it never looks at `deleted`. So flipping the
      // flag updates the store but the row is memoized stale and never repaints;
      // the red styling only shows on reload, when the list mounts fresh.
      //
      // We extend that comparator to also compare `deleted`, so the instant we
      // flag a message the row is considered changed and repaints red. The two
      // message variables are captured straight from the tail of the comparator
      // (`X.editedTimestamp?.toString()===Y.editedTimestamp?.toString()`) so we
      // never hardcode minified names. Same module as the edit-history patch
      // (".SEND_FAILED,").
      label: "re-render on deleted flag",
      find: ".SEND_FAILED,",
      replacement: {
        match: /((\w+)\.editedTimestamp\?\.toString\(\)===(\w+)\.editedTimestamp\?\.toString\(\))/,
        replace: "$1&&$2.deleted===$3.deleted"
      }
    },
    {
      // THE fix for "红条只有刷新后才出现". Discord's Message is an Immutable
      // Record with a FIXED field schema. `deleted` is not one of those fields,
      // so `m.set("deleted",true)` stores a value that is readable (the live
      // self-check sees deleted===true) but is invisible to the record's
      // structural equality — and Discord's message list decides whether to
      // repaint a row via that equality. Old record and new record compare
      // "equal" on the schema fields, so the row is never repainted live; only
      // a reload (fresh mount) shows the red styling.
      //
      // Declaring `deleted` (and editHistory / firstEditTimestamp) as real
      // fields on the record class means `.set("deleted",true)` now yields a
      // record that is genuinely not-equal to the original, so the list
      // repaints the instant we flag it. Ported verbatim from Vencord's
      // "Message domain model" patch, which is what makes deletes show live
      // there. Runs in the record constructor, located by `}addReaction(`.
      label: "declare deleted field on message record",
      find: /\}addReaction\(|addReaction\([\w$]+\)\{/,
      replacement: {
        match: /this\.customRenderedContent=(\w+)\.customRenderedContent,/,
        replace:
          "this.customRenderedContent=$1.customRenderedContent,this.deleted=$1.deleted||!1,this.editHistory=$1.editHistory||[],this.firstEditTimestamp=$1.firstEditTimestamp||this.editedTimestamp||this.timestamp,"
      }
    },
    {
      // Keep `deleted` / editHistory / firstEditTimestamp alive when Discord
      // rebuilds a message record on MESSAGE_UPDATE (edits, reactions, embed
      // unfurls). Without this, any post-delete update to the same message
      // re-derives the record from the server payload and silently drops our
      // flag, so a deleted message that then gets an embed/reaction update
      // would lose its red row. Ported from Vencord's "updated message
      // transformer" patch, located by ".PREMIUM_REFERRAL&&(".
      label: "carry deleted flag through message updates",
      find: /\.PREMIUM_REFERRAL\s*&&\s*\(/,
      replacement: {
        match: /(?<=null!=[\w$]+\.edited_timestamp\)return )[\w$]+\([\w$]+,\{reactions:([\w$]+)\.reactions[\s\S]{0,60}?\}\)/,
        replace: "Object.assign($&,{deleted:$1.deleted,editHistory:$1.editHistory,firstEditTimestamp:$1.firstEditTimestamp})"
      }
    }
  ],

  start() {
    messageLog.load();
    messageLog.setRetention(settings.store.retention);

    unsubscribeRetention = settings.subscribe("retention", (next) => messageLog.setRetention(next));

    // Deleted-message style lives as a class on <html>, synced here, so picking
    // a new style restyles kept messages at once (see syncDeleteStyleClass).
    syncDeleteStyleClass();
    unsubscribeDeleteStyle = settings.subscribe("deleteStyle", syncDeleteStyleClass);

    unpatchDispatch = attachRecorderEverywhere();

    // Keep the red tint on deleted rows no matter how Discord repaints them.
    // The render patch adds it on first render, but a later repaint (our forced
    // MESSAGE_UPDATE, a hover, an embed unfurl) recomputes the row className and
    // on some shapes (jumbo emoji, sticker-only) drops the hook — this re-adds it.
    startDomTinter();

    // Give module loading a moment, then report whether the in-chat patches took.
    setTimeout(reportPatches, 4000);

    // Self-diagnosis, no console skills required: message traffic (fetches,
    // incoming messages) flows constantly, so a recorder that has seen nothing
    // after 30s is provably deaf — say so in the log page, loudly.
    setTimeout(() => {
      if (actionsSeen > 0) {
        log.info(`recorder pulse OK — ${actionsSeen} message action(s) observed so far`);
      } else {
        log.error(
          "recorder pulse FAILED — no message actions observed in 30s. " +
            "The dispatcher hooks are not receiving events on this build. " +
            "请把日志页里 recorder on dispatcher 开头的几行发给开发者。"
        );
      }
    }, 30_000);
  },

  stop() {
    unpatchDispatch?.();
    unpatchDispatch = undefined;
    unsubscribeRetention?.();
    unsubscribeRetention = undefined;
    unsubscribeDeleteStyle?.();
    unsubscribeDeleteStyle = undefined;
    stopDomTinter();
    try {
      for (const s of DELETE_STYLE_CLASSES) document.documentElement?.classList.remove(`hc-mlog-${s}`);
    } catch {
      // no DOM; nothing to clean up
    }
    messageLog.flush();
    log.info("stopped");
  },

  // --- methods the source patches call through `$self` --------------------

  /**
   * Replacement body for the MessageStore's MESSAGE_DELETE(_BULK) handlers.
   * Receives the channel's immutable message cache; returns it with kept
   * messages flagged `deleted: true` (so the row patch tints them) and
   * everything else removed, exactly as the original handler would have.
   * Any surprise falls back to the original handler by returning the cache
   * unchanged only when nothing was touched — a throw here must never take
   * the store down, so the whole body is guarded.
   */
  handleDelete(cache: any, action: any, isBulk: boolean): any {
    try {
      if (cache == null) return cache;
      if (!isBulk && typeof cache.has === "function" && !cache.has(action.id)) return cache;

      const keepInChat = settings.store.keepDeletedInChat;
      const EPHEMERAL = 64;

      const mutate = (id: string) => {
        const msg = typeof cache.get === "function" ? cache.get(id) : undefined;
        if (!msg) return;

        const keep =
          keepInChat &&
          !action.mlDeleted &&
          (msg.flags & EPHEMERAL) !== EPHEMERAL &&
          !isIgnored(String(action.channelId ?? action.channel_id ?? msg.channel_id ?? ""), msg.author ?? {});

        if (!keep) {
          cache = cache.remove(id);
        } else {
          cache = cache.update(id, (m: any) => m.set("deleted", true));
        }
      };

      if (isBulk) {
        for (const id of action.ids ?? []) mutate(id);
      } else {
        mutate(action.id);
      }
    } catch (err) {
      log.error("handleDelete failed; messages removed normally", err);
    }
    return cache;
  },

  /**
   * Extra classNames for a message row whose message is deleted. Keyed off the
   * PERSISTED record (not just the in-memory `deleted` flag), so rows stay
   * marked across reloads; the flag remains a fast path for freshly deleted
   * ones. The style modifier comes from settings, so users pick the look.
   * Patched call sites differ in what they pass: the base row patch hands us
   * the component props (message under `.message`), the legacy patch the
   * message itself — accept either.
   */
  deletedClass(propsOrMessage: any): string {
    try {
      const m = propsOrMessage?.message ?? propsOrMessage;
      if (!m) return "";
      const channelId = m.channel_id ?? m.channelId;
      const isDeleted =
        m.deleted === true || (channelId && m.id && messageLog.isDeleted(String(channelId), String(m.id)));
      if (!isDeleted) return "";
      // Only the stable marker hook here; the active style variant is a class
      // on <html> (syncDeleteStyleClass), so switching styles restyles kept
      // rows live instead of waiting for Discord to repaint them.
      return "hc-deleted";
    } catch {
      return "";
    }
  },

  /**
   * Called from the content-renderer patch with the component's props. Renders
   * (a) the persisted edit history above the content and (b) a "deleted at"
   * marker line beneath it, both from the plugin's own store, so both survive
   * reloads. Runs inside Discord's message renderer and must never break it —
   * everything is guarded and returns null on any surprise.
   */
  renderEdits(props: any): React.ReactNode {
    try {
      const message = props?.message;
      const id = message?.id;
      const channelId = message?.channel_id ?? message?.channelId;
      if (!id || !channelId) return null;

      // Recording already filters ignored authors (captureEdit/captureDelete
      // call isIgnored), but the display path can still light up an "edited"
      // extra straight from Discord's native edited_timestamp — that bypass is
      // why 屏蔽自己 didn't hide your own edited messages. Consult isIgnored here
      // too so an ignored author (self / bots / muted ids) shows no extras.
      if (isIgnored(String(channelId), message?.author)) return null;

      const entry = messageLog.getEdited().find((e) => e.id === String(id) && e.channelId === String(channelId));
      const record = messageLog.findDeleted(String(channelId), String(id));
      const hasHistory = Boolean(entry && entry.history.length > 0);
      const isDeleted = Boolean(record) || message?.deleted === true;
      // Discord's own edited_timestamp marks any edited message, so the marker
      // shows even for edits made before the recorder was running; our own
      // record's updatedAt is the fallback time source.
      const editedTs = message?.edited_timestamp ?? message?.editedTimestamp;
      const isEdited = editedTs != null || hasHistory;
      const editedAt = editedTs != null ? toMillis(editedTs) : entry?.updatedAt;

      // Mount whenever any extra *could* appear — even if its toggle is off
      // right now — so flipping a toggle in settings takes effect on this
      // message live (MessageExtras re-renders itself).
      if (!hasHistory && !isDeleted && !isEdited) return null;

      return (
        <MessageExtras
          history={entry?.history}
          deletedAt={record?.deletedAt}
          editedAt={editedAt}
          isDeleted={isDeleted}
          isEdited={isEdited}
        />
      );
    } catch {
      return null;
    }
  }
});
