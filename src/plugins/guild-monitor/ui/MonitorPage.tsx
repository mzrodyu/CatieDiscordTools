// guild-monitor page.
//
// Pulls the account's joined servers and lets the user pick which to actively
// monitor. A loud risk note sits on top: monitoring subscribes to channels the
// user hasn't opened, which is automation and can get an account banned. The
// checklist writes straight to the settings store (persisted), and toggling a
// row re-affirms subscriptions immediately.

import { useEffect, useState } from "../../../core/common/react";
import { GuildStore } from "../../../core/common/discord";
import { findStore } from "../../../core/modules/webpack";
import { Toggle } from "../../../ui/components/Toggle";
import { Button } from "../../../ui/components/Button";
import { EmptyState } from "../../../ui/components/EmptyState";
import { WarningIcon, ServerIcon, RefreshIcon } from "../../../icons";
import { settings } from "../settings";
import { isSubscriptionSupported, refreshNow } from "../subscribe";

interface GuildInfo {
  id: string;
  name: string;
}

function readGuilds(): GuildInfo[] {
  try {
    // Resolve by the store's registered name first. A bare shape probe
    // (getGuild + getGuilds) can land on an empty lookalike module, which is
    // how the list came back at zero; the named lookup pins the real store.
    // Fall back to the shape-matched handle if the name lookup misses.
    const store = findStore("GuildStore") ?? GuildStore;
    const map = store?.getGuilds?.() ?? {};
    return Object.values(map)
      .map((g: any) => ({ id: String(g?.id ?? ""), name: String(g?.name ?? g?.id ?? "未知服务器") }))
      .filter((g) => g.id)
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  } catch {
    return [];
  }
}

export function MonitorPage(): React.ReactElement {
  const [guilds, setGuilds] = useState<GuildInfo[]>(() => readGuilds());
  const [selected, setSelected] = useState<string[]>(() => [...(settings.store.selectedGuilds as string[])]);
  const [acknowledged, setAcknowledged] = useState<boolean>(() => settings.store.acknowledgedRisk === true);
  const supported = isSubscriptionSupported();

  useEffect(() => {
    // The guild store may still be filling in right after boot; re-read once.
    if (guilds.length === 0) {
      const t = setTimeout(() => setGuilds(readGuilds()), 400);
      return () => clearTimeout(t);
    }
  }, [guilds.length]);

  const persist = (ids: string[]) => {
    setSelected(ids);
    settings.store.selectedGuilds = ids;
    refreshNow();
  };

  const toggleGuild = (id: string) => {
    persist(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);
  };

  const setAck = (on: boolean) => {
    setAcknowledged(on);
    settings.store.acknowledgedRisk = on;
    if (!on) persist([]); // withdrawing consent clears the monitored set
  };

  return (
    <div className="hc-stack">
      <div className="hc-inline-note hc-inline-note--danger">
        <WarningIcon size={18} />
        <span>
          主动监控会订阅你尚未打开的频道，属于自动化行为，可能违反 Discord 服务条款并导致
          <b>账号被封禁</b>。请自行承担风险。
        </span>
      </div>

      <div className="hc-section">
        <div className="hc-section__body">
          <div className="hc-cell hc-cell--row">
            <div className="hc-cell__main">
              <div className="hc-cell__label">启用主动监控</div>
              <div className="hc-cell__desc">开启后才能勾选下方的服务器。</div>
            </div>
            <Toggle checked={acknowledged} onChange={setAck} aria-label="启用主动监控" />
          </div>
        </div>
      </div>

      {!supported && (
        <div className="hc-inline-note">
          <WarningIcon size={18} />
          <span>当前 Discord 版本未暴露可用的订阅接口，监控暂时无法生效。</span>
        </div>
      )}

      <div className="hc-section">
        <div className="hc-section__title" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>服务器（{guilds.length}）</span>
          <button
            type="button"
            className="hc-tab"
            onClick={() => setGuilds(readGuilds())}
            style={{ height: 20, padding: "0 8px", textTransform: "none" }}
          >
            <RefreshIcon size={12} /> 刷新
          </button>
        </div>
        {guilds.length === 0 ? (
          <EmptyState
            icon={<ServerIcon size={48} />}
            title="没有读到服务器"
            subtitle="等 Discord 加载完成后点上面的刷新，或稍后再来。"
          />
        ) : (
          <div className="hc-section__body" style={{ opacity: acknowledged ? 1 : 0.5, pointerEvents: acknowledged ? "auto" : "none" }}>
            {guilds.map((g) => (
              <div className="hc-cell hc-cell--row" key={g.id}>
                <div className="hc-cell__main">
                  <div className="hc-cell__label">{g.name}</div>
                  <div className="hc-cell__desc">{g.id}</div>
                </div>
                <Toggle
                  checked={selected.includes(g.id)}
                  onChange={() => toggleGuild(g.id)}
                  aria-label={`监控 ${g.name}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="hc-savebar">
          <span className="hc-savebar__label">正在监控 {selected.length} 个服务器</span>
          <div className="hc-savebar__actions">
            <Button size="sm" variant="destructive" onClick={() => persist([])}>
              全部取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
