// The section appended to Discord's channel list.
//
// Recomputes on the Flux actions that can change channel visibility and on a
// slow interval as a safety net (permission stores can settle a beat after the
// action that changed them). The list itself never navigates: these channels
// are precisely the ones the client refuses to open.

import { React, useEffect, useState } from "../../../core/common/react";
import { flux } from "../../../core/flux";
import { showToast } from "../../../core/common/discord";
import { settings } from "../settings";
import {
  collectHiddenChannels,
  currentGuildId,
  snapshotKey,
  type HiddenChannel,
  type HiddenChannelsSnapshot
} from "../channels";
import { ChevronIcon, LockIcon, channelIcon } from "./icons";

/** Actions after which channel visibility may differ. */
const WATCHED_ACTIONS = [
  "CHANNEL_SELECT",
  "GUILD_SELECT",
  "GUILD_CREATE",
  "GUILD_UPDATE",
  "GUILD_DELETE",
  "CHANNEL_CREATE",
  "CHANNEL_UPDATE",
  "CHANNEL_DELETE",
  "CHANNEL_OVERWRITES_UPDATE",
  "GUILD_ROLE_CREATE",
  "GUILD_ROLE_UPDATE",
  "GUILD_ROLE_DELETE",
  "GUILD_MEMBER_UPDATE",
  "GUILD_MEMBER_REMOVE",
  "GUILD_MEMBERS_CHUNK"
] as const;

const POLL_MS = 5000;

const EMPTY_SNAPSHOT: HiddenChannelsSnapshot = {
  guildId: null,
  groups: [],
  total: 0,
  obfuscated: 0,
  source: "none",
  canChecked: false
};

/** Read the current guild's snapshot; never throws into a React render. */
function readSnapshot(): HiddenChannelsSnapshot {
  try {
    return collectHiddenChannels(currentGuildId());
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function useSnapshot(): HiddenChannelsSnapshot {
  const [snapshot, setSnapshot] = useState<HiddenChannelsSnapshot>(readSnapshot);

  useEffect(() => {
    let live = true;

    const refresh = (): void => {
      if (!live) return;
      const next = readSnapshot();
      // Bail on no-change so the poll doesn't re-render forever.
      setSnapshot((prev) => (snapshotKey(prev) === snapshotKey(next) ? prev : next));
    };

    refresh();

    const offs = WATCHED_ACTIONS.map((type) => flux.subscribe(type, refresh));
    const timer = setInterval(refresh, POLL_MS);
    // Display settings (show ids, grouping, …) take effect immediately. They do
    // not change the snapshot itself, so force a render rather than routing
    // through refresh's no-change bail.
    const settingOffs = Object.keys(settings.schema).map((key) =>
      settings.subscribe(key as never, () => setSnapshot((prev) => ({ ...prev })))
    );

    return () => {
      live = false;
      clearInterval(timer);
      for (const off of offs) off();
      for (const off of settingOffs) off();
    };
  }, []);

  return snapshot;
}

async function copyChannelId(id: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(id);
    showToast("已复制频道 ID", "success");
    return;
  } catch {
    // The desktop client's origin is not always a secure context; fall back.
  }

  try {
    const area = document.createElement("textarea");
    area.value = id;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("已复制频道 ID", "success");
  } catch {
    showToast("复制失败", "failure");
  }
}

function Row({
  channel,
  showId,
  clickAction
}: {
  channel: HiddenChannel;
  showId: boolean;
  clickAction: string;
}): React.ReactElement {
  const Icon = channelIcon(channel.type);
  const label = channel.name || channel.id;

  const onClick = (): void => {
    if (clickAction === "copy") {
      void copyChannelId(channel.id);
    } else {
      showToast(`没有权限查看这个频道：#${label}`, "info");
    }
  };

  return (
    <button
      type="button"
      className="hc-hiddenchannels__row"
      onClick={onClick}
      title={
        clickAction === "copy"
          ? `点击复制频道 ID · ${channel.id}`
          : `没有权限查看 · ${channel.id}`
      }
    >
      <Icon size={16} className="hc-hiddenchannels__icon" />
      <span className="hc-hiddenchannels__name">{label}</span>
      {showId ? <span className="hc-hiddenchannels__id">{channel.id}</span> : null}
    </button>
  );
}

export function HiddenChannelsSection(): React.ReactElement | null {
  const snapshot = useSnapshot();
  const s = settings.store;
  const [collapsed, setCollapsed] = useState(Boolean(s.defaultCollapsed));

  // Follow the setting if it is changed while the section is on screen.
  useEffect(
    () => settings.subscribe("defaultCollapsed", (next) => setCollapsed(Boolean(next))),
    []
  );

  if (!snapshot.guildId || snapshot.total === 0) return null;

  const groups = s.groupByCategory
    ? snapshot.groups
    : [
        {
          categoryId: null,
          categoryName: "",
          position: 0,
          channels: snapshot.groups
            .flatMap((group) => group.channels)
            .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
        }
      ];

  return (
    <div className="hc-hiddenchannels">
      <button
        type="button"
        className="hc-hiddenchannels__head"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
      >
        <LockIcon size={14} className="hc-hiddenchannels__icon" />
        <span className="hc-hiddenchannels__title">隐藏频道</span>
        {s.showCount ? <span className="hc-hiddenchannels__count">{snapshot.total}</span> : null}
        <ChevronIcon
          size={14}
          className={
            "hc-hiddenchannels__chevron" +
            (collapsed ? " hc-hiddenchannels__chevron--collapsed" : "")
          }
        />
      </button>

      {snapshot.obfuscated > 0 ? (
        <div className="hc-hiddenchannels__hint">
          频道名被 Discord 混淆成 __hidden__ 了。重启 Discord 让插件补丁生效后，这里会显示真实名称。
        </div>
      ) : null}

      {collapsed ? null : (
        <div className="hc-hiddenchannels__body">
          {groups.map((group, index) => (
            <div
              className="hc-hiddenchannels__group"
              key={group.categoryId ?? `flat-${index}`}
            >
              {s.groupByCategory && group.categoryName ? (
                <div className="hc-hiddenchannels__group-name" title={group.categoryName}>
                  {group.categoryName}
                </div>
              ) : null}
              {group.channels.map((channel) => (
                <Row
                  key={channel.id}
                  channel={channel}
                  showId={s.showIds}
                  clickAction={s.clickAction}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
