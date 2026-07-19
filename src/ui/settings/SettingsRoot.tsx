// The settings shell.
//
// Two entry shapes share the same views:
//   - SettingsRoot: the self-contained overlay panel with its own sidebar nav.
//     Always available, independent of any Discord internals.
//   - EmbeddedView: a single view wrapped for Discord's own settings pane, one
//     per injected sidebar section.

import { useState } from "../../core/common/react";
import {
  HalcyonMark,
  SlidersIcon,
  ListIcon,
  InfoIcon,
  XmarkIcon,
  type IconProps
} from "../../icons";
import { PluginsView } from "./PluginsView";
import { LogsView } from "./LogsView";
import { AboutView } from "./AboutView";

export type SettingsTab = "plugins" | "logs" | "about";

interface TabDef {
  id: SettingsTab;
  label: string;
  title: string;
  Icon: React.FC<IconProps>;
}

const TABS: TabDef[] = [
  { id: "plugins", label: "插件", title: "插件", Icon: SlidersIcon },
  { id: "logs", label: "日志", title: "日志", Icon: ListIcon },
  { id: "about", label: "关于", title: "关于 Halcyon", Icon: InfoIcon }
];

function renderView(tab: SettingsTab): React.ReactElement {
  switch (tab) {
    case "plugins":
      return <PluginsView />;
    case "logs":
      return <LogsView />;
    case "about":
      return <AboutView />;
  }
}

export function SettingsRoot({ onClose }: { onClose?: () => void }): React.ReactElement {
  const [tab, setTab] = useState<SettingsTab>("plugins");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="halcyon hc-panel">
      <nav className="hc-panel__sidebar">
        <div className="hc-panel__brand">
          <HalcyonMark size={24} />
          <span className="hc-panel__brand-name">Halcyon</span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="hc-navitem"
            data-active={t.id === tab}
            onClick={() => setTab(t.id)}
          >
            <t.Icon size={18} />
            {t.label}
          </button>
        ))}
      </nav>

      <section className="hc-panel__content">
        <header className="hc-panel__header">
          <span className="hc-title2">{active.title}</span>
          {onClose && (
            <button type="button" className="hc-iconbtn" onClick={onClose} aria-label="关闭">
              <XmarkIcon size={20} />
            </button>
          )}
        </header>
        <div className="hc-panel__scroll">{renderView(tab)}</div>
      </section>
    </div>
  );
}

/** A single view wrapped for embedding in Discord's native settings pane. */
export function EmbeddedView({ tab }: { tab: SettingsTab }): React.ReactElement {
  return <div className="halcyon hc-embed">{renderView(tab)}</div>;
}
