// quick-react — 一键给消息点上一整排预设好的反应.
//
// 右键任意消息 → "一键反应"，把你事先配好的一串自定义表情按顺序全点上去。灵感
// 来自截图里那排 BAKA：同一个名字、不同服务器传的是不同 id 的表情，Discord 按
// id 区分反应，所以同名的能一个个叠上去堆成一排。
//
// 表情从你加入的服务器里读（EmojiStore），先在设置里挑好、配好；这里只负责在
// 右键菜单里把它们一次性点上去。反应是服务器端的、所有人可见——不是本地效果。
//
// 反应接口走 Discord 自己的 reaction action（拿不到再退到 RestAPI），并且一个个
// 按间隔发：反应限流很严，一次性全发出去只会 429，大半点不上。

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { React, getFiberPropsChain } from "../../core/common/react";
import {
  addContextMenuPatch,
  getContextMenuTarget,
  getMenuItemComponent
} from "../../core/common/context-menu";
import { showToast } from "../../core/common/discord";
import { logger } from "../../core/logger";
import { addReactions, reactionBackendReady } from "./send";
import { ReactionConfigField } from "./ui/ConfigField";
import type { ReactionEmoji } from "./emoji";

const log = logger("quick-react");

const settings = defineSettings({
  reactions: {
    group: "反应",
    type: "custom",
    default: [] as ReactionEmoji[],
    label: "配置反应表情",
    description:
      "点「从服务器挑选」把要点的表情选好。同名不同 id 各算一个，可以叠很多个（Discord 单条消息最多 20 个不同表情）。",
    component: ReactionConfigField
  },
  delayMs: {
    group: "高级",
    type: "number",
    default: 300,
    min: 0,
    max: 3000,
    step: 50,
    label: "每个反应间隔（毫秒）",
    description: "一个个点，间隔太短会被 Discord 限流导致部分点不上。默认 300。"
  }
});

/** channel + message ids behind the right-clicked message row, via its fiber. */
function resolveMessage(node: Element | null): { channelId: string; messageId: string } | null {
  if (!node) return null;
  for (const props of getFiberPropsChain(node, 16)) {
    const m = props?.message;
    const channelId = m?.channel_id ?? m?.channelId;
    if (m?.id && channelId) {
      return { channelId: String(channelId), messageId: String(m.id) };
    }
  }
  return null;
}

let applying = false;

async function applyReactions(channelId: string, messageId: string): Promise<void> {
  if (applying) return; // one burst at a time — don't double-fire on a fast double click
  const list = (settings.store.reactions as ReactionEmoji[]) ?? [];
  if (list.length === 0) return;

  applying = true;
  showToast(`正在添加 ${list.length} 个反应…`, "info");
  try {
    const r = await addReactions(channelId, messageId, list, settings.store.delayMs);
    if (r.failed > 0) {
      showToast(`已添加 ${r.done - r.failed}/${r.total}，${r.failed} 个失败`, "failure");
    } else {
      showToast(`已添加 ${r.done} 个反应`, "success");
    }
  } catch (err) {
    log.error("一键反应失败", err);
    showToast("一键反应失败，看控制台日志", "failure");
  } finally {
    applying = false;
  }
}

function menuPatch(children: any[]): void {
  const target = resolveMessage(getContextMenuTarget());
  if (!target) return;

  const MenuItem = getMenuItemComponent();
  if (!MenuItem) return; // reference not learned yet; skip rather than crash the menu

  const count = ((settings.store.reactions as ReactionEmoji[]) ?? []).length;
  children.push(
    React.createElement(MenuItem, {
      id: "halcyon-quick-react",
      label: count > 0 ? `一键反应（${count} 个）` : "一键反应：先在设置里配置",
      disabled: count === 0,
      action: () => void applyReactions(target.channelId, target.messageId)
    })
  );
}

let unpatchers: Array<() => void> = [];

export default definePlugin({
  id: "quick-react",
  name: "一键反应",
  description:
    "右键消息一键点上一整排预设反应。表情从你加入的服务器里挑，先在设置里配好。同名不同 id 会各算一个，能像截图那样叠成一排。反应对所有人可见。",
  authors: [{ name: "caitemm" }],
  category: "utility",

  settings,

  start() {
    unpatchers.push(addContextMenuPatch("message", menuPatch));
    if (!reactionBackendReady()) {
      log.warn("没解析到添加反应的接口，点击时会走兜底或报错。重启客户端后再试。");
    }
    log.info("一键反应就绪 — 右键消息即可");
  },

  stop() {
    for (const un of unpatchers) {
      try {
        un();
      } catch {
        // best-effort teardown
      }
    }
    unpatchers = [];
  },

  /** 诊断快照。通过 HalcyonAPI.probe() 输出。 */
  probe(): Record<string, unknown> {
    return {
      configuredCount: ((settings.store.reactions as ReactionEmoji[]) ?? []).length,
      delayMs: settings.store.delayMs,
      backendReady: reactionBackendReady()
    };
  }
});
