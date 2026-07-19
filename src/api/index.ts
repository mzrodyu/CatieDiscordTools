// Public plugin API.
//
// This is the only module a plugin should import from. Everything reachable
// here is intended to be stable; anything not re-exported here is an internal
// detail and may change without notice.
//
// Usage:
//   import { definePlugin, defineSettings, modules, patcher, flux, ui, icons, log } from "@halcyon/api";

// --- Plugin authoring ------------------------------------------------------

export { definePlugin, isPlugin } from "../core/plugin";
export type {
  PluginDefinition,
  Plugin,
  Author,
  PluginCategory,
  SourcePatchSpec,
  Replacement,
  PluginPage,
  IconComponent
} from "../core/plugin";

// --- Settings --------------------------------------------------------------

export { defineSettings } from "../core/settings";
export type { Settings, BoundSettings } from "../core/settings";
export type {
  SettingType,
  SettingDefinition,
  SettingsSchema,
  SettingsValues,
  BooleanSetting,
  NumberSetting,
  StringSetting,
  SelectSetting,
  StringListSetting,
  CustomSetting
} from "../core/settings/types";

// --- Module location -------------------------------------------------------

import {
  find,
  findAll,
  findByProps,
  findBySource,
  findStore,
  waitFor,
  lazy
} from "../core/modules/webpack";

/** Locate Discord's Webpack modules by shape or source text, never by id. */
export const modules = {
  find,
  findAll,
  findByProps,
  findBySource,
  findStore,
  waitFor,
  lazy
} as const;

export type { ModuleFilter } from "../core/modules/webpack";

// --- Patching --------------------------------------------------------------

export { patcher } from "../core/patcher";
export type { Patcher, PatchContext, Unpatch } from "../core/patcher";

// --- Flux ------------------------------------------------------------------

export { flux } from "../core/flux";
export type { Flux, FluxAction, FluxListener, Unsubscribe } from "../core/flux";

// --- React & Discord internals --------------------------------------------

export {
  React,
  ReactDOM,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "../core/common/react";

/** Lazy handles to frequently-needed Discord modules (stores, actions, moment). */
export * as Discord from "../core/common/discord";

// --- UI & icons ------------------------------------------------------------

/** Shared, design-system components. Build every plugin UI from these. */
export * as ui from "../ui/components";

/** The single-color SVG icon set. No emoji, ever. */
export * as icons from "../icons";

// --- Logging ---------------------------------------------------------------

import { logger } from "../core/logger";

/** A logger scoped to "plugin". For a dedicated scope, use `createLogger`. */
export const log = logger("plugin");

/** Create a logger bound to your own scope, e.g. `createLogger("message-logger")`. */
export const createLogger = logger;

export type { Logger, LogLevel, LogEntry } from "../core/logger";
