// Turning draft text into what the message will look like.
//
// First choice is Discord's own markdown parser — the same one that renders
// every real message, so bold / code / spoilers / mentions / custom emoji come
// out identical to the sent article by construction rather than by imitation.
//
// THE INTL-PROXY TRAP
// -------------------
// Finding it with `findByProps("parse","parseTopic")` is what produced
//
//   Uncaught Error: Minified React error #31
//   … object with keys {locale, ast}
//
// Discord ships an intl object that answers EVERY property access with a
// message record, so it satisfies any name-based probe and wins the scan. Its
// "parse" returned `{locale, ast}`, which React then refused to render as a
// child. This is the same proxy the store lookups in core/common/discord all
// guard against with `__halcyon_probe__`, so guard the same way — and then, belt
// and braces, check the VALUE too: only a string, an array or a real React
// element (`$$typeof`) is allowed through. Anything else means we found the
// wrong module, and rendering it would crash the panel rather than degrade it.
//
// The fallback is message-logger's `renderContent`, which still resolves
// `<a?:name:id>` to a CDN image but loses markdown and leaves mentions as raw
// text — announced once at debug level instead of passed off as equivalent.

import { React } from "../../core/common/react";
import { find } from "../../core/modules/webpack";
import { renderContent } from "../message-logger/render-content";
import { logger } from "../../core/logger";

const log = logger("message-preview");

let parserChecked = false;
let parser: any;
/** Set once the parser proves unusable, so we stop asking it every keystroke. */
let parserRejected = false;
let announced = false;

/**
 * Whether `m` is Discord's real markdown module. Exported so the guard can be
 * tested against both the genuine exports and the intl proxy, which is the whole
 * reason this predicate is not just a list of property names.
 */
export function isMarkdownParser(m: any): boolean {
  return (
    typeof m?.parse === "function" &&
    typeof m?.parseTopic === "function" &&
    // Present on the real markdown module and not something a generic lookalike
    // carries.
    typeof m?.reactParserFor === "function" &&
    typeof m?.astParserFor === "function" &&
    // Reject Discord's answer-everything intl proxy. Without this it wins the
    // probe and its "parse" hands back {locale, ast}. Load-bearing.
    typeof m?.__halcyon_probe__ === "undefined"
  );
}

function getParser(): any {
  if (!parserChecked) {
    parserChecked = true;
    try {
      parser = find(isMarkdownParser);
    } catch {
      parser = undefined;
    }
  }
  return parser;
}

/** Whether `value` is something React can actually render as a child. */
export function isRenderable(value: unknown): boolean {
  if (value == null || typeof value === "string" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.every(isRenderable);
  if (typeof value === "object") return typeof (value as any).$$typeof === "symbol";
  return false;
}

function announce(message: string, err?: unknown): void {
  if (announced) return;
  announced = true;
  if (err) log.debug(message, err);
  else log.debug(message);
}

/** Render `content` the way Discord would render it in a sent message. */
export function renderMessageContent(content: string, channelId: string | undefined): React.ReactNode {
  if (!parserRejected) {
    const p = getParser();
    if (typeof p?.parse === "function") {
      try {
        // (content, inline, state) — `inline: true` is the shape used for a
        // message body; channelId lets mentions resolve against this channel.
        const parsed = p.parse(content, true, { channelId, allowLinks: true, allowEmojiLinks: true });
        if (isRenderable(parsed)) return parsed;
        parserRejected = true;
        announce("Discord 解析器返回了不能渲染的东西（很可能撞上了 intl 代理），降级为内置渲染");
      } catch (err) {
        parserRejected = true;
        announce("Discord 解析器抛错，降级为内置渲染", err);
      }
    } else {
      parserRejected = true;
      announce("未找到 Discord 的 markdown 解析器，降级为内置渲染（表情可见，markdown / @提及 不解析）");
    }
  }
  return renderContent(content);
}
