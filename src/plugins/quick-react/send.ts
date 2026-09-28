// Adding / removing reactions, and the one-click toggle behind both the menu
// item and the hover button.
//
// Backend, preferred first:
//   1. Discord's authenticated REST route (`PUT/DELETE …/reactions/<name:id>/@me`),
//      the same client who-reacted reads through. Awaited, so we get a real
//      per-emoji result, and Discord's RestAPI queues + retries on 429 itself.
//   2. Discord's reaction actions (`addReaction` / `removeReaction`) as a
//      fallback for a build where the REST module didn't resolve.
//
// Reactions are heavily rate-limited server-side, so they go out one at a time
// with a gap between them; a burst just earns 429s and most never land. The gap
// is a plain setting, not a hidden guard.
//
// TOGGLE: if every configured emoji is already reacted by you, a click removes
// them all; otherwise it adds the ones you're missing. That's the "点过再点一下
// 取消" behaviour.

import { find } from "../../core/modules/webpack";
import { RestAPI, MessageStore } from "../../core/common/discord";
import { logger } from "../../core/logger";
import { reactionKey, type ReactionEmoji } from "./emoji";

const log = logger("quick-react");

let cachedActions: any;

function reactionActions(): any {
  if (cachedActions && typeof cachedActions.addReaction === "function") return cachedActions;
  cachedActions = find(
    (m: any) =>
      typeof m?.addReaction === "function" &&
      typeof m?.removeReaction === "function" &&
      typeof m?.__halcyon_probe__ === "undefined"
  );
  return cachedActions;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function route(channelId: string, messageId: string, e: ReactionEmoji): string {
  return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(reactionKey(e))}/@me`;
}

function actionEmoji(e: ReactionEmoji): Record<string, unknown> {
  return { id: e.id || undefined, name: e.name, animated: e.animated };
}

async function addOne(channelId: string, messageId: string, e: ReactionEmoji): Promise<void> {
  const api = RestAPI as any;
  if (api && typeof api.put === "function") {
    await api.put({ url: route(channelId, messageId, e), oldFormErrors: true });
    return;
  }
  const actions = reactionActions();
  if (actions && typeof actions.addReaction === "function") {
    await Promise.resolve(actions.addReaction(channelId, messageId, actionEmoji(e)));
    return;
  }
  throw new Error("找不到添加反应的接口（RestAPI / reaction action 都没解析到）");
}

async function removeOne(channelId: string, messageId: string, e: ReactionEmoji): Promise<void> {
  const api = RestAPI as any;
  if (api && typeof api.del === "function") {
    await api.del({ url: route(channelId, messageId, e), oldFormErrors: true });
    return;
  }
  const actions = reactionActions();
  if (actions && typeof actions.removeReaction === "function") {
    await Promise.resolve(actions.removeReaction(channelId, messageId, actionEmoji(e)));
    return;
  }
  throw new Error("找不到移除反应的接口");
}

/** Whether a message reaction record refers to the same emoji as `e`. */
function reactionMatches(reaction: any, e: ReactionEmoji): boolean {
  const em = reaction?.emoji;
  if (!em) return false;
  if (e.id) return String(em.id ?? "") === e.id;
  return !em.id && String(em.name ?? "") === e.name;
}

/** Split the configured list by what you've already reacted with on this message. */
function inspect(
  channelId: string,
  messageId: string,
  emojis: ReactionEmoji[]
): { allMine: boolean; missing: ReactionEmoji[]; mine: ReactionEmoji[] } {
  let reactions: any[] = [];
  try {
    const msg = MessageStore.getMessage?.(channelId, messageId);
    reactions = Array.isArray(msg?.reactions) ? msg.reactions : [];
  } catch {
    reactions = [];
  }
  const missing: ReactionEmoji[] = [];
  const mine: ReactionEmoji[] = [];
  for (const e of emojis) {
    const r = reactions.find((x) => reactionMatches(x, e));
    if (r && (r.me || r.meBurst)) mine.push(e);
    else missing.push(e);
  }
  return { allMine: emojis.length > 0 && missing.length === 0, missing, mine };
}

export interface ToggleResult {
  action: "add" | "remove";
  total: number;
  done: number;
  failed: number;
}

/** Whether either backend resolved on this build (for diagnostics). */
export function reactionBackendReady(): boolean {
  const api = RestAPI as any;
  if (typeof api?.put === "function" || typeof api?.del === "function") return true;
  const actions = reactionActions();
  return Boolean(actions && typeof actions.addReaction === "function");
}

/**
 * The one-click action. Adds the missing emoji, or — when they're all already
 * yours — removes them. Each call is awaited `delayMs` apart; a single failure
 * is logged and counted, never fatal.
 */
export async function toggleReactions(
  channelId: string,
  messageId: string,
  emojis: ReactionEmoji[],
  delayMs: number
): Promise<ToggleResult> {
  const { allMine, missing } = inspect(channelId, messageId, emojis);
  const action: "add" | "remove" = allMine ? "remove" : "add";
  const targets = allMine ? emojis : missing;

  const total = targets.length;
  let done = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    try {
      if (action === "add") await addOne(channelId, messageId, targets[i]);
      else await removeOne(channelId, messageId, targets[i]);
    } catch (err) {
      failed++;
      log.warn(`${action === "add" ? "添加" : "移除"}反应 :${targets[i].name}: 失败`, err);
    }
    done++;
    if (delayMs > 0 && i < total - 1) await sleep(delayMs);
  }

  return { action, total, done, failed };
}
