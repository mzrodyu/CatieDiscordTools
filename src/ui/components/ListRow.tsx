// List row.
//
// Leading colored icon tile, a title with optional subtitle, and an optional
// trailing accessory (a value, a control, a chevron). The whole row can be made
// pressable by passing `onClick`.

import { ChevronRightIcon } from "@halcyon/icons";

export interface ListRowProps {
  icon?: React.ReactNode;
  /**
   * Background of the icon tile. Pass a design token reference such as
   * `"var(--hc-accent)"`; never a raw color.
   */
  iconBackground?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  accessory?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function ListRow({
  icon,
  iconBackground,
  title,
  subtitle,
  accessory,
  onClick,
  showChevron
}: ListRowProps) {
  const interactive = typeof onClick === "function";

  return (
    <div
      className={interactive ? "hc-row hc-row--button" : "hc-row"}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {icon && (
        <div
          className="hc-row__icon"
          style={iconBackground ? { background: iconBackground } : undefined}
        >
          {icon}
        </div>
      )}

      <div className="hc-row__text">
        <div className="hc-row__title">{title}</div>
        {subtitle != null && subtitle !== false && (
          <div className="hc-row__subtitle">{subtitle}</div>
        )}
      </div>

      {accessory != null && accessory !== false && (
        <div className="hc-row__accessory">{accessory}</div>
      )}
      {showChevron && <ChevronRightIcon size={20} className="hc-row__chevron" />}
    </div>
  );
}
