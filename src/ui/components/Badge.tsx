// Small status badge / chip.
//
// Single-hue, translucent background, uppercase-free. Tone selects a semantic
// color pair defined in components.css.

export type BadgeTone = "neutral" | "accent" | "green" | "red" | "orange";

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span className="hc-badge" data-tone={tone}>
      {children}
    </span>
  );
}
