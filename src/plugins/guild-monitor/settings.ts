// guild-monitor settings.
//
// selectedGuilds is the list of guild ids the user chose to actively monitor.
// It is edited from the plugin's own page (a checklist of joined servers), not
// the generic form, so it is hidden here — but it still lives in the settings
// store so it persists and the runtime can read it on boot.

import { defineSettings } from "../../core/settings";

export const settings = defineSettings({
  // Toggled from the plugin page (with the full risk note), not the generic
  // form, so it's hidden here — but persisted through the store like any value.
  acknowledgedRisk: {
    type: "boolean",
    default: false,
    label: "我已了解封号风险",
    description:
      "主动订阅频道属于自动化行为，可能违反 Discord 服务条款并导致账号被封。仅在你完全理解并自愿承担风险时开启。",
    hidden: true
  },
  selectedGuilds: {
    type: "string-list",
    default: [],
    label: "监控的服务器",
    description: "按服务器 ID 监控。建议从下方的服务器列表勾选，而不是手填。",
    itemPlaceholder: "服务器 ID",
    hidden: true
  }
});
