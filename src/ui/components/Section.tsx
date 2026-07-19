// Grouped section.
//
// An optional uppercase title, a rounded container for its rows, and an
// optional explanatory note beneath. Mirrors the grouping in the iOS Settings
// app.

export interface SectionProps {
  title?: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, note, children }: SectionProps) {
  return (
    <div className="hc-section">
      {title && <div className="hc-section__title">{title}</div>}
      <div className="hc-section__body">{children}</div>
      {note && <div className="hc-section__note">{note}</div>}
    </div>
  );
}
