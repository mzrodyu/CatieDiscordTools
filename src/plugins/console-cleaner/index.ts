// console-cleaner — silence Discord's noisiest console spam.
//
// Discord floods the devtools console with a handful of high-volume, useless
// messages that bury anything you actually want to read:
//
//   - the self-XSS scare ("Stop!" / "等一下！") re-logged every second,
//   - Rive's "Could not find a View Model linked to Artboard …" with a
//     thousand-line wasm stack behind it,
//   - i18n's "… does not have a value in the requested locale …" on every
//     store event a client mod subscribes to,
//   - Chromium's "resource was preloaded … but not used" (see note below).
//
// We wrap the console methods and drop any call whose text matches an enabled
// rule. Halcyon's own logs (prefixed "%cHalcyon") are always kept, and stop()
// restores the pristine console — nothing is lost, only hidden.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { patcher, type Unpatch, type PatchContext } from "../../core/patcher";
import { logger } from "../../core/logger";

const log = logger("console-cleaner");

const settings = defineSettings({
  hideSelfXss: {
    group: "内置规则",
    type: "boolean",
    default: true,
    label: "屏蔽自我 XSS 警告",
    description: "Discord 那条每秒重刷的红色“等一下！/ Stop!”粘贴警告。"
  },
  hideLocaleSpam: {
    group: "内置规则",
    type: "boolean",
    default: true,
    label: "屏蔽本地化缺失刷屏",
    description: "“… does not have a value in the requested locale …”，客户端 mod 订阅事件时会疯狂刷。"
  },
  hideRiveSpam: {
    group: "内置规则",
    type: "boolean",
    default: true,
    label: "屏蔽 Rive 动画报错",
    description: "“Could not find a View Model linked to Artboard …”，附带超长 wasm 堆栈。"
  },
  hidePreloadWarnings: {
    group: "内置规则",
    type: "boolean",
    default: true,
    label: "屏蔽资源预加载警告",
    description: "“resource was preloaded using link preload but not used …”。见下方说明：部分此类警告由浏览器直接产生，无法拦截。"
  },
  customPatterns: {
    group: "自定义",
    type: "string-list",
    default: [],
    label: "自定义屏蔽关键词",
    description: "任何一条 console 消息只要包含这里的某个子串，就会被丢弃（区分大小写）。",
    itemPlaceholder: "要屏蔽的文字片段"
  }
});

// Constant needle tables, grouped by the toggle that enables them. Kept at
// module top level (plain strings — no React, safe under the document-start
// trap). Matched as case-sensitive substrings against the message text.
const SELF_XSS_NEEDLES = [
  "等一下",
  "在这里粘贴",
  "如果有人告诉您",
  "请关闭此窗口",
  "Stop!",
  "self-XSS",
  "browser feature intended for developers",
  "This is a browser feature",
  "Nicht so schnell",
  "Attends",
  "Alto",
  "ちょっと待って",
  "잠깐"
];
const LOCALE_NEEDLES = ["does not have a value in the requested locale"];
const RIVE_NEEDLES = [
  "Could not find a View Model linked to Artboard",
  "BaseGlowRemapped"
];
const PRELOAD_NEEDLES = [
  "was preloaded using link preload",
  "preloaded intentionally"
];

// The console methods we intercept. Enough to catch every spam source above;
// leaves the rest of the console API untouched.
const METHODS = ["log", "info", "warn", "error", "debug"] as const;

/** Concatenate the string arguments of a console call into one searchable text. */
function textOf(args: unknown[]): string {
  let out = "";
  for (const a of args) {
    if (typeof a === "string") out += a + " ";
    else if (typeof a === "number" || typeof a === "boolean") out += String(a) + " ";
  }
  return out;
}

function anyNeedle(text: string, needles: string[]): boolean {
  for (const n of needles) if (n && text.includes(n)) return true;
  return false;
}

/** Whether a console call should be dropped. Halcyon's own logs are exempt. */
function shouldSuppress(args: unknown[]): boolean {
  // Never swallow Halcyon's own output — it's badge-prefixed with "%cHalcyon".
  if (typeof args[0] === "string" && args[0].startsWith("%cHalcyon")) return false;

  const text = textOf(args);
  if (text === "") return false;

  const s = settings.store;
  if (s.hideSelfXss && anyNeedle(text, SELF_XSS_NEEDLES)) return true;
  if (s.hideLocaleSpam && anyNeedle(text, LOCALE_NEEDLES)) return true;
  if (s.hideRiveSpam && anyNeedle(text, RIVE_NEEDLES)) return true;
  if (s.hidePreloadWarnings && anyNeedle(text, PRELOAD_NEEDLES)) return true;
  if (s.customPatterns.length && anyNeedle(text, s.customPatterns)) return true;

  return false;
}

let unpatchers: Unpatch[] = [];
let suppressedCount = 0;

function makeHook(): (ctx: PatchContext) => any {
  return (ctx: PatchContext) => {
    try {
      if (shouldSuppress(ctx.args)) {
        suppressedCount++;
        return undefined; // swallow: don't call the original
      }
    } catch {
      // A fault in our matcher must never eat a log line — fall through.
    }
    return ctx.callOriginal();
  };
}

export default definePlugin({
  id: "console-cleaner",
  name: "控制台净化",
  description:
    "屏蔽 Discord 在开发者控制台里刷屏的无用信息（自我 XSS 警告、Rive 动画报错、本地化缺失、资源预加载警告），支持自定义关键词。关闭插件即恢复原始 console。",
  authors: [{ name: "caitemm" }, { name: "catie" }],
  category: "utility",

  settings,

  start() {
    const con = globalThis.console as unknown as Record<string, unknown>;
    if (!con) {
      log.warn("未找到 console 对象，插件无事可做");
      return;
    }
    suppressedCount = 0;
    const hook = makeHook();
    for (const method of METHODS) {
      if (typeof con[method] === "function") {
        try {
          unpatchers.push(patcher.instead(con, method, hook));
        } catch (err) {
          log.error(`挂接 console.${method} 失败`, err);
        }
      }
    }
    log.info(
      `已净化 console（拦截 ${unpatchers.length} 个方法）。注意：浏览器自身产生的警告（如某些 preload 提示）无法通过 JS 拦截。`
    );
  },

  stop() {
    for (const undo of unpatchers) {
      try {
        undo();
      } catch {
        // best effort
      }
    }
    unpatchers = [];
    log.info(`已恢复原始 console（本次共屏蔽 ${suppressedCount} 条消息）`);
  }
});
