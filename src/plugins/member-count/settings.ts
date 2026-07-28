// member-count settings schema.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  placement: {
    group: "位置",
    type: "select",
    default: "header",
    label: "显示位置",
    description:
      "频道顶栏是横向工具条，插一个小标签最稳，也是 Discord 没提供数字的位置；成员列表顶部 Discord 自己已经显示了「在线 X · 共 Y」，本插件在那里显示只是覆盖同一份信息，选它前请知悉。",
    options: [
      { value: "header", label: "频道顶栏" },
      { value: "member-list", label: "成员列表顶部" },
      { value: "both", label: "两处都显示" }
    ]
  },

  showOnline: {
    group: "内容",
    type: "boolean",
    default: true,
    label: "显示在线人数",
    description: "在线人数来自成员列表的分组统计，只有成员列表打开过才有数据；拿不到时自动隐藏。"
  },
  showTotal: {
    group: "内容",
    type: "boolean",
    default: true,
    label: "显示总成员数",
    description: "服务器的总成员数（含离线）。"
  },
  abbreviate: {
    group: "内容",
    type: "boolean",
    default: false,
    label: "缩写大数字",
    description: "12,345 显示为 12.3k。关闭则显示带千位分隔的完整数字。"
  },
  showLabels: {
    group: "内容",
    type: "boolean",
    default: true,
    label: "显示文字标签",
    description: "显示“在线 / 共”这样的前缀。关闭后只剩数字与圆点，更紧凑。"
  },

  preloadCounts: {
    group: "高级",
    type: "boolean",
    default: true,
    label: "缺数据时请求加载",
    description:
      "在线人数依赖服务器的成员列表数据；如果这次启动后从没展开过成员列表，Discord 根本没拉过这份数据。开启后，遇到缺数字的服务器会调用 Discord 自己的频道预加载（和你点进服务器时一样的动作），每个服务器每次启动只做一次。关闭则只显示已有的数字。"
  }
});
