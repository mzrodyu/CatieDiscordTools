// Adding reactions, one message, many emoji.
//
// Two ways in, preferred first:
//   1. Discord's authenticated REST route, the same client that who-reacted
//      reads through (`PUT …/reactions/<name:id>/@me`). It's awaited, so we get
//      a real success/failure per emoji, and Discord's RestAPI queues and
//      retries on 429 by itself.
//   2. Discord's own reaction action (`addReaction(channelId, messageId, emoji)`)
//      as a fallback, for a build where the REST module didn't resolve. It's
//      fire-and-forget (updates the store, no awaitable result).
//
// Reactions are heavily rate-limited server-side, so they go out one at a time
// with a gap between them; firing all nine at once just earns a wall of 429s and
// most never land. The gap is a plain setting, not a hidden guard.

import { find } from "../../core/modules/webpack";
import { RestAPI } from "../../core/common/discord";
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

async function addOne(channelId: string, messageId: string, e: ReactionEmoji): Promise<void> {
  const api = RestAPI as any;
  if (api && typeof api.put === "function") {
    await api.put({
      url: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(reactionKey(e))}/@me`,
      oldFormErrors: true
    });
    return;
  }

  const actions = reactionActions();
  if (actions && typeof actions.addReaction === "function") {
    await Promise.resolve(
      actions.addReaction(channelId, messageId, {
        id: e.id || undefined,
        name: e.name,
        animated: e.animated
      })
    );
    return;
  }

  throw new Error("找不到添加反应的接口（RestAPI / reaction action 都没解析到）");
}

export interface AddResult {
  total: number;
  done: number;
  failed: number;
}

/** Whether the reaction backend resolved on this build (for diagnostics). */
export function reactionBackendReady(): boolean {
  if (typeof (RestAPI as any)?.put === "function") return true;
  const actions = reactionActions();
  return Boolean(actions && typeof actions.addReaction === "function");
}

/**
 * Add every emoji to the message in order, `delayMs` apart. A single failure is
 * logged and counted, never fatal — the rest still go out.
 */
export async function addReactions(
  channelId: string,
  messageId: string,
  emojis: ReactionEmoji[],
  delayMs: number
): Promise<AddResult> {
  const total = emojis.length;
  let done = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    try {
      await addOne(channelId, messageId, emojis[i]);
    } catch (err) {
      failed++;
      log.warn(`添加反应 :${emojis[i].name}: 失败`, err);
    }
    done++;
    if (delayMs > 0 && i < total - 1) await sleep(delayMs);
  }

  return { total, done, failed };
}
