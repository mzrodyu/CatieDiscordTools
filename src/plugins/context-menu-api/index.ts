// Context-menu API host.
//
// An internal, always-on plugin that owns the source patch making
// `addContextMenuPatch(navId, cb)` work (see core/common/context-menu). One
// load-time patch on the single component that renders every menu: it starts by
// destructuring `let {navId:...} = props`, and we splice
// `props = $self._usePatchContextMenu(props)` in just before that, so our code
// runs on the props of every menu and can inject items.
//
// We deliberately do NOT capture Discord's internal menu-open arguments (which
// would need a second, broad patch injecting `arguments` into every `navId:`
// object literal — illegal inside class fields, which crashed unrelated
// modules). Callbacks read the clicked element from the DOM instead
// (getContextMenuTarget), which is both safer and a better fit for the
// "right-click the emoji" flow.
//
// Discord's code is minified to one line, so the pattern expands Vencord's `\i`
// shorthand to an explicit identifier class, since this build's patcher does
// not canonicalize `\i`.

import { definePlugin } from "../../core/plugin";
import { usePatchContextMenu } from "../../core/common/context-menu";

export default definePlugin({
  id: "context-menu-api",
  name: "右键菜单 API",
  description: "为其他插件提供向 Discord 右键菜单注入菜单项的能力。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "misc",
  required: true,
  hidden: true,

  patches: [
    {
      // The central menu component. Inject our hook at the very top of the
      // function body, right before it destructures navId out of its props.
      label: "context-menu central handler",
      find: "Menu API only allows Items",
      replacement: {
        match: /(?=let\{navId:)(?<=function [A-Za-z_$][\w$]*\(([A-Za-z_$][\w$]*)\).+?)/,
        replace: "$1=$self._usePatchContextMenu($1);"
      }
    }
  ],

  /** Called from the patched menu component with its props. */
  _usePatchContextMenu(props: any): any {
    return usePatchContextMenu(props);
  }
});
