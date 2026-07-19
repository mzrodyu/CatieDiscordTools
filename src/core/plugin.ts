// Plugin manifest and the `definePlugin` entry point.
//
// A plugin is a plain object describing itself plus optional lifecycle hooks.
// `definePlugin` is mostly an identity function with a typed signature and a
// couple of cheap sanity checks; the real work happens in the runtime, which
// reads these fields to wire everything up.

import type { BoundSettings } from "./settings";
import type { SettingsSchema } from "./settings/types";

export interface Author {
  name: string;
  /** Optional Discord user id, used only to link an author's profile. */
  id?: string;
}

export type PluginCategory =
  | "utility"
  | "chat"
  | "voice"
  | "appearance"
  | "privacy"
  | "developer"
  | "misc";

/** One source-level rewrite applied to a module's factory as it loads. */
export interface Replacement {
  /** Pattern to locate the code to change. */
  match: RegExp;
  /**
   * Replacement text or function. `$self` anywhere in a string replacement is
   * rewritten to a reference to this plugin's live instance.
   */
  replace: string | ((substring: string, ...groups: string[]) => string);
}

export interface SourcePatchSpec {
  /** Short human label; shown in the patch report and logs on failure. */
  label: string;
  /** Only modules whose factory source contains this are considered. */
  find: string | RegExp;
  /** One replacement, or several applied in order. */
  replacement: Replacement | Replacement[];
  /** Apply the match globally rather than once. Default false. */
  all?: boolean;
}

/** A dedicated page contributed to the settings area by a plugin. */
export interface PluginPage {
  title: string;
  icon: IconComponent;
  component: React.ComponentType;
}

/** The minimal shape every icon component conforms to (see src/icons). */
export type IconComponent = React.ComponentType<{
  size?: 16 | 20 | 24 | 28 | 32;
  className?: string;
  "aria-label"?: string;
}>;

export interface PluginDefinition<S extends SettingsSchema = SettingsSchema> {
  /** Globally unique, lowercase, dash-separated. Immutable once shipped. */
  id: string;
  name: string;
  description: string;
  authors: Author[];
  category: PluginCategory;

  /** Ids of other plugins that must be enabled for this one to run. */
  dependencies?: string[];
  /** Core plugins the user is not allowed to switch off. */
  required?: boolean;
  /** Keep out of the plugin list. For internal infrastructure plugins. */
  hidden?: boolean;

  settings?: BoundSettings<S>;
  patches?: SourcePatchSpec[];
  page?: PluginPage;

  /** Called when the plugin becomes active. Must be synchronous. */
  start?(): void;
  /** Called before deactivation. Must fully undo everything `start` did. */
  stop?(): void;

  /**
   * Any additional methods a plugin exposes for its own patches to call via
   * `$self`. Kept loose on purpose.
   */
  [extra: string]: unknown;
}

const BRAND = Symbol.for("halcyon.plugin");

export type Plugin<S extends SettingsSchema = SettingsSchema> = PluginDefinition<S> & {
  readonly [BRAND]: true;
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function definePlugin<S extends SettingsSchema>(
  definition: PluginDefinition<S>
): Plugin<S> {
  if (!ID_PATTERN.test(definition.id)) {
    throw new Error(
      `Halcyon: invalid plugin id "${definition.id}" — use lowercase words separated by single dashes.`
    );
  }
  if (!definition.authors?.length) {
    throw new Error(`Halcyon: plugin "${definition.id}" must list at least one author.`);
  }

  return Object.assign(definition, { [BRAND]: true as const });
}

export function isPlugin(value: unknown): value is Plugin {
  return typeof value === "object" && value !== null && (value as Record<PropertyKey, unknown>)[BRAND] === true;
}
