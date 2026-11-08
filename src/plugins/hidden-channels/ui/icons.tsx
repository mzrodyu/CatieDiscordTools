// Glyphs used only by hidden-channels. Per the icon rules, a symbol with a
// single consumer lives with its plugin rather than in the shared set.

import { React } from "../../../core/common/react";
import { CHANNEL_TYPES } from "../channels";

export interface GlyphProps {
  size?: number;
  className?: string;
}

function Glyph({
  size = 16,
  className,
  children
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function LockIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="5" y="10.5" width="14" height="9" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Glyph>
  );
}

export function ChevronIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7 10l5 5 5-5" />
    </Glyph>
  );
}

export function TextChannelIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9.5 4.5 8 19.5M16 4.5l-1.5 15M4.5 9h15M4 15h15" />
    </Glyph>
  );
}

export function VoiceChannelIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 9.5v5h3l4 3.5v-12l-4 3.5H4z" />
      <path d="M15 9a4 4 0 0 1 0 6" />
      <path d="M17.5 6.5a7.5 7.5 0 0 1 0 11" />
    </Glyph>
  );
}

export function AnnouncementIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
      <path d="M19.5 6.5a7.5 7.5 0 0 1 0 11" />
    </Glyph>
  );
}

export function StageIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="9" y="3.5" width="6" height="10" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </Glyph>
  );
}

export function ForumIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 6.5h9.5a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H9l-4.5 3v-10.5z" />
      <path d="M18 9.5h1.5a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H18v2.5l-3-2.5" />
    </Glyph>
  );
}

export function MediaIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M5 17l4.5-4.5 3 3L16 12l4 4" />
    </Glyph>
  );
}

export type ChannelIconComponent = (props: GlyphProps) => React.ReactElement;

/** The glyph matching a Discord channel type. */
export function channelIcon(type: number): ChannelIconComponent {
  switch (type) {
    case CHANNEL_TYPES.TEXT:
      return TextChannelIcon;
    case CHANNEL_TYPES.VOICE:
      return VoiceChannelIcon;
    case CHANNEL_TYPES.ANNOUNCEMENT:
      return AnnouncementIcon;
    case CHANNEL_TYPES.STAGE:
      return StageIcon;
    case CHANNEL_TYPES.FORUM:
      return ForumIcon;
    case CHANNEL_TYPES.MEDIA:
      return MediaIcon;
    default:
      return TextChannelIcon;
  }
}
