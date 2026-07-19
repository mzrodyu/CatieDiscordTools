// Setting schema types.
//
// A plugin declares its configuration as a flat schema. The runtime turns that
// schema into (a) a reactive value store and (b) a rendered settings form, so a
// plugin never has to build its own settings UI.

import type { FC } from "react";

export type SettingType =
  | "boolean"
  | "number"
  | "string"
  | "select"
  | "string-list"
  | "custom";

interface CommonFields<T> {
  /** Short label shown as the row title. */
  label: string;
  /** Optional one-line explanation shown beneath the control. */
  description?: string;
  /** Value used before the user changes anything. */
  default: T;
  /**
   * Section header this setting renders under. Consecutive settings sharing a
   * group become one iOS-style grouped card; settings without a group go into
   * the default "设置" card. Declaration order is preserved.
   */
  group?: string;
  /** Hide from the generated form (still readable/writable in code). */
  hidden?: boolean;
  /** When it returns true, the control renders disabled. */
  disabled?: () => boolean;
}

export interface BooleanSetting extends CommonFields<boolean> {
  type: "boolean";
}

export interface NumberSetting extends CommonFields<number> {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface StringSetting extends CommonFields<string> {
  type: "string";
  placeholder?: string;
  maxLength?: number;
}

export interface SelectSetting extends CommonFields<string> {
  type: "select";
  options: ReadonlyArray<{ value: string; label: string }>;
}

export interface StringListSetting extends CommonFields<string[]> {
  type: "string-list";
  itemPlaceholder?: string;
}

export interface CustomSetting<T = unknown> extends CommonFields<T> {
  type: "custom";
  component: FC<{ value: T; onChange: (value: T) => void }>;
}

export type SettingDefinition =
  | BooleanSetting
  | NumberSetting
  | StringSetting
  | SelectSetting
  | StringListSetting
  | CustomSetting<any>;

export type SettingsSchema = Record<string, SettingDefinition>;

/**
 * The runtime value type for a single setting. Derived from `type` rather than
 * from `default`, because an empty-array default (`[]`) would otherwise infer
 * as `never[]` and break list operations.
 */
type ValueOf<D extends SettingDefinition> = D extends StringListSetting
  ? string[]
  : D extends BooleanSetting
    ? boolean
    : D extends NumberSetting
      ? number
      : D extends StringSetting | SelectSetting
        ? string
        : D extends CustomSetting<infer T>
          ? T
          : D["default"];

/** The value-object shape implied by a schema. */
export type SettingsValues<S extends SettingsSchema> = {
  [K in keyof S]: ValueOf<S[K]>;
};
