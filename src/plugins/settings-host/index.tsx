// Settings host.
//
// An internal, always-on plugin that surfaces Halcyon's own settings. It does
// two independent things so access never fully breaks:
//
//   1. Native embed — a source patch appends Halcyon's entries to Discord's
//      user-settings sidebar, so they sit beside the built-in ones. This is the
//      preferred experience but, like any load-time patch, it targets a shape
//      of Discord's code that can shift between client versions, so it is
//      written to no-op (never throw) whenever that shape moves.
//
//   2. Overlay — a self-contained panel opened with Ctrl/Cmd+Shift+H (or
//      HalcyonAPI.open()). This depends on nothing but React, so it is always
//      available even if the native embed fails to apply on a given build.
//
// Discord's settings sidebar has been rebuilt twice in the wild, so the embed
// carries a patch for each shape and only the one that matches a given client
// does anything:
//
//   - Current builds assemble the sidebar from a layout *builder*: some object
//     exposes `buildLayout()` returning an array of typed nodes
//     (SECTION > SIDEBAR_ITEM > PANEL > CATEGORY > CUSTOM), and the renderer
//     does `builder.buildLayout().map(...)`. We wrap that call and splice our
//     own SECTION in. This is the path that matters today.
//
//   - Older builds kept the section list behind `getPredicateSections()`. We
//     still patch it (defensively) for anyone on an older client.

import { definePlugin } from "../../core/plugin";
import { logger } from "../../core/logger";
import { findByProps } from "../../core/modules/webpack";
import { injectStyles } from "../../ui/inject-styles";
import { openSettings, closeSettings } from "../../ui/settings/overlay";
import { EmbeddedView } from "../../ui/settings/SettingsRoot";
import { SlidersIcon, ListIcon, InfoIcon, type IconProps } from "../../icons";

const log = logger("settings-host");

// ---------------------------------------------------------------------------
// Shared: the three views Halcyon contributes, plus a one-shot "it worked"
// diagnostic so a silent embed can be told apart from one that ran but placed
// its section somewhere unexpected.
// ---------------------------------------------------------------------------

function PluginsSection(): React.ReactElement {
  return <EmbeddedView tab="plugins" />;
}
function LogsSection(): React.ReactElement {
  return <EmbeddedView tab="logs" />;
}
function AboutSection(): React.ReactElement {
  return <EmbeddedView tab="about" />;
}

/** The three entries Halcyon adds, in sidebar order. */
interface Entry {
  key: string;
  title: string;
  Component: React.ComponentType;
  Icon: React.FC<IconProps>;
}

/**
 * Adapt one of our icons for Discord's sidebar renderer. The renderer calls
 * `createElement(node.icon, {...its own props})` — prop shapes we don't
 * control (`size` may be a token string, colors arrive under other names), so
 * drop them all and render at the sidebar's fixed 20px.
 */
function sidebarIcon(Icon: React.FC<IconProps>): React.FC {
  return function HalcyonSidebarIcon() {
    return <Icon size={20} />;
  };
}

const HALCYON_SECTION_KEY = "halcyon-section";

const ENTRIES: Entry[] = [
  { key: "halcyon-plugins", title: "插件", Component: PluginsSection, Icon: SlidersIcon },
  { key: "halcyon-logs", title: "日志", Component: LogsSection, Icon: ListIcon },
  { key: "halcyon-about", title: "关于", Component: AboutSection, Icon: InfoIcon }
];

let diagLogged = false;

// Native embed switch. The renderer contract was confirmed against a live
// layout probe (2026-07): useTitle returns a plain string (Discord's own call
// intl.string(...) already resolves to one), icon is an ordinary React function
// component, and the Component-bearing leaf is type 20. The Ctrl/Cmd+Shift+H
// overlay works regardless of this flag.
const INJECT_SECTION: boolean = true;

// ===========================================================================
// Current builds: the layout builder.
// ===========================================================================

/** A node in Discord's settings layout tree. Only the fields we set/read. */
interface LayoutNode {
  type: number;
  key?: string;
  useTitle?: () => string;
  useLabel?: () => string;
  icon?: unknown;
  buildLayout?: () => LayoutNode[];
  Component?: React.ComponentType;
  useSearchTerms?: () => string[];
}

/** The object the renderer calls `.buildLayout()` on. */
interface LayoutBuilder {
  key?: string;
  buildLayout(): LayoutNode[];
}

/** The numeric discriminants Discord tags each layout node with. */
interface LayoutTypes {
  SECTION: number;
  SIDEBAR_ITEM: number;
  PANEL: number;
  CATEGORY: number;
  CUSTOM: number;
}

// The values shipping clients use, a last resort if reading them off the live
// tree fails. NOTE the CUSTOM value: the exported enum labels the custom host
// "19", but on real builds the node that actually renders a React `Component`
// reports type 20. A wrong type hands our node to the wrong renderer — the
// cause of the `{locale, ast}` crash — so CUSTOM is read back from a live
// Component-bearing leaf (below) and this fallback matches what ships today.
const FALLBACK_LAYOUT_TYPES: LayoutTypes = {
  SECTION: 1,
  SIDEBAR_ITEM: 2,
  PANEL: 3,
  CATEGORY: 5,
  CUSTOM: 20
};

let layoutTypes: LayoutTypes | null = null;

/**
 * Resolve the layout-node type enum. Located by shape (the module exporting all
 * of SECTION/SIDEBAR_ITEM/PANEL/CUSTOM), so it survives id churn; cached after
 * the first hit. By the time the sidebar renders, this module is loaded.
 */
function getLayoutTypes(): LayoutTypes {
  if (layoutTypes) return layoutTypes;
  try {
    const found = findByProps("SECTION", "SIDEBAR_ITEM", "PANEL", "CUSTOM");
    if (found && typeof found.SECTION === "number") {
      layoutTypes = {
        SECTION: found.SECTION,
        SIDEBAR_ITEM: found.SIDEBAR_ITEM,
        PANEL: found.PANEL,
        CATEGORY: typeof found.CATEGORY === "number" ? found.CATEGORY : FALLBACK_LAYOUT_TYPES.CATEGORY,
        CUSTOM: found.CUSTOM
      };
      return layoutTypes;
    }
  } catch (err) {
    log.warn("could not resolve settings layout types; using fallback values", err);
  }
  return FALLBACK_LAYOUT_TYPES;
}

/** Children of a layout node, or [] if it has none or throws building them. */
function safeChildren(node: any): any[] {
  try {
    if (node && typeof node.buildLayout === "function") {
      const kids = node.buildLayout();
      if (Array.isArray(kids)) return kids;
    }
  } catch {
    // A builder that needs live render context yields nothing here; that's fine.
  }
  return [];
}

/**
 * Read the node-type discriminants straight off Discord's own layout by walking
 * one full branch: the top level is SECTION, its child SIDEBAR_ITEM, then
 * PANEL, then CATEGORY, and the first leaf carrying a `Component` is the CUSTOM
 * host we mount into. Reading these live (instead of trusting the exported
 * enum) is what keeps CUSTOM correct — the enum labels it 19 but the real
 * Component-bearing node is 20, and the wrong number is what crashed rendering.
 */
function resolveTypesFromLayout(layout: LayoutNode[]): LayoutTypes {
  const types: LayoutTypes = { ...FALLBACK_LAYOUT_TYPES };
  try {
    const first = Array.isArray(layout) ? layout[0] : undefined;
    if (first && typeof first.type === "number") types.SECTION = first.type;

    for (const section of layout) {
      for (const item of safeChildren(section)) {
        if (typeof item?.type !== "number") continue;
        types.SIDEBAR_ITEM = item.type;
        for (const panel of safeChildren(item)) {
          if (typeof panel?.type !== "number") continue;
          types.PANEL = panel.type;
          for (const category of safeChildren(panel)) {
            if (typeof category?.type !== "number") continue;
            types.CATEGORY = category.type;
            for (const leaf of safeChildren(category)) {
              if (leaf && typeof leaf.type === "number" && "Component" in leaf) {
                types.CUSTOM = leaf.type;
                return types; // one full branch resolves every level
              }
            }
          }
        }
      }
    }
  } catch (err) {
    log.warn("could not read layout types from the live tree; using fallbacks", err);
  }
  return types;
}

/**
 * Build one sidebar entry: a SIDEBAR_ITEM whose panel drills down through the
 * CATEGORY/CUSTOM nesting Discord expects, bottoming out at our React view.
 * Mirrors the nesting Discord's own entries use so ours renders identically.
 *
 * Contract confirmed against a live layout probe: `icon` is an ordinary React
 * function component (Discord's own profile item ships one), and `useTitle`
 * returns a plain string (`intl.string(...)` has already resolved by the time
 * Discord's own useTitle returns).
 */
function buildEntry(types: LayoutTypes, entry: Entry): LayoutNode {
  const panel: LayoutNode = {
    key: `${entry.key}-panel`,
    type: types.PANEL,
    useTitle: () => entry.title,
    buildLayout: () => [
      {
        key: `${entry.key}-category`,
        type: types.CATEGORY,
        buildLayout: () => [
          {
            key: `${entry.key}-custom`,
            type: types.CUSTOM,
            Component: entry.Component,
            useSearchTerms: () => [entry.title]
          }
        ]
      }
    ]
  };

  return {
    key: entry.key,
    type: types.SIDEBAR_ITEM,
    useTitle: () => entry.title,
    icon: sidebarIcon(entry.Icon),
    buildLayout: () => [panel]
  };
}

/**
 * Stringify a node's function-valued fields (whitespace-collapsed, truncated).
 * Reading Discord's own useTitle/icon bodies tells us what our nodes must
 * actually return — the piece we've been guessing at (plain string vs intl
 * message object).
 */
function fnSources(node: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "function") out[k] = String(v).replace(/\s+/g, " ").slice(0, 400);
    }
  }
  return out;
}

/**
 * Describe a layout node without rendering it: its `type` discriminant, `key`,
 * the fields it carries, and (a couple of levels deep) its children. Never
 * calls `use*` fields — those are React hooks and illegal to invoke here — but
 * does call the plain `buildLayout()` to walk the tree, guarded so a throw in
 * Discord's own builder is recorded rather than propagated.
 */
function describeNode(node: any, depth: number): unknown {
  if (!node || typeof node !== "object") return { raw: typeof node };

  const info: Record<string, unknown> = {
    key: node.key,
    type: node.type,
    fields: Object.keys(node)
  };

  if (depth > 0 && typeof node.buildLayout === "function") {
    try {
      const kids = node.buildLayout();
      if (Array.isArray(kids)) {
        info.children = kids.slice(0, 6).map((k) => describeNode(k, depth - 1));
      }
    } catch (err) {
      info.childrenError = String(err);
    }
  }
  return info;
}

/**
 * One-shot: snapshot the real shape of this client's settings layout and stash
 * it on `globalThis.__halcyonLayoutProbe` for `copy(__halcyonLayoutProbe)`.
 * This is the ground truth we match Halcyon's own nodes against.
 */
function probeLayoutOnce(layout: LayoutNode[]): void {
  if (diagLogged) return;
  diagLogged = true;
  try {
    const s0 = layout[0];
    const s1 = safeChildren(s0)[0];
    const s2 = safeChildren(s1)[0];
    const s3 = safeChildren(s2)[0];
    const s4 = safeChildren(s3)[0];
    const payload = {
      resolvedTypesFromEnum: getLayoutTypes(),
      resolvedTypesFromLive: resolveTypesFromLayout(layout),
      topLevelCount: layout.length,
      // The real function bodies Discord ships for one full branch: section ->
      // sidebar item -> panel -> category -> leaf. This is the ground truth for
      // what our own nodes must return (e.g. does useTitle yield a plain string
      // or an intl message object {locale, ast}?).
      sampleSources: {
        section: fnSources(s0),
        sidebarItem: fnSources(s1),
        panel: fnSources(s2),
        category: fnSources(s3),
        leaf: fnSources(s4)
      },
      layout: layout.slice(0, 12).map((n) => describeNode(n, 2))
    };
    (globalThis as Record<string, unknown>).__halcyonLayoutProbe = JSON.stringify(payload, null, 2);
    log.info(
      "[embed-probe] captured Discord's settings layout shape. " +
        "In the console run  copy(__halcyonLayoutProbe)  and paste the result back."
    );
  } catch (err) {
    log.warn("[embed-probe] failed to capture layout shape", err);
  }
}

// ===========================================================================
// Older builds: getPredicateSections.
// ===========================================================================

/** One entry in the legacy user-settings sidebar. */
interface LegacySection {
  section: string;
  label?: string;
  element?: React.ComponentType;
  className?: string;
}

/** Halcyon's legacy group: a header followed by its pages. */
function buildLegacySections(): LegacySection[] {
  return [
    { section: "HEADER", label: "HALCYON" },
    { section: "halcyon-plugins", label: "插件", element: PluginsSection },
    { section: "halcyon-logs", label: "日志", element: LogsSection },
    { section: "halcyon-about", label: "关于", element: AboutSection }
  ];
}

let onKeyDown: ((event: KeyboardEvent) => void) | null = null;

export default definePlugin({
  id: "halcyon-settings",
  name: "Halcyon 设置",
  description: "Halcyon 自身的设置界面宿主。",
  authors: [{ name: "caitemm" }],
  category: "misc",
  required: true,
  hidden: true,

  patches: [
    {
      // Current builds. The sidebar renderer maps over a layout array produced
      // by `<builder>.buildLayout()`; we hand that call to `buildLayout` below,
      // which calls the original and splices Halcyon's SECTION in. `.map` in
      // the lookahead pins us to the render call site (not the many nested
      // `buildLayout()` calls the tree makes internally).
      label: "user-settings-layout",
      find: ".buildLayout().map",
      replacement: {
        match: /([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,
        replace: "$self.buildLayout($1)"
      }
    },
    {
      // Older builds. `getPredicateSections(){return <expr>}` gates the whole
      // sidebar; we wrap its return value. The captured body may itself contain
      // braces (arrow predicates, object literals), so it is matched as a
      // balanced block and replayed inside an arrow IIFE — `this` stays lexical,
      // so `this.props...` inside still resolves.
      label: "user-settings-sidebar",
      find: "getPredicateSections",
      replacement: {
        match: /getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,
        replace: (_full: string, body: string) =>
          `getPredicateSections(){return $self.injectSections((()=>${body})())}`
      }
    }
  ],

  /**
   * Wrap the settings layout builder. Called from the patch with the object the
   * renderer was about to call `.buildLayout()` on; we call it ourselves, then
   * splice Halcyon's SECTION into the result.
   *
   * Defensive throughout: this feeds the entire settings pane, so any failure
   * falls through to the untouched layout rather than blanking it. Only the
   * root builder ("$Root") owns the sidebar — every panel and category runs its
   * own builder through here too, and those are left exactly as they were.
   */
  buildLayout(builder: LayoutBuilder): LayoutNode[] {
    const layout = builder.buildLayout();
    try {
      if (!builder || builder.key !== "$Root") return layout;
      if (!Array.isArray(layout)) return layout;

      // Record the real node shape once (kept for debugging; harmless).
      probeLayoutOnce(layout);

      if (!INJECT_SECTION) return layout;
      if (layout.some((n) => n?.key === HALCYON_SECTION_KEY)) return layout;

      // Read the type discriminants off THIS build's own nodes, not the enum:
      // the enum mislabels the React host (says 19, ships 20), and a wrong type
      // handed our node to the wrong renderer.
      const types = resolveTypesFromLayout(layout);
      const section: LayoutNode = {
        key: HALCYON_SECTION_KEY,
        type: types.SECTION,
        useTitle: () => "HALCYON",
        buildLayout: () => ENTRIES.map((entry) => buildEntry(types, entry))
      };

      // Sit just above the Nitro/billing block — the seam client mods
      // conventionally occupy — falling back to the account block, then a fixed
      // early slot, if those anchors ever move.
      let index = layout.findIndex((n) => n?.key === "billing_section");
      if (index < 0) index = layout.findIndex((n) => n?.key === "user_section");
      if (index < 0) index = Math.min(2, layout.length);

      layout.splice(index, 0, section);
      log.info(`native settings embed active — section inserted at index ${index}/${layout.length}`);
      return layout;
    } catch (err) {
      log.error("failed to inject settings section into layout", err);
      return layout;
    }
  },

  /**
   * Splice Halcyon's group into the legacy settings sidebar array and return
   * it. Called from the older-build patch with that build's section list.
   *
   * Placement: right after the first divider, the seam between the account
   * block and the rest. Defensive: a throw here would blank the whole pane, so
   * any failure returns the original array untouched.
   */
  injectSections(sections: LegacySection[]): LegacySection[] {
    try {
      if (!Array.isArray(sections)) return sections;
      // Guard against a base list that already carries our group (a reused
      // array). "halcyon-plugins" is the first page we insert.
      if (sections.some((s) => s?.section === "halcyon-plugins")) return sections;

      const mine = buildLegacySections();
      const out = sections.slice();

      const firstDivider = out.findIndex((s) => s && s.section === "DIVIDER");
      if (firstDivider >= 0) {
        // A header already sets our group apart, so no extra divider is needed.
        out.splice(firstDivider + 1, 0, ...mine);
      } else {
        // No divider found: fall back to the end, fenced off with one.
        out.push({ section: "DIVIDER" }, ...mine);
      }

      if (!diagLogged) {
        diagLogged = true;
        log.info(`native settings embed active (legacy) — ${sections.length} base sections`);
      }
      return out;
    } catch (err) {
      log.error("failed to inject settings sections", err);
      return sections;
    }
  },

  start() {
    injectStyles();

    onKeyDown = (event: KeyboardEvent) => {
      const combo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "KeyH";
      if (!combo) return;
      event.preventDefault();
      openSettings();
    };
    window.addEventListener("keydown", onKeyDown);

    log.info("settings host ready — open with Ctrl/Cmd+Shift+H");
  },

  stop() {
    if (onKeyDown) {
      window.removeEventListener("keydown", onKeyDown);
      onKeyDown = null;
    }
    closeSettings();
  }
});
