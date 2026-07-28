// platform-indicators settings schema.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  inMessages: {
    group: "显示位置",
    type: "boolean",
    default: true,
    label: "消息作者旁",
    description: "在聊天里每条消息的用户名后面显示对方所在的平台。"
  },
  inMemberList: {
    group: "显示位置",
    type: "boolean",
    default: true,
    label: "成员列表",
    description: "在右侧成员列表的每个名字后面显示平台图标。"
  },

  colorize: {
    group: "外观",
    type: "select",
    default: "status",
    label: "图标配色",
    description: "按状态着色时，绿=在线、黄=空闲、红=免打扰，和 Discord 的状态点一致。",
    options: [
      { value: "status", label: "按在线状态着色" },
      { value: "muted", label: "统一灰色" }
    ]
  },
  iconSize: {
    group: "外观",
    type: "select",
    default: "14",
    label: "图标大小",
    options: [
      { value: "12", label: "12（最小）" },
      { value: "14", label: "14（默认）" },
      { value: "16", label: "16" },
      { value: "18", label: "18" }
    ]
  },

  ignoreBots: {
    group: "过滤",
    type: "boolean",
    default: true,
    label: "忽略机器人",
    description: "机器人几乎总是显示为网页端，信息量为零，默认不显示。"
  },
  ignoreSelf: {
    group: "过滤",
    type: "boolean",
    default: false,
    label: "忽略自己",
    description: "不在自己的消息旁显示平台图标。"
  }
});
