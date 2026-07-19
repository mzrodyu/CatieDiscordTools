// Halcyon icon set.
//
// Every icon is a single-color, line-drawn SVG on a 24x24 canvas: 1.5 stroke,
// round caps and joins, colored via `currentColor` so it inherits the
// surrounding text color on hover/press. Icons take a `size` (16/20/24/28/32)
// and never a color prop. Decorative by default; pass `aria-label` to expose one
// to assistive tech.
//
// See docs/ui-design-guide.md for the rules these follow.

export type IconSize = 16 | 20 | 24 | 28 | 32;

export interface IconProps {
  /** Rendered box in px. The scale in the design guide is 16/20/24/28/32, but
   *  the prop accepts any px value for one-off needs (badges, empty states). */
  size?: number;
  className?: string;
  "aria-label"?: string;
}

interface GlyphProps extends IconProps {
  children: React.ReactNode;
  /** Filled glyphs opt out of the default stroke styling. */
  filled?: boolean;
}

function Glyph({ size = 20, className, filled, children, ...rest }: GlyphProps) {
  const label = rest["aria-label"];
  // Callers outside Halcyon (e.g. Discord's settings sidebar rendering a
  // node's `icon`) pass their own prop shapes, where `size` may be a token
  // string like "sm". A non-numeric width/height makes the SVG fall back to
  // its huge default box, so coerce anything unusable to the 20px default.
  if (typeof size !== "number" || !Number.isFinite(size)) size = 20;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** Calm mark: a rounded square holding a single settled wave. */
export function HalcyonMark(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
      <path d="M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5" />
    </Glyph>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9 6l6 6-6 6" />
    </Glyph>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 9l6 6 6-6" />
    </Glyph>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7" />
      <path d="M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </Glyph>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M13.5 6.5l4 4" />
      <path d="M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z" />
    </Glyph>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z" />
      <path d="M9 12l2 2 4-4" />
    </Glyph>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z" />
    </Glyph>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="M20 20l-3.8-3.8" />
    </Glyph>
  );
}

export function XmarkIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Glyph>
  );
}

export function CheckmarkIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Glyph>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9" />
      <circle cx="15" cy="8" r="2.25" />
      <circle cx="9" cy="16" r="2.25" />
    </Glyph>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z" />
      <path d="M15 9a4 4 0 010 6" />
      <path d="M17.5 6.5a7.5 7.5 0 010 11" />
    </Glyph>
  );
}

/** Half-filled disc: the appearance / theme symbol. */
export function AppearanceIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 3.75a8.25 8.25 0 010 16.5z" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8.5 8L4.5 12l4 4" />
      <path d="M15.5 8l4 4-4 4" />
      <path d="M13.5 5.5l-3 13" />
    </Glyph>
  );
}

export function EllipsisIcon(props: IconProps) {
  return (
    <Glyph {...props} filled>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </Glyph>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4v10" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M5 19.5h14" />
    </Glyph>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 20V10" />
      <path d="M8 13.5l4-4 4 4" />
      <path d="M5 4.5h14" />
    </Glyph>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5" />
      <path d="M12 7.75h.01" />
    </Glyph>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4.5L3.5 19h17L12 4.5z" />
      <path d="M12 10v4" />
      <path d="M12 16.75h.01" />
    </Glyph>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8.5 7h11M8.5 12h11M8.5 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </Glyph>
  );
}

export function PowerIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4v7" />
      <path d="M7 6.5a7 7 0 109.9 0" />
    </Glyph>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12h14" />
    </Glyph>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19 8.5a7.5 7.5 0 10.9 6" />
      <path d="M19 4v4.5h-4.5" />
    </Glyph>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Glyph>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
      <path d="M8 7h.01M8 17h.01" />
    </Glyph>
  );
}

export function BroadcastIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7" />
      <path d="M6 6a9 9 0 000 12M18 6a9 9 0 010 12" />
    </Glyph>
  );
}
