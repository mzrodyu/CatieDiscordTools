// Number stepper.
//
// A minus/value/plus control for bounded integers. Values clamp to [min, max];
// the corresponding button disables at each end.

import { MinusIcon, PlusIcon } from "@halcyon/icons";

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function clamp(value: number, min?: number, max?: number): number {
  if (min != null && value < min) return min;
  if (max != null && value > max) return max;
  return value;
}

export function NumberStepper({ value, onChange, min, max, step = 1 }: NumberStepperProps) {
  const atMin = min != null && value <= min;
  const atMax = max != null && value >= max;

  return (
    <div className="hc-stepper">
      <button
        type="button"
        className="hc-stepper__btn"
        onClick={() => onChange(clamp(value - step, min, max))}
        disabled={atMin}
        aria-label="减少"
      >
        <MinusIcon size={16} />
      </button>
      <span className="hc-stepper__value">{value}</span>
      <button
        type="button"
        className="hc-stepper__btn"
        onClick={() => onChange(clamp(value + step, min, max))}
        disabled={atMax}
        aria-label="增加"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
