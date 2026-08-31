// message-preview — see the message before you send it.
//
// One button in the composer's icon row. Clicking it floats a panel above the
// input showing the draft rendered as a real message row (Discord's own markdown
// parser, so emoji / mentions / spoilers look exactly as they will), plus — when
// they differ — the literal text that will actually be transmitted.
//
// That second block is the point as much as the first: 假 Nitro rewrites locked
// emoji into CDN links, so for cross-server or animated emoji what you typed and
// what lands in the channel are two different strings. This is where you find
// that out before pressing Enter rather than after.
//
// HOW THE BUTTON GETS THERE, and why it is a source patch: the composer builds
// its icons as a React array (`…push(jsx(EmojiButton,…,"emoji"))`, then
// `0===arr.length ? null : jsx("div",{children:arr})`). The first attempt
// appended a DOM node into that rendered flex row instead — and React, which
// re-renders the row on every keystroke, threw while reconciling and blanked the
// entire cluster: gift / GIF / sticker / emoji all disappeared, and the orphaned
// button did nothing when clicked. Pushing an element into the array Discord is
// about to render keeps React in charge, which is the only safe way in.
//
// Same seam Vencord's ChatInputButtonAPI uses, re-derived against this build:
// the array is `j`, it renders as `children:j`, and the injection point is the
// `0===j.length` guard immediately before it.

import { definePlugin } from "../../core/plugin";
import { React } from "../../core/common/react";
import { settings } from "./settings";
import { PreviewButton, closePreviewPanel, setActive, isActive } from "./button";

export default definePlugin({
  id: "message-preview",
  name: "发送前预览",
  description:
    "在输入框加一个按钮，点一下就能看到这条消息发出去之后长什么样：markdown、表情、@提及都按 Discord 自己的渲染显示；如果假 Nitro 会改写内容（表情变成图片链接），还会一并显示真正发出去的原文。按钮是源码级注入，开启后需要刷新页面。",
  authors: [{ name: "caitemm" }],
  category: "chat",

  settings,

  patches: [
    {
      label: "composer button injection",
      find: '"sticker")',
      replacement: {
        // Anchor on the `0===arr.length` guard, verified to sit directly before
        // `children:arr` on this build — the lookahead ties the two together so
        // a same-shaped guard elsewhere in the module can't be hit by mistake.
        // Nothing is read from `arguments`: the enclosing function is an arrow,
        // where `arguments` is not the component's props at all (Vencord can
        // rely on it upstream; here it would silently be the wrong object).
        match: /0===([\w$]+)\.length(?=.{0,25}?\(0,[\w$]+\.jsxs?\)\(.{0,75}?children:\1)/,
        replace: "($self.injectButton($1),$&)"
      }
    }
  ],

  start() {
    setActive(true);
  },

  stop() {
    setActive(false);
    closePreviewPanel();
    // The patch itself stays in Discord's code for the session — source patches
    // cannot be unwound — but `isActive()` is false now, so the composer stops
    // rendering the button on its next paint. `runtime.needsRestart(id)` reports
    // the difference.
  },

  /**
   * Called from the patch with the composer's live button array, on every
   * render. Guarded end-to-end: this executes inside Discord's render path, so a
   * throw here would blank the composer rather than just lose the button.
   *
   * `unshift`, not `push`: the array is built gift → GIF → sticker → emoji →
   * appLauncher → submit and rendered straight into a flex row, so pushing put
   * the eye on the far right, past the submit button. Front of the array is the
   * left edge of the cluster, which is where it belongs — and it also keeps the
   * emoji button, the one people hit by muscle memory, where it has always been.
   */
  injectButton(buttons: unknown): void {
    try {
      if (!isActive() || !Array.isArray(buttons)) return;
      buttons.unshift(React.createElement(PreviewButton, { key: "halcyon-preview" }));
    } catch {
      // A missing button is a nuisance; a thrown one costs the user their
      // composer. Swallow it.
    }
  }
});
