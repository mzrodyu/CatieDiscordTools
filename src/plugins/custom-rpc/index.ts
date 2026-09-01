// custom-rpc — 自定义「正在玩」.
//
// Writes a Rich Presence onto your own account, which is the point: unlike most
// of Halcyon, everyone who looks at your profile sees this. No Nitro involved —
// presence is free, Discord just never gave the UI for setting one by hand.
//
// The seam is Discord's own local-activity dispatch, the same one the RPC bridge
// uses when a game announces itself:
//
//   dispatch({ type: "LOCAL_ACTIVITY_UPDATE", socketId, activity })
//
// Found in the client's RPC command handler, so a "game" that never existed is
// indistinguishable from one that did. Clearing is the same dispatch with
// `activity: null`.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { getDispatcher } from "../../core/common/discord";
import { logger } from "../../core/logger";
import { ActivityType, buildActivity, isExternalImage, type RpcConfig } from "./activity";
import { cachedAsset, clearAssetCache, resolveAssets } from "./assets";

const log = logger("custom-rpc");

/** Our slot in Discord's local-activity map. Anything stable works. */
const SOCKET_ID = "halcyon-custom-rpc";

const settings = defineSettings({
  name: {
    group: "显示什么",
    type: "string",
    default: "",
    label: "名称（必填）",
    description: "资料卡上加粗的那一行。留空则整个presence不显示。至少两个字符。",
    placeholder: "例如 高三倒计时",
    maxLength: 128
  },
  type: {
    group: "显示什么",
    type: "select",
    default: String(ActivityType.PLAYING),
    label: "类型",
    description: "决定名称前面那个词：正在玩 / 正在听 / 正在观看 / 正在参加 / 直播中。",
    options: [
      { value: String(ActivityType.PLAYING), label: "正在玩" },
      { value: String(ActivityType.LISTENING), label: "正在听" },
      { value: String(ActivityType.WATCHING), label: "正在观看" },
      { value: String(ActivityType.COMPETING), label: "正在参加" },
      { value: String(ActivityType.STREAMING), label: "直播中（需要 twitch / youtube 链接）" }
    ]
  },
  details: {
    group: "显示什么",
    type: "string",
    default: "",
    label: "第二行",
    description: "名称下面那一行，通常写在做什么。",
    maxLength: 128
  },
  state: {
    group: "显示什么",
    type: "string",
    default: "",
    label: "第三行",
    description: "再下面一行，通常写状态。",
    maxLength: 128
  },
  timestampMode: {
    group: "显示什么",
    type: "select",
    default: "none",
    label: "计时器",
    description: "「已进行 12:34」那个跳动的计时。",
    options: [
      { value: "none", label: "不显示" },
      { value: "now", label: "从启用时开始计时" }
    ]
  },
  appId: {
    group: "图片",
    type: "string",
    default: "",
    label: "应用 ID",
    description:
      "只有配图片时才需要。去 Discord 开发者后台随便建一个应用，把它的 Application ID 填这里；图片地址要靠它换成 Discord 的资源 id。不填也能显示文字。",
    placeholder: "19 位数字",
    maxLength: 32
  },
  largeImage: {
    group: "图片",
    type: "string",
    default: "",
    label: "大图",
    description: "图片直链（https 开头，需要能公开访问），或者你在开发者后台上传的资源名。",
    maxLength: 512
  },
  largeText: {
    group: "图片",
    type: "string",
    default: "",
    label: "大图悬停文字",
    description: "鼠标放到大图上时显示。",
    maxLength: 128
  },
  smallImage: {
    group: "图片",
    type: "string",
    default: "",
    label: "小图",
    description: "挂在大图右下角的小圆图。必须先有大图，否则不显示。",
    maxLength: 512
  },
  smallText: {
    group: "图片",
    type: "string",
    default: "",
    label: "小图悬停文字",
    maxLength: 128
  },
  streamUrl: {
    group: "直播",
    type: "string",
    default: "",
    label: "直播链接",
    description: "只在类型选「直播中」时用，且只认 twitch.tv 和 youtube.com。",
    maxLength: 256
  },
  button1Text: {
    group: "按钮",
    type: "string",
    default: "",
    label: "按钮 1 文字",
    description: "资料卡下方的按钮。文字和链接必须一起填。",
    maxLength: 32
  },
  button1Url: { group: "按钮", type: "string", default: "", label: "按钮 1 链接", maxLength: 512 },
  button2Text: { group: "按钮", type: "string", default: "", label: "按钮 2 文字", maxLength: 32 },
  button2Url: { group: "按钮", type: "string", default: "", label: "按钮 2 链接", maxLength: 512 }
});

let startedAt = Date.now();
let unsubscribes: Array<() => void> = [];
let pushing = false;
let lastProblems = "";

function readConfig(): RpcConfig {
  const s = settings.store;
  return {
    appId: s.appId,
    type: Number(s.type) || 0,
    name: s.name,
    details: s.details,
    state: s.state,
    largeImage: s.largeImage,
    largeText: s.largeText,
    smallImage: s.smallImage,
    smallText: s.smallText,
    streamUrl: s.streamUrl,
    button1Text: s.button1Text,
    button1Url: s.button1Url,
    button2Text: s.button2Text,
    button2Url: s.button2Url,
    timestampMode: s.timestampMode,
    startedAt
  };
}

function dispatchActivity(activity: Record<string, unknown> | null): void {
  try {
    getDispatcher()?.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", socketId: SOCKET_ID, activity });
  } catch (err) {
    log.error("presence 下发失败", err);
  }
}

/**
 * Rebuild and publish. Image URLs need a round trip to trade for asset ids, so
 * the first push after an image change lands a moment later — the presence is
 * pushed once without the image and again with it, rather than waiting and
 * showing nothing in between.
 */
async function push(): Promise<void> {
  if (pushing) return;
  pushing = true;
  try {
    const config = readConfig();
    const resolve = (value: string): string | undefined => {
      const v = value.trim();
      if (!v) return undefined;
      if (!isExternalImage(v)) return v; // an asset name uploaded to the app
      const hit = cachedAsset(v);
      return typeof hit === "string" ? hit : undefined;
    };

    const built = buildActivity(config, resolve);
    dispatchActivity(built.activity);

    // Say WHY nothing showed up, once per distinct set of problems — a silently
    // dropped presence is the failure mode here, and it is always a rule in
    // activity.ts rather than a broken dispatch.
    const summary = built.problems.join(" / ");
    if (summary !== lastProblems) {
      lastProblems = summary;
      if (summary) log.warn(summary);
    }

    const urls = [config.largeImage, config.smallImage].map((v) => v.trim()).filter(isExternalImage);
    const missing = urls.filter((u) => cachedAsset(u) === undefined);
    if (missing.length && config.appId.trim()) {
      await resolveAssets(config.appId.trim(), missing);
      const again = buildActivity(readConfig(), resolve);
      dispatchActivity(again.activity);
    }
  } finally {
    pushing = false;
  }
}

export default definePlugin({
  id: "custom-rpc",
  name: "自定义「正在玩」",
  description:
    "在自己的资料卡上挂一条自定义的 Rich Presence：正在玩 / 正在听 / 正在观看什么都由你写，可以配大小图、计时器和两个按钮。不需要 Nitro，而且别人真的能看到。",
  authors: [{ name: "caitemm" }],
  category: "misc",

  settings,

  start() {
    startedAt = Date.now();
    // Every field re-publishes, so the profile follows what you type.
    unsubscribes = Object.keys(settings.schema).map((key) =>
      settings.subscribe(key as never, () => {
        void push();
      })
    );
    void push();
  },

  stop() {
    for (const off of unsubscribes) off();
    unsubscribes = [];
    lastProblems = "";
    clearAssetCache();
    // Clearing is the same dispatch with a null activity; without this the
    // presence would linger until the client restarts.
    dispatchActivity(null);
  }
});
