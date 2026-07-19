// Compact dropdown select.
//
// Fully self-drawn (button + floating menu) so the open menu matches the
// iOS-style design language — a native <select> popup is OS chrome and can't
// be themed. The resting control is a pill button showing the current label;
// the menu is a rounded, elevated sheet with a checkmark on the active row.
// Keyboard: Enter/Space/ArrowDown open, arrows move, Enter picks, Esc closes.
//
// The open menu renders through a portal to <body> with fixed positioning:
// settings cards clip their children (overflow:hidden for the rounded
// corners), so an in-place absolute menu gets cut off at the card edge.

// Lazy hook wrappers, NOT `const {...} = React`: a top-level destructure
// snapshots the lazy proxy before Discord's React exists and yields undefined.
import { useState, useRef, useEffect } from "../../core/common/react";
import { ReactDOM } from "../../core/common/react";

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
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Fixed-position coordinates for the portaled menu, derived from the button.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; width: number } | null>(null);

  const current = options.find((o) => o.value === value);

  // Close on any outside pointer press (capture phase so Discord's own
  // stopPropagation-happy handlers can't swallow it). The menu lives in a
  // portal, so check both the control and the menu subtree.
  useEffect(() => {
    if (!open) return;
    const onPress = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, [open]);

  // Any scroll or resize outside the menu shifts the anchor; close rather than
  // chase it (matches how iOS dismisses popovers).
  useEffect(() => {
    if (!open) return;
    const onMove = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const openMenu = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      // Estimated menu height (rows + padding), capped by the CSS max-height.
      const estimated = Math.min(280, options.length * 36 + 10);
      const below = rect.bottom + 6;
      // Flip above the button when the estimate would spill past the viewport.
      const top = below + estimated > window.innerHeight - 8 ? Math.max(8, rect.top - 6 - estimated) : below;
      setMenuPos({
        top,
        right: Math.max(8, window.innerWidth - rect.right),
        width: rect.width
      });
    }
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

      {open &&
        menuPos &&
        (ReactDOM.createPortal(
          <div
            // The portal target is <body>, outside .halcyon, so the design
            // tokens/styles need re-scoping here.
            className="halcyon"
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 10000 }}
            onKeyDown={onKeyDown}
          >
            <div className="hc-select__menu" role="listbox" style={{ minWidth: menuPos.width }}>
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
          </div>,
          document.body
        ) as React.ReactElement)}
    </div>
  );
}
