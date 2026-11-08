// hidden-channels settings schema.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  position: {
    group: "显示",
    type: "select",
    default: "bottom",
    label: "显示位置",
    description: "隐藏频道列表放在频道列表的底部还是顶部。",
    options: [
      { value: "bottom", label: "列表底部" },
      { value: "top", label: "列表顶部" }
    ]
  },
  groupByCategory: {
    group: "显示",
    type: "boolean",
    default: true,
    label: "按分类分组",
    description: "按 Discord 的分类名称分组。关闭后合并成一个列表，按名称排序。"
  },
  showCount: {
    group: "显示",
    type: "boolean",
    default: true,
    label: "显示数量",
    description: "在标题旁显示隐藏频道的数量。"
  },
  showIds: {
    group: "显示",
    type: "boolean",
    default: false,
    label: "显示频道 ID",
    description: "在频道名右侧显示频道 ID，方便复制或对照。"
  },
  defaultCollapsed: {
    group: "显示",
    type: "boolean",
    default: false,
    label: "默认折叠",
    description: "启动时默认收起列表，点标题展开。"
  },
  clickAction: {
    group: "交互",
    type: "select",
    default: "toast",
    label: "点击频道时",
    description: "这些频道没有查看权限，点击不会跳转，也不会读取任何消息。",
    options: [
      { value: "toast", label: "提示没有权限" },
      { value: "copy", label: "复制频道 ID" }
    ]
  }
});
