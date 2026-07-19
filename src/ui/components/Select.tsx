// Compact dropdown select.
//
// Fully self-drawn (button + floating menu) so the open menu matches the
// iOS-style design language — a native <select> popup is OS chrome and can't
// be themed. The resting control is a pill button showing the current label;
// the menu is a rounded, elevated sheet with a checkmark on the active row.
// Keyboard: Enter/Space/ArrowDown open, arrows move, Enter picks, Esc closes.

const { useState, useRef, useEffect } = React;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  "aria-label"?: string;
}

export function Select({ value, options, onChange, ...rest }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  // Close on any outside pointer press (capture phase so Discord's own
  // stopPropagation-happy handlers can't swallow it).
  useEffect(() => {
    if (!open) return;
    const onPress = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (next: string) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0 && active < options.length) pick(options[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="hc-select" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="hc-select__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span className="hc-select__value">{current?.label ?? value}</span>
        <svg
          className="hc-select__chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          data-open={open}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="hc-select__menu" role="listbox">
          {options.map((opt, index) => (
            <button
              type="button"
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className="hc-select__option"
              data-active={index === active}
              data-selected={opt.value === value}
              onPointerEnter={() => setActive(index)}
              onClick={() => pick(opt.value)}
            >
              <span className="hc-select__optlabel">{opt.label}</span>
              {opt.value === value && (
                <svg
                  className="hc-select__check"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
