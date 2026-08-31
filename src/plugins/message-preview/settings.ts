// Settings for the send-preview plugin.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  showRawOutgoing: {
    group: "预览",
    type: "boolean",
    default: true,
    label: "显示实际发出的原文",
    description:
      "假 Nitro 会把锁定的表情改写成图片链接，所以你打的和真正上线的经常不是一回事。开启后，只要两者不同就额外显示一块真正会发出去的文本。"
  },
  liveUpdate: {
    group: "预览",
    type: "boolean",
    default: true,
    label: "跟着打字实时更新",
    description: "面板开着时随输入刷新预览。关掉则只在点开的那一刻取一次快照。"
  }
});
