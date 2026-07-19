// message-cleaner — batch-delete your own Discord messages (self "冲水机").
//
// A privacy/cleanup tool: it removes messages authored by the current account,
// in a single channel/DM or across a whole server, always behind an explicit
// preview + confirmation. It never touches other people's messages.
//
// All the work lives in the page (cleaner.ts + CleanerPage). There are no
// source patches and no runtime hooks to install, so start/stop are nominal;
// the page talks to Discord's own authenticated REST client on demand.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { TrashIcon } from "../../icons";
import { settings } from "./settings";
import { CleanerPage } from "./ui/CleanerPage";

const log = logger("message-cleaner");

export default definePlugin({
  id: "message-cleaner",
  name: "消息清理",
  description: "批量删除你自己在某个频道或整个服务器的历史消息（自助冲水机）。先预览再删除，仅限本人消息，删除不可恢复。",
  authors: [{ name: "caitemm" }, { name: "catie" }],
  category: "privacy",

  settings,

  page: {
    title: "清理",
    icon: TrashIcon,
    component: CleanerPage
  },

  start() {
    log.info("message-cleaner ready");
  },

  stop() {
    // Page-only plugin: no patches or listeners to tear down.
  }
});
