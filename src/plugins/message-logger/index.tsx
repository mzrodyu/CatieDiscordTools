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
import { getSourcePatchReport, findAll, isFluxDispatcher } from "../../core/modules/webpack";
import { getDispatcher, MessageStore, UserStore } from "../../core/common/discord";
import { logger } from "../../core/logger";
import { ClockIcon } from "../../icons";
import { settings } from "./settings";
import { messageLog, type Author, type DeletedEntry, type RichAttachment } from "./store";
import { LogPage } from "./ui/LogPage";

const log = logger("message-logger");

let unpatchDispatch: Unpatch | undefined;
let unsubscribeRetention: (() => void) | undefined;

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

function isIgnored(channelId: string, author: { id?: string; bot?: boolean } | undefined): boolean {
  const s = settings.store;
  if (channelId && s.ignoredChannels.includes(channelId)) return true;
  if (author?.id && s.ignoredUsers.includes(author.id)) return true;
  if (s.ignoreBots && author?.bot) return true;
  if (s.ignoreSelf && author?.id && author.id === currentUserId()) return true;
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

  messageLog.recordEdit(String(id), String(channelId), toAuthor(author), previous);
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
    (d) => !present.has(d.id) && (minId === undefined || compareIds(d.id, minId) >= 0)
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

const MARKER_ICON_PATHS: Record<string, React.ReactNode> = {
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7" />
      <path d="M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z" />
      <path d="M9.5 12l1.8 1.8 3.2-3.6" />
    </>
  ),
  warning: (
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

/** The "此消息已删除" line; icon, look, and time format come from settings. */
function DeletedMarker(props: { deletedAt?: number }): React.ReactElement {
  const s = settings.store;
  const icon = MARKER_ICON_PATHS[s.markerIcon];
  const stamp = formatDeletedAt(props.deletedAt, s.markerTime);
  return (
    <div className={`hc-deleted-marker hc-deleted-marker--${s.markerLook || "plain"}`}>
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
      <span>此消息已删除{stamp ? `（${stamp}）` : ""}</span>
    </div>
  );
}

// --- boot-time diagnostic -------------------------------------------------

function reportPatches(): void {
  const mine = getSourcePatchReport().filter((p) => p.pluginId === "message-logger");
  if (!mine.length) return;
  const missed = mine.filter((p) => !p.applied);
  if (missed.length === 0) {
    log.info("in-chat patches applied");
  } else {
    log.warn(
      "some in-chat patches did not match this Discord build; deleted messages are still captured on the plugin page, " +
        "but will not be kept inline. Unmatched: " +
        missed.map((p) => `"${p.label}"`).join(", ")
    );
  }
}

export default definePlugin({
  id: "message-logger",
  name: "消息记录器",
  description: "保留被删除的消息与编辑历史，可按用户或频道忽略，支持导出。",
  authors: [{ name: "halcyon" }],
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
      // MESSAGE_DELETE_BULK. Instead of letting it, rebuild the channel cache
      // ourselves — kept messages are re-committed with `deleted: true` (which
      // triggers the re-render the tint patches key off), everything else is
      // removed exactly as the original would. The module is located by its
      // registered store name (a quoted string that survives minification —
      // handler keys don't, which is why the previous find never matched).
      label: "keep deleted message in store",
      find: '"MessageStore"',
      replacement: [
        {
          match: /(?<=MESSAGE_DELETE:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,
          replace: "let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!1);$2.commit(hcC);return;"
        },
        {
          match: /(?<=MESSAGE_DELETE_BULK:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,
          replace: "let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!0);$2.commit(hcC);return;"
        }
      ]
    },
    {
      // Base message row: append our class to the "li" so kept messages tint
      // red. The find string is a dev assertion that survives minification.
      label: "tint deleted message row (base)",
      find: "Message must not be a thread starter message",
      replacement: {
        match: /\)\("li",\{(.+?),className:/,
        replace: ')("li",{$1,className:($self.deletedClass(arguments[0])||"")+" "+'
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
    }
  ],

  start() {
    messageLog.load();
    messageLog.setRetention(settings.store.retention);

    unsubscribeRetention = settings.subscribe("retention", (next) => messageLog.setRetention(next));

    unpatchDispatch = attachRecorderEverywhere();

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
      return `hc-deleted hc-deleted--${settings.store.deleteStyle || "tint"}`;
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

      const nodes: React.ReactNode[] = [];

      if (settings.store.logEdits) {
        const entry = messageLog.getEdited().find((e) => e.id === String(id) && e.channelId === String(channelId));
        if (entry && entry.history.length > 0) {
          nodes.push(
            <div className="hc-edit-history" key="hc-edit-history">
              {entry.history.map((version, index) => (
                <div className="hc-edit-history__version" key={index}>
                  {version.content}
                </div>
              ))}
            </div>
          );
        }
      }

      if (settings.store.showDeletedMarker) {
        const record = messageLog.findDeleted(String(channelId), String(id));
        const deletedNow = message?.deleted === true;
        if (record || deletedNow) {
          nodes.push(<DeletedMarker key="hc-deleted-marker" deletedAt={record?.deletedAt} />);
        }
      }

      return nodes.length ? <>{nodes}</> : null;
    } catch {
      return null;
    }
  }
});
