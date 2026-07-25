// quest-indicator — show active quest count in the server rail.
//
// Discord's Quests are time-limited promotional tasks (watch a stream, play a
// game) that reward cosmetics. This plugin surfaces an indicator in the server
// rail, right below the mark-all-read button, showing how many quests are
// currently available. Clicking it opens Discord's native quest hub.
//
// NOTE: This plugin does NOT use its own source patch. The mark-all-read plugin
// already patches the guild nav to inject rail buttons; this plugin exports a
// `getRailButton()` helper that mark-all-read calls (if quest-indicator is
// enabled) so both buttons share a single patch site.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { React, useState, useEffect } from "../../core/common/react";
import { injectStyles } from "../../ui/inject-styles";
import { QuestIcon } from "../../icons";
import { QuestsStore, NavigationRouter } from "../../core/common/discord";

const log = logger("quest-indicator");

function useQuestCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const quests = (QuestsStore as any)?.quests;
        if (quests instanceof Map) {
          let active = 0;
          for (const q of quests.values()) {
            if (q && !q.userStatus?.completedAt && !isExpired(q)) active++;
          }
          setCount(active);
        } else if (Array.isArray(quests)) {
          setCount(quests.filter((q: any) => q && !q.userStatus?.completedAt && !isExpired(q)).length);
        } else {
          const all = (QuestsStore as any)?.getQuests?.();
          if (Array.isArray(all)) {
            setCount(all.filter((q: any) => q && !q.userStatus?.completedAt && !isExpired(q)).length);
          }
        }
      } catch {
        // store not ready
      }
    };

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return count;
}

function isExpired(quest: any): boolean {
  if (!quest?.config?.expiresAt) return false;
  try {
    return new Date(quest.config.expiresAt).getTime() < Date.now();
  } catch {
    return false;
  }
}

function openQuestHub(): void {
  try {
    // NavigationRouter.transitionTo 在某些构建不可用，直接用 location
    const nav = NavigationRouter as any;
    if (typeof nav?.transitionTo === "function") {
      nav.transitionTo("/quest-home");
    } else {
      location.href = "/quest-home";
    }
  } catch (err) {
    log.warn("could not open quest hub", err);
    location.href = "/quest-home";
  }
}

function RailButton(): React.ReactElement {
  const count = useQuestCount();

  return (
    <div className="hc-rail-item">
      <button
        type="button"
        className="hc-rail-btn hc-quest-btn"
        aria-label={count > 0 ? `${count} 个可用任务` : "任务中心"}
        title={count > 0 ? `${count} 个可用任务` : "任务中心"}
        onClick={openQuestHub}
      >
        <QuestIcon size={24} />
        {count > 0 && <span className="hc-quest-badge">{count > 9 ? "9+" : count}</span>}
      </button>
    </div>
  );
}

/** Called by mark-all-read to include this button in the shared rail patch. */
export function getRailButton(): React.ReactNode {
  return React.createElement(RailButton, { key: "hc-quest-indicator-rail" });
}

export default definePlugin({
  id: "quest-indicator",
  name: "任务指示器",
  description:
    "在服务器列表显示一个任务图标，带有可用任务数量的徽章。点击可快速打开 Discord 任务中心。",
  authors: [{ name: "caitemm" }],
  category: "utility",

  start() {
    injectStyles();
    log.info("quest-indicator ready");
  },

  stop() {}
});
