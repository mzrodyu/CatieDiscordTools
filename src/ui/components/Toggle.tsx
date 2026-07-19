// Toggle switch.
//
// iOS-style: neutral track off, green track on, a knob that slides. Rendered as
// a real switch button so keyboard and assistive tech get proper semantics.

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Toggle({ checked, onChange, disabled, ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      className="hc-toggle"
      data-on={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <span className="hc-toggle__knob" />
    </button>
  );
}
