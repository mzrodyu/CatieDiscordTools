// who-reacted settings schema.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  inlineAvatars: {
    group: "常驻显示",
    type: "boolean",
    default: false,
    label: "直接在表情旁显示头像",
    description:
      "每个反应内嵌一小行头像。新版 Discord 桌面客户端已经原生显示，绝大多数情况下这一项应关闭；只有当你的 Discord 版本没有原生的反应者头像预览时才开启，否则会重复。"
  },
  inlineAvatarCount: {
    group: "常驻显示",
    type: "number",
    default: 3,
    label: "最多显示几个头像",
    description: "反应内最多贴几张头像。多余的人以「+N」形式折叠。",
    min: 1,
    max: 6,
    step: 1
  },

  hoverPopout: {
    group: "悬停浮层",
    type: "boolean",
    default: false,
    label: "悬停时弹出完整名单",
    description:
      "鼠标停在反应上时弹出完整反应者列表（带名字、可选 ID）。常驻头像已经够用时可以关掉。"
  },
  trigger: {
    group: "悬停浮层",
    type: "select",
    default: "hover",
    label: "触发方式",
    description:
      "悬停即查会在你划过表情时就请求一次名单；按住 Alt 悬停更克制，适合不想频繁触发的场景。仅在「悬停时弹出完整名单」开启时生效。",
    options: [
      { value: "hover", label: "悬停即查" },
      { value: "alt-hover", label: "按住 Alt 悬停" }
    ]
  },
  delay: {
    group: "悬停浮层",
    type: "number",
    default: 120,
    label: "悬停延迟（毫秒）",
    description: "鼠标停留多久才弹出名单。太短会在划过一排表情时连续发请求。仅在「悬停时弹出完整名单」开启时生效。",
    min: 0,
    max: 2000,
    step: 50
  },

  maxUsers: {
    group: "显示",
    type: "number",
    default: 20,
    label: "最多显示人数",
    description: "超出的部分折叠为“还有 N 人”。Discord 单次最多返回 100 人。",
    min: 1,
    max: 100,
    step: 5
  },
  showAvatars: {
    group: "显示",
    type: "boolean",
    default: true,
    label: "显示头像",
    description: "关闭后只显示名字，不会加载任何头像图片。"
  },
  showIds: {
    group: "显示",
    type: "boolean",
    default: false,
    label: "显示用户 ID",
    description: "在名字后面附上用户 ID，便于举报或拉黑时复制。"
  }
});
