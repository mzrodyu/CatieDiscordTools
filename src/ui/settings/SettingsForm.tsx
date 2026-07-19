// Renders a plugin's settings schema into a grouped iOS-style form.
//
// Each declared setting becomes one cell. Boolean, number, and select settings
// sit on a single row with the control on the trailing edge; string, list, and
// custom settings stack their control beneath a label so they get full width.

import { Toggle } from "../components/Toggle";
import { NumberStepper } from "../components/NumberStepper";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { StringListEditor } from "../components/StringListEditor";
import { useSettingsSnapshot } from "./hooks";
import type { BoundSettings } from "../../core/settings";
import type { SettingDefinition } from "../../core/settings/types";

export function SettingsForm({ settings }: { settings: BoundSettings }): React.ReactElement | null {
  const store = useSettingsSnapshot(settings);
  const keys = Object.keys(settings.schema).filter((key) => !settings.schema[key].hidden);

  if (keys.length === 0) return null;

  return (
    <div className="hc-section">
      <div className="hc-section__title">设置</div>
      <div className="hc-section__body">
        {keys.map((key) => (
          <SettingField
            key={key}
            def={settings.schema[key]}
            value={store[key]}
            onChange={(next) => {
              store[key] = next;
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldProps {
  def: SettingDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}

function SettingField({ def, value, onChange }: FieldProps): React.ReactElement | null {
  const label = (
    <div className="hc-cell__main">
      <div className="hc-cell__label">{def.label}</div>
      {def.description && <div className="hc-cell__desc">{def.description}</div>}
    </div>
  );

  switch (def.type) {
    case "boolean":
      return (
        <div className="hc-cell hc-cell--row">
          {label}
          <Toggle
            checked={value === true}
            onChange={(next) => onChange(next)}
            disabled={def.disabled?.()}
            aria-label={def.label}
          />
        </div>
      );

    case "number":
      return (
        <div className="hc-cell hc-cell--row">
          {label}
          <NumberStepper
            value={typeof value === "number" ? value : def.default}
            onChange={(next) => onChange(next)}
            min={def.min}
            max={def.max}
            step={def.step}
          />
        </div>
      );

    case "select":
      return (
        <div className="hc-cell hc-cell--row">
          {label}
          <Select
            value={typeof value === "string" ? value : def.default}
            onChange={(next) => onChange(next)}
            options={def.options}
          />
        </div>
      );

    case "string":
      return (
        <div className="hc-cell">
          <div className="hc-cell--row">{label}</div>
          <div className="hc-cell__control">
            <TextInput
              value={typeof value === "string" ? value : ""}
              onChange={(next) => onChange(next)}
              placeholder={def.placeholder}
              maxLength={def.maxLength}
            />
          </div>
        </div>
      );

    case "string-list":
      return (
        <div className="hc-cell">
          {label}
          <div className="hc-cell__control">
            <StringListEditor
              value={Array.isArray(value) ? (value as string[]) : []}
              onChange={(next) => onChange(next)}
              itemPlaceholder={def.itemPlaceholder}
            />
          </div>
        </div>
      );

    case "custom": {
      const Custom = def.component;
      return (
        <div className="hc-cell">
          {label}
          <div className="hc-cell__control">
            <Custom value={value} onChange={onChange} />
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
