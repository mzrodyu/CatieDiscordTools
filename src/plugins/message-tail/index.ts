// message-tail — append a bot-style tail to your own messages.
//
// The thing being imitated is the footer a bot prints under its reply:
//
//   -# Time: 20.0s | Model: agycli-gemini-3.7-flash-high-search | Input: 96390t | Output: 576t
//
// Everything about it is yours to set: the whole line is a template, the model
// list is yours (several means one is picked per message), and the numbers are
// derived from what you actually typed rather than invented — `{time}` is real
// seconds spent composing, `{out}` is a token estimate of your own text.
//
// Hooked on MessageActions.sendMessage, the same seam fake-nitro's runtime
// fallback uses. Deliberately NOT on the edit path: editing a message that
// already carries a tail would stack a second one.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { findByProps } from "../../core/modules/webpack";
import { patcher, type Unpatch, type PatchContext } from "../../core/patcher";
import { logger } from "../../core/logger";
import { appendTail, estimateTokens, jitter, pickModel, renderTail } from "./template";
import { elapsedSeconds, startTypingClock, stopTypingClock } from "./typing";

const log = logger("message-tail");

const settings = defineSettings({
  template: {
    group: "尾巴",
    type: "string",
    default: "-# Time: {time}s | Model: {model} | Input: {in}t | Output: {out}t",
    label: "尾巴模板",
    description:
      "可用占位符：{model} 模型名、{time} 本条消息实际编辑秒数、{in} 输入 token、{out} 输出 token、{total} 两者之和、{chars} 字符数、{clock} 时间、{date} 日期。开头的 -# 会让这行变成小字（Discord 的 subtext），删掉就是正常大小。写错的占位符会原样保留，不会被吃掉。",
    placeholder: "-# Model: {model}",
    maxLength: 400
  },
  ownLine: {
    group: "尾巴",
    type: "boolean",
    default: true,
    label: "尾巴单独一行",
    description: "关掉会直接接在正文后面。注意 -# 小字只有在行首才生效，所以用 -# 时这项要开着。"
  },
  models: {
    group: "模型",
    type: "string-list",
    default: ["agycli-gemini-3.7-flash-high-search"],
    label: "模型名",
    description: "{model} 的取值。填多个的话，每条消息随机用其中一个。",
    itemPlaceholder: "模型名，例如 gpt-5-turbo"
  },
  contextTokens: {
    group: "数字",
    type: "number",
    default: 96000,
    min: 0,
    max: 10_000_000,
    step: 1000,
    label: "上下文 token 基数",
    description: "{in} = 这个基数 + 你这条消息的 token 估算，用来让输入量看起来像真的带着上下文。填 0 就只算你自己这条。"
  },
  jitterPercent: {
    group: "数字",
    type: "number",
    default: 8,
    min: 0,
    max: 50,
    step: 1,
    label: "数字抖动幅度（%）",
    description: "给 token 数加一点随机浮动，免得连着几条的数字一模一样、一眼假。填 0 就是精确值。"
  },
  minSeconds: {
    group: "数字",
    type: "number",
    default: 0.6,
    min: 0,
    max: 60,
    step: 0.1,
    label: "最短耗时（秒）",
    description: "{time} 的下限。粘贴完直接发会导致耗时接近 0，这个值兜住它。"
  },
  skipPrefix: {
    group: "生效范围",
    type: "string",
    default: "",
    label: "跳过前缀",
    description: "消息以这个前缀开头时不加尾巴，前缀本身也会被去掉。留空表示每条都加。",
    placeholder: "例如 //"
  }
});

let unpatchSend: Unpatch | undefined;

/** The message argument to sendMessage, which is where the content lives. */
function findMessageArg(args: any[]): any {
  const m = args[1];
  if (m && typeof m === "object" && typeof m.content === "string") return m;
  return args.find((a) => a && typeof a === "object" && typeof a.content === "string");
}

function onSendMessage(ctx: PatchContext): void {
  try {
    const args = ctx.args;
    const channelId: string = args[0];
    const message = findMessageArg(args);
    if (!message || typeof message.content !== "string") return;
    // Two hooks on one send (or a retry) must not stack two tails.
    if (message.__halcyonTailed) return;

    let content = message.content;
    if (content.trim().length === 0) return; // attachment-only message

    const skip = settings.store.skipPrefix;
    if (skip && content.startsWith(skip)) {
      message.content = content.slice(skip.length);
      message.__halcyonTailed = true;
      return;
    }

    const template = settings.store.template;
    if (!template.trim()) return;

    const chars = content.length;
    const out = estimateTokens(content);
    const wobble = settings.store.jitterPercent;
    const tail = renderTail(template, {
      model: pickModel(settings.store.models),
      seconds: elapsedSeconds(String(channelId), settings.store.minSeconds),
      inputTokens: jitter(Math.max(0, settings.store.contextTokens) + out, wobble),
      outputTokens: jitter(out, wobble),
      chars,
      now: new Date()
    });

    content = appendTail(content, tail, settings.store.ownLine);
    message.content = content;
    message.__halcyonTailed = true;
  } catch (err) {
    log.error("加尾巴失败，消息按原样发送", err);
  }
}

export default definePlugin({
  id: "message-tail",
  name: "消息尾巴",
  description:
    "在自己发出的消息后面自动追加一行 bot 风格的尾巴（Time / Model / Input / Output 那种）。整行都是模板，模型名自己填，耗时和 token 数按你实际打的内容算，不是写死的。",
  authors: [{ name: "caitemm" }],
  category: "chat",

  settings,

  start() {
    startTypingClock();
    const messageActions = findByProps("sendMessage", "editMessage", "deleteMessage");
    if (!messageActions || typeof messageActions.sendMessage !== "function") {
      log.warn("未找到 MessageActions，尾巴无法追加。重启客户端后再试。");
      return;
    }
    try {
      unpatchSend = patcher.before(messageActions, "sendMessage", onSendMessage);
    } catch (err) {
      log.error("挂接 sendMessage 失败", err);
    }
  },

  stop() {
    unpatchSend?.();
    unpatchSend = undefined;
    stopTypingClock();
  }
});
