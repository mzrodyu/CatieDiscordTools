// Who reacted: resolving the reaction under the cursor, then who is in it.
//
// Discord does not keep reactor lists in a store you can read — the client
// fetches them on demand when you open the reaction details popout, and drops
// them again. So this asks the same endpoint the client itself uses:
//
//   GET /channels/:channel/messages/:message/reactions/:emoji?limit=n
//
// through Discord's own authenticated REST module (never a bare fetch, which
// would need the token and would miss the client's headers / rate-limit
// queueing). Results are cached briefly so sweeping the cursor back and forth
// over a row of reactions costs one request, not twenty.

import { RestAPI } from "../../core/common/discord";
import { getFiberPropsChain } from "../../core/common/react";
import { logger } from "../../core/logger";

const log = logger("who-reacted");

/** How long a fetched list stays fresh. Reactions change slowly. */
const CACHE_TTL_MS = 30_000;

export interface ReactionTarget {
  channelId: string;
  messageId: string;
  /** Discord's emoji record: `{ id, name, animated }`. */
  emoji: { id?: string | null; name?: string | null; animated?: boolean };
  /** Total reactors Discord claims, used for the "还有 N 人" tail. */
  count: number | null;
  /** 0 = normal, 1 = burst ("super") reaction. */
  type: number;
}

export interface Reactor {
  id: string;
  name: string;
  avatarUrl: string | null;
  bot: boolean;
}

/**
 * Recover the reaction a DOM node belongs to by reading the props React
 * rendered its ancestors with. Discord's reaction component receives
 * `{ emoji, message, count, type }`, which is everything we need — and reading
 * it costs nothing and breaks nothing, unlike patching the component.
 */
export function resolveReaction(node: Element): ReactionTarget | null {
  for (const props of getFiberPropsChain(node, 14)) {
    const emoji = props?.emoji;
    const message = props?.message;
    if (emoji == null || message == null) continue;

    const messageId = message.id;
    const channelId = message.channel_id ?? message.channelId;
    if (!messageId || !channelId) continue;
    // A reaction needs either a custom emoji id or a unicode name.
    if (!emoji.id && !emoji.name) continue;

    return {
      channelId: String(channelId),
      messageId: String(messageId),
      emoji,
      count: typeof props.count === "number" ? props.count : null,
      type: props.type === 1 ? 1 : 0
    };
  }
  return null;
}

/** The path segment Discord expects: `name:id` for custom, the char otherwise. */
function emojiParam(emoji: ReactionTarget["emoji"]): string {
  const name = emoji.name ?? "";
  return emoji.id ? `${name}:${emoji.id}` : name;
}

export function cacheKey(target: ReactionTarget): string {
  return `${target.channelId}/${target.messageId}/${emojiParam(target.emoji)}/${target.type}`;
}

/** A human label for the emoji, used as the card's title. */
export function emojiLabel(emoji: ReactionTarget["emoji"]): string {
  if (emoji.id) return `:${emoji.name ?? "emoji"}:`;
  return emoji.name ?? "";
}

function defaultAvatar(userId: string): string {
  // Modern Discord picks the default avatar from the account's snowflake.
  let index = 0;
  try {
    index = Number((BigInt(userId) >> 22n) % 6n);
  } catch {
    index = 0;
  }
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function avatarUrl(user: any): string | null {
  const id = user?.id ? String(user.id) : null;
  if (!id) return null;
  const hash = user?.avatar;
  if (typeof hash !== "string" || hash.length === 0) return defaultAvatar(id);
  const ext = hash.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=32`;
}

function toReactor(user: any): Reactor | null {
  const id = user?.id ? String(user.id) : null;
  if (!id) return null;
  const name =
    (typeof user.global_name === "string" && user.global_name) ||
    (typeof user.username === "string" && user.username) ||
    id;
  return { id, name, avatarUrl: avatarUrl(user), bot: user?.bot === true };
}

interface CacheEntry {
  at: number;
  reactors: Reactor[];
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Reactor[]>>();

/** Cached reactors, if we have a fresh copy. Lets the card paint instantly. */
export function cachedReactors(target: ReactionTarget): Reactor[] | null {
  const entry = cache.get(cacheKey(target));
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(cacheKey(target));
    return null;
  }
  return entry.reactors;
}

export function clearCache(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * Fetch (or reuse) the reactor list. Concurrent calls for the same reaction
 * share one request; failures reject so the card can show a reason instead of
 * an empty list that looks like "nobody".
 */
export function fetchReactors(target: ReactionTarget, limit: number): Promise<Reactor[]> {
  const key = cacheKey(target);

  const fresh = cachedReactors(target);
  if (fresh) return Promise.resolve(fresh);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const capped = Math.max(1, Math.min(100, Math.trunc(limit) || 20));
  const url =
    `/channels/${target.channelId}/messages/${target.messageId}` +
    `/reactions/${encodeURIComponent(emojiParam(target.emoji))}` +
    `?limit=${capped}` +
    (target.type === 1 ? "&type=1" : "");

  const request = (async (): Promise<Reactor[]> => {
    const api = RestAPI as any;
    if (typeof api?.get !== "function") {
      throw new Error("未找到 Discord 的 REST 模块");
    }

    const response = await api.get({ url, oldFormErrors: true });
    const body = response?.body;
    if (!Array.isArray(body)) throw new Error("返回内容不是用户列表");

    const reactors: Reactor[] = [];
    for (const user of body) {
      const reactor = toReactor(user);
      if (reactor) reactors.push(reactor);
    }
    cache.set(key, { at: Date.now(), reactors });
    return reactors;
  })();

  const guarded = request.catch((err) => {
    log.debug("拉取 reaction 名单失败", err);
    throw err;
  });
  inFlight.set(key, guarded);
  // Drop the in-flight entry either way. The `catch` keeps a rejection from
  // becoming an unhandled one here; the caller still sees it on `guarded`.
  void guarded.catch(() => undefined).then(() => inFlight.delete(key));

  return guarded;
}
