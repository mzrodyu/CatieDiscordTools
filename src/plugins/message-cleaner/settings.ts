// message-cleaner settings.
//
// Only the tunable defaults the operate page reads at run time: how many to
// take, how fast to delete, which end to start from, and whether to confirm.
// The page itself carries the scope pickers and the run/preview/delete actions.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  order: {
    group: "默认参数",
    type: "select",
    default: "desc",
    label: "清理方向",
    description: "受条数限制时，优先从哪一端开始删。",
    options: [
      { value: "desc", label: "从新到老" },
      { value: "asc", label: "从老到新" }
    ]
  },
  limit: {
    group: "默认参数",
    type: "number",
    default: 100,
    label: "最多处理条数",
    description: "单次预览 / 删除的上限。",
    min: 1,
    max: 5000,
    step: 50
  },
  delayMs: {
    group: "默认参数",
    type: "number",
    default: 1600,
    label: "删除间隔（毫秒）",
    description: "两次删除之间的等待，太快会触发限速，建议不低于 1000。",
    min: 300,
    max: 30000,
    step: 100
  },
  confirmBeforeDelete: {
    group: "默认参数",
    type: "boolean",
    default: true,
    label: "删除前二次确认",
    description: "点「删除」后弹出确认框，避免误删。"
  }
});
