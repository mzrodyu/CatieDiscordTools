// The plugin browser: a searchable, category-grouped list with a per-plugin
// detail page. Toggling a row flips the plugin on or off; opening a row (when it
// has settings or a page of its own) slides into its detail view.

import { useState } from "../../core/common/react";
import { runtime, type PluginView } from "../../core/runtime";
import { Toggle } from "../components/Toggle";
import { ListRow } from "../components/ListRow";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SettingsForm } from "./SettingsForm";
import { useRuntimeList } from "./hooks";
import { CATEGORIES, CATEGORY_ORDER } from "./categories";
import {
  ChevronLeftIcon,
  RefreshIcon,
  SearchIcon,
  WarningIcon,
  type IconProps
} from "../../icons";

export function PluginsView(): React.ReactElement {
  const plugins = useRuntimeList().filter((p) => !p.hidden);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selected = selectedId ? plugins.find((p) => p.id === selectedId) : undefined;
  if (selected) {
    return <PluginDetail view={selected} onBack={() => setSelectedId(null)} />;
  }

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      )
    : plugins;

  return (
    <div>
      <div className="hc-toolbar">
        <div className="hc-search">
          <SearchIcon size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="搜索插件"
            aria-label="搜索插件"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={48} />}
          title="没有匹配的插件"
          subtitle="换个关键词再试试。"
        />
      ) : (
        CATEGORY_ORDER.map((category) => {
          const inCategory = filtered.filter((p) => p.category === category);
          if (inCategory.length === 0) return null;
          const meta = CATEGORIES[category];
          return (
            <div className="hc-section" key={category}>
              <div className="hc-section__title">{meta.label}</div>
              <div className="hc-section__body">
                {inCategory.map((view) => (
                  <PluginRow
                    key={view.id}
                    view={view}
                    onOpen={() => setSelectedId(view.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function PluginRow({ view, onOpen }: { view: PluginView; onOpen: () => void }): React.ReactElement {
  const meta = CATEGORIES[view.category];
  const Icon = meta.Icon;
  const openable = view.hasSettings || view.hasPage;

  return (
    <ListRow
      icon={<Icon size={18} />}
      iconBackground={meta.color}
      title={view.name}
      subtitle={view.description}
      onClick={openable ? onOpen : undefined}
      showChevron={openable}
      accessory={
        <>
          {view.needsRestart && (
            <Badge tone="orange">
              <RefreshIcon size={12} /> 待重启
            </Badge>
          )}
          {view.state === "errored" && (
            <Badge tone="red">
              <WarningIcon size={12} /> 出错
            </Badge>
          )}
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Toggle
              checked={view.enabled}
              disabled={view.required}
              onChange={() => runtime.toggle(view.id)}
              aria-label={`启用 ${view.name}`}
            />
          </span>
        </>
      }
    />
  );
}

function PluginDetail({ view, onBack }: { view: PluginView; onBack: () => void }): React.ReactElement {
  const plugin = runtime.getPlugin(view.id);
  const meta = CATEGORIES[view.category];
  const Icon: React.FC<IconProps> = meta.Icon;
  // Plugins can carry both a page and a settings form (message-logger: the
  // captured-message log plus its 记录/外观/屏蔽对象 cards). Offer both behind
  // segment tabs — but only when the settings schema has visible fields, so a
  // page-only plugin whose settings are all internal (guild-monitor) shows just
  // its page instead of an empty 设置 tab.
  const hasVisibleSettings = Boolean(
    plugin?.settings &&
      Object.values(plugin.settings.schema).some((def) => !def.hidden)
  );
  const hasBoth = Boolean(plugin?.page) && hasVisibleSettings;
  const [section, setSection] = useState<"page" | "settings">("page");

  return (
    <div>
      <button type="button" className="hc-back" onClick={onBack}>
        <ChevronLeftIcon size={20} />
        插件
      </button>

      <div className="hc-detail-head">
        <div className="hc-detail-head__icon" style={{ background: meta.color }}>
          <Icon size={26} />
        </div>
        <div className="hc-detail-head__text">
          <div className="hc-detail-head__name">{view.name}</div>
          <div className="hc-detail-head__desc">{view.description}</div>
          <div className="hc-detail-head__meta">
            {view.authors.map((a) => a.name).join("、")}
          </div>
        </div>
        <span
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Toggle
            checked={view.enabled}
            disabled={view.required}
            onChange={() => runtime.toggle(view.id)}
            aria-label={`启用 ${view.name}`}
          />
        </span>
      </div>

      {view.needsRestart && (
        <div className="hc-inline-note">
          <RefreshIcon size={18} />
          <span>这个插件包含加载期补丁，需要重启 Discord 才能完全生效。</span>
        </div>
      )}

      {view.state === "errored" && (
        <div className="hc-inline-note hc-inline-note--danger">
          <WarningIcon size={18} />
          <span>插件启动时抛出异常，已被自动停用，详情见日志。</span>
        </div>
      )}

      {hasBoth && (
        <div className="hc-segment">
          <button
            type="button"
            className="hc-segment__item"
            data-active={section === "page"}
            onClick={() => setSection("page")}
          >
            {plugin!.page!.title || "记录"}
          </button>
          <button
            type="button"
            className="hc-segment__item"
            data-active={section === "settings"}
            onClick={() => setSection("settings")}
          >
            设置
          </button>
        </div>
      )}

      {plugin?.page && (!hasBoth || section === "page") ? (
        <plugin.page.component />
      ) : plugin?.settings ? (
        <SettingsForm settings={plugin.settings} />
      ) : (
        <EmptyState title="没有可配置项" subtitle="这个插件开箱即用，无需设置。" />
      )}
    </div>
  );
}
