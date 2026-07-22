// Handles to Discord's own modules that several parts of Halcyon need.
//
// Each handle is a lazy proxy: nothing is resolved until first access, which
// keeps startup cheap and tolerates modules that load late. Filters describe
// modules by shape, never by ID, so they survive client updates.

import { find, isFluxDispatcher, lazy } from "../modules/webpack";

/** Central Flux dispatcher. Everything state-related flows through it. */
export const Dispatcher = lazy<any>(isFluxDispatcher);

/**
 * Resolve the real dispatcher module (not the lazy proxy). Use this when you
 * need to patch the dispatcher: patching goes through property assignment,
 * which the lazy proxy cannot forward to the underlying module.
 *
 * Discord instantiates more than one Flux dispatcher (popouts, overlay), so a
 * blind shape-scan can land on an instance no gateway event ever flows
 * through. The one the client actually uses is the one its stores registered
 * on, so prefer the dispatcher reachable from a core store.
 */
export function getDispatcher(): any {
  // Prefer the dispatcher a *name-resolved* core store is registered on: that
  // is by definition the one Discord's own stores (ReadStateStore among them)
  // react on, so a BULK_ACK dispatched through it actually reaches the ack
  // handler. UserStore is shape-resolved and can land on the intl `t` proxy,
  // whose `_dispatcher` is a bogus message object — that mis-route is why an
  // earlier BULK_ACK "dispatched" 758 channels yet cleared nothing.
  for (const store of [GuildStore, ChannelStore, ReadStateStore]) {
    try {
      const viaStore = (store as any)?._dispatcher;
      if (isFluxDispatcher(viaStore)) return viaStore;
    } catch {
      // try the next store
    }
  }
  return find(isFluxDispatcher);
}

/** Read access to cached messages, keyed by channel. */
export const MessageStore = lazy<any>(
  (m) => typeof m?.getMessage === "function" && typeof m?.getMessages === "function"
);

/** Imperative message operations (send / edit / delete / receive). */
export const MessageActions = lazy<any>(
  (m) => typeof m?.editMessage === "function" && typeof m?.deleteMessage === "function"
);

/** Users the client knows about. */
export const UserStore = lazy<any>(
  (m) => typeof m?.getCurrentUser === "function" && typeof m?.getUser === "function"
);

/**
 * Channel metadata. Resolved by the store's registered name rather than a bare
 * shape probe: `getChannel`/`hasChannel` also appear on lighter lookalike
 * modules, and matching one of those returns empty channels (so the log showed
 * raw channel ids instead of names). The name is stable across releases.
 */
export const ChannelStore = lazy<any>(
  (m) => m?.getName?.() === "ChannelStore" || m?.constructor?.displayName === "ChannelStore"
);

/** The currently focused channel / guild. */
export const SelectedChannelStore = lazy<any>(
  (m) => typeof m?.getChannelId === "function" && typeof m?.getLastSelectedChannelId === "function"
);

/**
 * Guilds (servers) the current account has joined. Resolved by store name for
 * the same reason as ChannelStore — a `getGuild`/`getGuilds` shape-alike can
 * shadow the real store and hand back an empty guild map.
 */
export const GuildStore = lazy<any>(
  (m) => m?.getName?.() === "GuildStore" || m?.constructor?.displayName === "GuildStore"
);

/**
 * A guild's channels, grouped and queryable. Resolved by store name first
 * (exactly what Vencord's `findStoreLazy("GuildChannelStore")` does) so a
 * `getChannels`-shaped lookalike can't shadow the real store and hand back
 * empty buckets — the failure that left mark-all-read collecting nothing.
 * Falls back to the method shape only if the name probe misses.
 */
export const GuildChannelStore = lazy<any>(
  (m) =>
    // Name-only, exactly like Vencord's findStoreLazy. A shape probe
    // (getChannels/getDefaultChannel "look like" functions) also matches
    // Discord's intl `t` proxy — which answers every property — so getChannels()
    // returned {locale, ast, deleted} instead of real channels, and the scan
    // collected zero. The proxy's getName() is a message object, never the
    // string, so a name check rejects it.
    m?.getName?.() === "GuildChannelStore"
);

/**
 * Discord's own guild-subscription actions. This is the client's high-level
 * entry point for opcode-14 gateway subscriptions; we call it rather than
 * hand-assembling gateway frames, so a bad payload can never reach the socket.
 * Absent on some builds — callers must null-check and degrade to a no-op.
 */
export const GuildSubscriptions = lazy<any>(
  (m) => typeof m?.subscribeToGuild === "function" || typeof m?.subscribeToChannel === "function"
);

/** Relative / absolute timestamp formatting used across the client. */
export const moment = lazy<any>((m) => typeof m === "function" && typeof m?.locale === "function" && typeof m?.utc === "function");

/**
 * Client-side navigation (Discord's in-app SPA history). `transitionTo` pushes
 * an internal route without a full reload — how the client itself jumps to a
 * channel or a specific message. Matched by its full method set so a partial
 * lookalike (something exposing only `transitionTo`) can't shadow it.
 */
export const NavigationRouter = lazy<any>(
  (m) =>
    typeof m?.transitionTo === "function" &&
    typeof m?.replaceWith === "function" &&
    typeof m?.transitionToGuild === "function"
);

/**
 * Discord's app-layer stack. User settings, the emoji popout and similar
 * full-screen surfaces are all pushed as "layers" over the app. `popLayer`
 * dismisses the topmost one — how we close the native settings surface after a
 * jump so the target channel is actually visible instead of sitting behind it.
 * Matched by the pair so a partial lookalike can't shadow the real module.
 */
export const AppLayers = lazy<any>(
  (m) => typeof m?.popLayer === "function" && typeof m?.pushLayer === "function"
);

/**
 * Discord's HTTP client. Every REST call the web app makes (creating an emoji,
 * uploading a sticker, …) goes through this. Matched by `getAPIBaseURL` plus a
 * verb so a partial lookalike can't shadow it. The verbs accept a request
 * descriptor `{ url, body, ... }` and return a promise of `{ body, status }`.
 */
export const RestAPI = lazy<any>(
  (m) =>
    // EXACTLY Vencord's discriminator: an *object* carrying `del` AND `put`.
    // This is what reliably picks Discord's real authenticated API client.
    // Every earlier attempt failed on the wrong signal: requiring
    // `getAPIBaseURL` matched nothing (this build doesn't expose it where our
    // scan looks), and requiring get/post/put/del-as-functions matched a
    // generic no-op HTTP client that answered 200 with an empty body and
    // created nothing (the silent sticker-upload failure).
    typeof m === "object" &&
    typeof m?.del === "function" &&
    typeof m?.put === "function" &&
    // Reject Discord's intl `t` proxy, which answers EVERY property access with
    // a message value — so del/put "look like" functions and it wins the probe.
    // A real module returns undefined for a name it doesn't export; the
    // answer-everything proxy returns a (truthy) message, failing this guard.
    typeof m?.__halcyon_probe__ === "undefined"
);

/**
 * Permission checks against a channel or guild context. Resolved by store name
 * (a `can`-shaped lookalike exists) so we get the real one. `can(bit, ctx)`
 * answers whether the current user holds `bit` in `ctx`.
 */
export const PermissionStore = lazy<any>(
  (m) => m?.getName?.() === "PermissionStore" && typeof m?.can === "function"
);

/**
 * Emoji cache, keyed by guild. Used to read the guild-owned custom emojis when
 * building the clone list. Resolved by name.
 */
export const EmojiStore = lazy<any>((m) => m?.getName?.() === "EmojiStore");

/**
 * Discord's endpoint/constant table. Matched precisely on the sticker-create
 * endpoint we need (`Endpoints.GUILD_STICKER_PACKS`), so if it resolves we KNOW
 * that builder exists and the URL is exactly the one the client itself posts to
 * — hand-writing `/guilds/{id}/stickers` can miss a version prefix the client
 * applies. Absent → callers fall back to the literal path.
 */
export const Constants = lazy<any>(
  (m) => typeof m?.Endpoints?.GUILD_STICKER_PACKS === "function"
);

/**
 * Sticker cache. `getStickerById(id)` returns a sticker record (name / tags /
 * format_type) already known to the client — the cheap path emote-cloner uses
 * for a sticker's metadata before falling back to a REST fetch. Resolved by
 * name so a `getStickerById`-shaped lookalike can't shadow it.
 */
export const StickersStore = lazy<any>((m) => m?.getName?.() === "StickersStore");

/**
 * Per-channel read state: what's unread, the last message seen, mention counts.
 * `hasUnread(channelId)` and `lastMessageId(channelId)` are what mark-all-read
 * uses to build the ack list. Matched by its method pair (the same one Vencord
 * keys on) so a lighter lookalike can't shadow the real store.
 */
export const ReadStateStore = lazy<any>(
  (m) =>
    // Name-only (see GuildChannelStore): the method-shape fallback also matched
    // Discord's answer-everything intl proxy, so hasUnread() returned a truthy
    // message object for every channel. The store's registered name is stable.
    m?.getName?.() === "ReadStateStore"
);

/**
 * Threads the current account has actively joined, grouped by guild.
 * `getActiveJoinedThreadsForGuild(guildId)` returns a map of parent-channel id
 * -> { threadId: threadChannel }, which mark-all-read flattens so joined
 * threads get acked too (exactly what Vencord's ReadAllNotificationsButton
 * does). Resolved by its method name; absent on some builds — callers null-check.
 */
export const ActiveJoinedThreadsStore = lazy<any>(
  (m) => m?.getName?.() === "ActiveJoinedThreadsStore"
);

/**
 * Transient corner notifications ("已复制", "复制失败", …). `showToast` displays
 * one; `createToast(message, type)` builds it, with `Toasts.Type` naming the
 * variants. Absent on some builds — callers must null-check.
 */
export const Toasts = lazy<any>(
  (m) =>
    typeof m?.showToast === "function" &&
    typeof m?.createToast === "function" &&
    // Reject Discord's intl `t` proxy, which answers EVERY property as a
    // callable — so showToast/createToast "look like" functions and it wins the
    // probe (which is why toasts silently never appeared). A real module returns
    // undefined for a name it doesn't export; the answer-everything proxy does not.
    typeof m?.__halcyon_probe__ === "undefined"
);

/**
 * Show a transient toast. A thin, null-safe wrapper over Discord's own Toasts
 * so callers don't each re-implement the create+show dance or the degrade path.
 * `type` is one of "success" | "failure" | "info"; falls back to a log line
 * when the Toasts module isn't present on this build.
 */
export function showToast(message: string, type: "success" | "failure" | "info" = "info"): void {
  try {
    const T = Toasts as any;
    const typeEnum = T?.Type ?? {};
    const resolved =
      type === "success"
        ? typeEnum.SUCCESS ?? 1
        : type === "failure"
          ? typeEnum.FAILURE ?? 2
          : typeEnum.MESSAGE ?? typeEnum.INFO ?? 0;
    if (typeof T?.showToast === "function" && typeof T?.createToast === "function") {
      T.showToast(T.createToast(message, resolved));
    }
  } catch {
    // toast module not present or shape changed; a missing toast is non-fatal
  }
}

// Discord's context-menu building blocks are deliberately NOT resolved here.
// A shape-scan (or `find`) lands on one of several lookalike menu modules, and
// Discord validates a menu's children by *reference* (`child.type === MenuItem`)
// — a `MenuItem` from the wrong module (or one re-`bind`ed by a proxy) is a
// different function object and crashes the menu with "Menu API only allows
// Items …". The context-menu framework instead lifts the exact `MenuItem`
// reference off a live menu's own rendered items; see
// `getMenuItemComponent()` in core/common/context-menu.
