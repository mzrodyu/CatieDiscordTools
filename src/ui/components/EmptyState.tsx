// Empty state.
//
// Centered icon, title, optional subtitle, and optional action. Shown when a
// list has nothing in it yet.

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="hc-empty">
      {icon}
      <div className="hc-empty__title">{title}</div>
      {subtitle && <div className="hc-empty__subtitle">{subtitle}</div>}
      {action && <div style={{ marginTop: "var(--hc-space-5)" }}>{action}</div>}
    </div>
  );
}
