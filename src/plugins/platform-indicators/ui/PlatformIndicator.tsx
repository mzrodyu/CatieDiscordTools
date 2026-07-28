// The inline platform glyphs.
//
// One small icon per client the user is connected on, tinted by that client's
// status. Rendered inside Discord's own DOM, so the styling stays literal (see
// components.css) and the markup stays inline-only — no wrappers that could
// disturb the header's baseline.

import { React, useState, useEffect } from "../../../core/common/react";
import { DesktopIcon, GamepadIcon, GlobeIcon, MobileIcon, type IconProps } from "../../../icons";
import {
  isBot,
  presenceVersion,
  readPlatforms,
  subscribePresence,
  type Platform
} from "../platforms";
import { settings } from "../settings";

/** `IconProps.size` is a plain number, so the settings value passes straight in. */
const ICONS: Record<Platform, (props: IconProps) => React.ReactElement> = {
  desktop: DesktopIcon,
  mobile: MobileIcon,
  web: GlobeIcon,
  embedded: GamepadIcon
};

const LABELS: Record<Platform, string> = {
  desktop: "桌面客户端",
  mobile: "手机",
  web: "网页 / 浏览器",
  embedded: "游戏主机"
};

const STATUS_LABELS: Record<string, string> = {
  online: "在线",
  idle: "空闲",
  dnd: "免打扰",
  offline: "离线"
};

/** Re-render whenever the coalesced presence bus fires. */
function usePresenceVersion(): number {
  const [, setVersion] = useState(presenceVersion());
  useEffect(() => subscribePresence(() => setVersion(presenceVersion())), []);
  return presenceVersion();
}

export interface PlatformIndicatorProps {
  userId: string;
  /** True when this indicator sits next to the current account's own name. */
  isSelf: boolean;
}

export function PlatformIndicator({
  userId,
  isSelf
}: PlatformIndicatorProps): React.ReactElement | null {
  usePresenceVersion();
  const s = settings.store;

  if (s.ignoreSelf && isSelf) return null;
  if (s.ignoreBots && isBot(userId)) return null;

  const platforms = readPlatforms(userId);
  if (platforms.length === 0) return null;

  const size = Number(s.iconSize) || 14;
  const tone = s.colorize === "status";

  return (
    <span className="hc-platform">
      {platforms.map(({ platform, status }) => {
        const Icon = ICONS[platform];
        const label = `${LABELS[platform]}（${STATUS_LABELS[status] ?? status}）`;
        return (
          <span
            key={platform}
            className={`hc-platform__item hc-platform__item--${tone ? status : "muted"}`}
            title={label}
          >
            <Icon size={size} aria-label={label} />
          </span>
        );
      })}
    </span>
  );
}
