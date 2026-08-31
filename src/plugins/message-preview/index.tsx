// message-preview — see the message before you send it.
//
// Adds one button to the composer's icon row. Clicking it floats a panel above
// the input showing the draft rendered as a real message row (Discord's own
// markdown parser, so emoji / mentions / spoilers look exactly as they will),
// plus — when they differ — the literal text that will actually be transmitted.
//
// That second block is the point as much as the first: 假 Nitro rewrites locked
// emoji into CDN links, so for cross-server or animated emoji what you typed and
// what lands in the channel are two different strings. This is where you find
// that out before pressing Enter rather than after.

import { definePlugin } from "../../core/plugin";
import { settings } from "./settings";
import { startPreviewButton, stopPreviewButton } from "./button";

export default definePlugin({
  id: "message-preview",
  name: "发送前预览",
  description:
    "在输入框加一个按钮，点一下就能看到这条消息发出去之后长什么样：markdown、表情、@提及都按 Discord 自己的渲染显示；如果假 Nitro 会改写内容（表情变成图片链接），还会一并显示真正发出去的原文。",
  authors: [{ name: "caitemm" }],
  category: "chat",

  settings,

  start() {
    startPreviewButton();
  },

  stop() {
    stopPreviewButton();
  }
});
