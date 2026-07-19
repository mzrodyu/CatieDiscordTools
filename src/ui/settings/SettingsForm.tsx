// Renders a plugin's settings schema into grouped iOS-style form cards.
//
// The form is edit-then-save: changes accumulate in a local draft and only
// reach the persisted store when the user presses 保存. A sticky action bar
// appears while the draft differs from what's saved, offering 保存 and 放弃.
// (The store itself still saves synchronously on write — the draft layer is
// purely a UI affordance, so nothing is lost if the panel is closed abruptly
// after a save.)

import { useEffect, useMemo, useState } from "../../core/common/react";
import { Toggle } from "../components/Toggle";
import { NumberStepper } from "../components/NumberStepper";
import { TextInput } from "../components/TextInput";
import { Select } from "../components/Select";
import { StringListEditor } from "../components/StringListEditor";
import { Button } from "../components/Button";
import { useSettingsSnapshot } from "./hooks";
import type { BoundSettings } from "../../core/settings";
import type { SettingDefinition } from "../../core/settings/types";

function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function SettingsForm({ settings }: { settings: BoundSettings }): React.ReactElement | null {
  // Snapshot forces a re-render if the store changes underneath us (e.g. a
  // reset elsewhere); we reseed the draft from it when that happens.
  const store = useSettingsSnapshot(settings);
  const keys = useMemo(
    () => Object.keys(settings.schema).filter((key) => !settings.schema[key].hidden),
    [settings]
  );

  const [draft, setDraft] = useState<Record<string, unknown>>(() => seed(store, keys));

  // Reseed when switching to a different plugin's settings.
  useEffect(() => {
    setDraft(seed(store, keys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  if (keys.length === 0) return null;

  const dirty = keys.filter((key) => !equal(draft[key], store[key]));

  const save = () => {
    for (const key of dirty) store[key] = clone(draft[key]);
  };
  const discard = () => setDraft(seed(store, keys));

  // Split into consecutive runs sharing a `group`, each run one grouped card.
  const sections: Array<{ title: string; keys: string[] }> = [];
  for (const key of keys) {
    const title = settings.schema[key].group ?? "设置";
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.keys.push(key);
    else sections.push({ title, keys: [key] });
  }

  return (
    <>
      {sections.map((section, index) => (
        <div className="hc-section" key={`${section.title}-${index}`}>
          <div className="hc-section__title">{section.title}</div>
          <div className="hc-section__body">
            {section.keys.map((key) => (
              <SettingField
                key={key}
                def={settings.schema[key]}
                value={draft[key]}
                onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              />
            ))}
          </div>
        </div>
      ))}

      {dirty.length > 0 && (
        <div className="hc-savebar">
          <span className="hc-savebar__label">有 {dirty.length} 项未保存的修改</span>
          <div className="hc-savebar__actions">
            <Button size="sm" variant="plain" onClick={discard}>
              放弃
            </Button>
            <Button size="sm" variant="primary" onClick={save}>
              保存
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function seed(store: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = clone(store[key]);
  return out;
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
