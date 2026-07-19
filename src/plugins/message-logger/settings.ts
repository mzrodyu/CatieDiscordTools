// message-logger settings schema.
//
// Kept small on purpose: what to capture, whose messages to skip, and how much
// to retain. Everything here is declarative; the runtime turns it into a live,
// persisted store and the settings UI renders it.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  keepDeletedInChat: {
    type: "boolean",
    default: true,
    label: "在聊天中保留被删消息",
    description: "被删除的消息不再消失，而是标记保留在原位。需要客户端补丁生效。"
  },
  deleteStyle: {
    type: "select",
    default: "tint",
    label: "被删消息样式",
    description: "被删消息在聊天中的呈现方式。",
    options: [
      { value: "tint", label: "红色底纹 + 左侧红条" },
      { value: "text", label: "正文变红" },
      { value: "ghost", label: "半透明淡出" },
      { value: "strike", label: "红色删除线" }
    ]
  },
  showDeletedMarker: {
    type: "boolean",
    default: true,
    label: "显示删除标记行",
    description: "在被删消息下方显示“此消息已删除”与删除时间。"
  },
  markerIcon: {
    type: "select",
    default: "trash",
    label: "标记图标",
    description: "删除标记行前的图标。",
    options: [
      { value: "trash", label: "🗑 垃圾桶" },
      { value: "shield", label: "🛡 盾牌" },
      { value: "warning", label: "⚠ 警告三角" },
      { value: "none", label: "无图标" }
    ]
  },
  markerLook: {
    type: "select",
    default: "plain",
    label: "标记外观",
    description: "删除标记行的呈现方式。",
    options: [
      { value: "plain", label: "纯文字" },
      { value: "badge", label: "圆角徽章" },
      { value: "quote", label: "引用块（左侧竖条）" }
    ]
  },
  markerTime: {
    type: "select",
    default: "time",
    label: "删除时间格式",
    description: "标记行里时间的显示方式。",
    options: [
      { value: "time", label: "仅时间（03:19:42）" },
      { value: "datetime", label: "日期 + 时间" },
      { value: "none", label: "不显示时间" }
    ]
  },
  logEdits: {
    type: "boolean",
    default: true,
    label: "记录编辑历史",
    description: "保存每条消息被编辑前的内容。"
  },
  ignoreBots: {
    type: "boolean",
    default: false,
    label: "忽略机器人",
    description: "不记录机器人发送的消息。"
  },
  ignoreSelf: {
    type: "boolean",
    default: false,
    label: "忽略自己",
    description: "不记录你自己删除或编辑的消息。"
  },
  retention: {
    type: "number",
    default: 50,
    label: "每频道保留条数",
    description: "0 表示不限制。上限 500。",
    min: 0,
    max: 500,
    step: 10
  },
  ignoredUsers: {
    type: "string-list",
    default: [],
    label: "忽略的用户",
    description: "按用户 ID 忽略。",
    itemPlaceholder: "用户 ID"
  },
  ignoredChannels: {
    type: "string-list",
    default: [],
    label: "忽略的频道",
    description: "按频道 ID 忽略。",
    itemPlaceholder: "频道 ID"
  }
});
