// Turning draft text into what the message will look like.
//
// First choice is Discord's own markdown parser — the same one that renders
// every real message, so bold / code / spoilers / mentions / custom emoji come
// out identical to the sent article by construction rather than by imitation.
// It is found by shape (`parse` + `parseTopic`), never by module id.
//
// If that lookup misses on some future build, fall back to message-logger's
// `renderContent`, which already swaps `<a?:name:id>` for the CDN image. That
// loses markdown and leaves mentions as raw text, so it is announced once at
// debug level instead of pretending to be the same thing.

import { React } from "../../core/common/react";
import { findByProps } from "../../core/modules/webpack";
import { renderContent } from "../message-logger/render-content";
import { logger } from "../../core/logger";

const log = logger("message-preview");

let parserChecked = false;
let parser: any;
let fellBack = false;

function getParser(): any {
  if (!parserChecked) {
    parserChecked = true;
    try {
      parser = findByProps("parse", "parseTopic");
    } catch {
      parser = undefined;
    }
  }
  return parser;
}

/** Render `content` the way Discord would render it in a sent message. */
export function renderMessageContent(content: string, channelId: string | undefined): React.ReactNode {
  const p = getParser();
  if (typeof p?.parse === "function") {
    try {
      // (content, inline, state) — `inline: true` is the shape used for a
      // message body, and channelId lets mentions resolve against this channel.
      return p.parse(content, true, { channelId, allowLinks: true, allowEmojiLinks: true });
    } catch (err) {
      if (!fellBack) {
        fellBack = true;
        log.debug("Discord 解析器抛错，降级为内置渲染", err);
      }
    }
  } else if (!fellBack) {
    fellBack = true;
    log.debug("未找到 Discord 的 markdown 解析器，降级为内置渲染（表情可见，markdown / @提及 不解析）");
  }
  return renderContent(content);
}
