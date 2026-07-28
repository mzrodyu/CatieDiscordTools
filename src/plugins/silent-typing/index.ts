// silent-typing — never tell the other side that you are typing.
//
// Discord fires a `TYPING_START` (a POST to `/channels/:id/typing`) on nearly
// every keystroke, which is how the "X 正在输入…" line appears for everyone else
// in the channel. That is a continuous presence leak: it tells a room you are
// drafting, when you started, and when you gave up on a message you never sent.
//
// TWO LAYERS, same idea as fake-nitro:
//
//   1. Source patch (the reliable one). A guard is spliced into the top of the
//      typing action's own `startTyping` body, so it doesn't matter whether a
//      caller captured the function reference at module init or whether the
//      module's exports are frozen. The insertion is a zero-width lookbehind
//      match — it can only ADD a statement, never restructure code — and if the
//      patched factory somehow failed to compile the runtime falls back to the
//      original module untouched.
//
//   2. Runtime hook (the fallback). The same guard, installed by wrapping
//      `startTyping` on the module. Covers builds where the patch's anchor has
//      moved, and is what makes toggling the plugin work without a restart.
//
// Inbound typing indicators — everyone else's — are untouched: this only stops
// what leaves the client.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { findByProps, getSourcePatchReport } from "../../core/modules/webpack";
import { ChannelStore, SelectedChannelStore } from "../../core/common/discord";
import { patcher, type Unpatch, type PatchContext } from "../../core/patcher";
import { logger } from "../../core/logger";

const log = logger("silent-typing");

const settings = defineSettings({
  scope: {
    group: "范围",
    type: "select",
    default: "all",
    label: "在哪里静默",
    description: "只在部分场景隐藏输入状态时，其余场景仍按 Discord 默认行为发送。",
    options: [
      { value: "all", label: "所有频道与私聊" },
      { value: "guilds", label: "只在服务器频道" },
      { value: "dms", label: "只在私聊 / 群聊" }
    ]
  },
  allowChannels: {
    group: "例外",
    type: "string-list",
    default: [],
    label: "例外频道 ID",
    description: "这些频道 / 私聊里照常发送输入状态。右键频道 → 复制频道 ID（需先开启开发者模式）。",
    itemPlaceholder: "频道 ID（纯数字）"
  },
  silenceStop: {
    group: "高级",
    type: "boolean",
    default: false,
    label: "同时拦截“停止输入”",
    description:
      "默认关闭。stopTyping 是用来清除已经发出去的输入状态的，拦截它反而可能让残留状态多挂几秒，只有在你确认从不发送时才需要开启。"
  }
});

/** Set by start()/stop(). The source patch calls into us even while the plugin
 *  is switched off (a patched factory can't be un-patched without a restart),
 *  so every entry point checks this first. */
let active = false;

let typingModule: any;
let unpatchStart: Unpatch | undefined;
let unpatchStop: Unpatch | undefined;
let suppressed = 0;

/** DM (1) and group DM (3) are the two private channel types. */
function isPrivateChannel(channelId: string): boolean {
  try {
    const channel = ChannelStore.getChannel?.(channelId);
    if (!channel) return false;
    if (typeof channel.isPrivate === "function") return Boolean(channel.isPrivate());
    if (channel.guild_id) return false;
    return channel.type === 1 || channel.type === 3;
  } catch {
    // Unknown channel: treat as non-private, the conservative read for
    // "guilds only" (we would rather stay silent than leak).
    return false;
  }
}

/** Whether the typing signal for `channelId` should be swallowed. */
function silenceFor(channelId: unknown): boolean {
  if (!active) return false;

  const id = channelId == null ? "" : String(channelId);
  const s = settings.store;

  if (id && s.allowChannels.includes(id)) return false;

  if (s.scope === "guilds") return !isPrivateChannel(id);
  if (s.scope === "dms") return isPrivateChannel(id);
  return true;
}

function onStartTyping(ctx: PatchContext): any {
  try {
    if (silenceFor(ctx.args[0])) {
      suppressed++;
      return undefined; // swallow: never reaches /channels/:id/typing
    }
  } catch (err) {
    // A fault in our own predicate must not break the compose box; fall through
    // to Discord's behaviour.
    log.error("判断是否静默时出错，本次按 Discord 默认行为处理", err);
  }
  return ctx.callOriginal();
}

function onStopTyping(ctx: PatchContext): any {
  try {
    if (settings.store.silenceStop && silenceFor(ctx.args[0])) return undefined;
  } catch {
    // fall through to Discord's behaviour
  }
  return ctx.callOriginal();
}

/**
 * Clear any typing state already sitting on the server for the channel the user
 * is looking at, so enabling the plugin mid-draft takes effect immediately
 * rather than after Discord's server-side expiry. Called with `active` still
 * false, so our own guards let it through.
 */
function clearCurrentTyping(): void {
  try {
    const channelId = SelectedChannelStore.getChannelId?.();
    if (channelId && typeof typingModule?.stopTyping === "function") {
      typingModule.stopTyping(channelId);
    }
  } catch {
    // Best effort: the state expires on its own within seconds.
  }
}

/** Report whether the source patch landed on this build. */
function reportPatch(): void {
  const mine = getSourcePatchReport().filter((p) => p.pluginId === "silent-typing");
  if (mine.length === 0) return;
  if (mine.every((p) => p.applied)) {
    log.info("源码 patch 已生效（输入状态在源头就被拦掉）");
  } else {
    log.warn(
      "源码 patch 未匹配当前 Discord 版本，已改用运行时 hook 兜底。若发现别人仍能看到你的输入状态，请反馈这条日志。"
    );
  }
}

export default definePlugin({
  id: "silent-typing",
  name: "静默输入",
  description:
    "不再向别人发送“正在输入…”状态。可以只在服务器或只在私聊生效，也能为指定频道开例外。别人的输入状态照常显示，关闭插件立即恢复。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "privacy",

  settings,

  patches: [
    {
      // The module that owns Discord's typing actions, identified by the local
      // action it dispatches. The replacement is a pure insertion at the top of
      // `startTyping`'s body: the whole match is a zero-width lookbehind, so no
      // existing character is consumed or moved and the code cannot become
      // unbalanced. The `:function` / `async` alternatives cover the shapes
      // Discord's minifier emits for the same method across builds.
      label: "startTyping guard",
      find: '"TYPING_START_LOCAL"',
      replacement: {
        match:
          /(?<=\bstartTyping\s*(?:[:=]\s*)?(?:async\s+)?(?:function\s*)?\(\s*(\w+)\s*\)\s*(?:=>\s*)?\{)/,
        replace: "if($self.shouldSilence($1))return;"
      }
    }
  ],

  start() {
    suppressed = 0;
    active = true;

    // Discord's typing action module: the single seam every keystroke-driven
    // typing call goes through. Matched by shape (both verbs) so it survives
    // renames; the nested-export scan finds it behind a minified key too.
    typingModule = findByProps("startTyping", "stopTyping");

    if (!typingModule || typeof typingModule.startTyping !== "function") {
      log.warn(
        "未找到 Discord 的输入状态模块（startTyping / stopTyping），运行时兜底不可用；仍依赖源码 patch。打开任意频道后重新启用插件可再试一次。"
      );
    } else {
      // Send one last stop for the channel in view before our guards go up.
      active = false;
      clearCurrentTyping();
      active = true;

      try {
        unpatchStart = patcher.instead(typingModule, "startTyping", onStartTyping);
      } catch (err) {
        log.warn("挂接 startTyping 失败，仅依赖源码 patch", err);
      }

      if (typeof typingModule.stopTyping === "function") {
        try {
          unpatchStop = patcher.instead(typingModule, "stopTyping", onStopTyping);
        } catch (err) {
          // Non-fatal: without this hook the "同时拦截停止输入" switch is inert,
          // but the important half is already in place.
          log.warn("挂接 stopTyping 失败，“同时拦截停止输入”开关将无效", err);
        }
      }
    }

    log.info(`已拦截输入状态上报（范围：${settings.store.scope}）`);
    // Modules load lazily; give the chunk containing the typing actions a
    // moment before reporting whether the patch found it.
    setTimeout(reportPatch, 4000);
  },

  stop() {
    active = false;
    unpatchStart?.();
    unpatchStop?.();
    unpatchStart = undefined;
    unpatchStop = undefined;
    typingModule = undefined;
    log.info(`已恢复输入状态上报（本次共拦截 ${suppressed} 次）`);
  },

  /**
   * Called from the source patch at the top of `startTyping`. Returns true to
   * abort the call. Guarded end to end: a throw here would break the compose
   * box, and the patch stays in the module until the client restarts, so this
   * must keep answering sanely even while the plugin is switched off.
   */
  shouldSilence(channelId: unknown): boolean {
    try {
      if (!active) return false;
      if (silenceFor(channelId)) {
        suppressed++;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /** Diagnostic snapshot. Surfaced through `HalcyonAPI.probe()`. */
  probe(): Record<string, unknown> {
    const module = typingModule ?? findByProps("startTyping", "stopTyping");
    return {
      active,
      suppressed,
      scope: settings.store.scope,
      typingModuleFound: module != null,
      startTypingIsFunction: typeof module?.startTyping === "function",
      /** True once our wrapper is installed on the module. */
      runtimeHookInstalled: unpatchStart != null,
      sourcePatches: getSourcePatchReport().filter((p) => p.pluginId === "silent-typing"),
      currentChannelWouldBeSilenced: (() => {
        try {
          return silenceFor(SelectedChannelStore.getChannelId?.());
        } catch {
          return null;
        }
      })()
    };
  }
});
