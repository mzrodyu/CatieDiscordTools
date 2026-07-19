// show-username — display the account username next to the server nickname.
//
// Discord shows only the per-server nickname (or global display name) on
// messages, so two people with lookalike nicks are hard to tell apart — the
// classic impersonation trick. This patches the message header's username
// node to append the true account name, in one of several styles.
//
// The patch targets the message-header module (the one containing
// `="SYSTEM_TAG"`): the header renders `children: <nick>` for the
// username hook; we swap that expression for our renderer, keeping the
// original reachable as a fallback prop.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { logger } from "../../core/logger";

const log = logger("show-username");

const settings = defineSettings({
  mode: {
    type: "select",
    default: "nick-user",
    label: "显示方式",
    description: "昵称与用户名的排列。",
    options: [
      { value: "nick-user", label: "昵称在前，用户名在后" },
      { value: "user-nick", label: "用户名在前，昵称在后" },
      { value: "user-only", label: "只显示用户名" }
    ]
  },
  style: {
    type: "select",
    default: "muted",
    label: "用户名样式",
    description: "附加的用户名部分的视觉样式。",
    options: [
      { value: "muted", label: "灰色小字" },
      { value: "pill", label: "圆角胶囊" },
      { value: "at", label: "@ 前缀" },
      { value: "paren", label: "括号包裹" }
    ]
  },
  hideWhenSame: {
    type: "boolean",
    default: true,
    label: "昵称相同时隐藏",
    description: "昵称与用户名一致时不重复显示。"
  },
  inReplies: {
    type: "boolean",
    default: false,
    label: "回复预览中也显示",
    description: "在回复引用的小字条中也附加用户名。"
  }
});

/** The props Discord's message-header username hook receives. */
interface UsernameProps {
  author?: { nick?: string };
  message?: { author?: { username?: string; globalName?: string } };
  userOverride?: { username?: string; globalName?: string };
  isRepliedMessage?: boolean;
  withMentionPrefix?: boolean;
}

function Username(props: { original: UsernameProps }): React.ReactElement {
  const { original } = props;
  const s = settings.store;
  const user = original.userOverride ?? original.message?.author;
  const username = user?.username;
  const nick = original.author?.nick ?? user?.globalName ?? username ?? "";
  const prefix = original.withMentionPrefix ? "@" : "";

  try {
    if (!username) return <>{prefix}{nick}</>;
    if (original.isRepliedMessage && !s.inReplies) return <>{prefix}{nick}</>;
    if (s.hideWhenSame && username.toLowerCase() === nick.toLowerCase()) return <>{prefix}{nick}</>;

    const suffixClass = `hc-username hc-username--${s.style || "muted"}`;
    const decorated =
      s.style === "at" ? `@${username}` : s.style === "paren" ? `（${username}）` : username;

    if (s.mode === "user-only") {
      return (
        <>
          {prefix}
          {username}
        </>
      );
    }
    if (s.mode === "user-nick") {
      return (
        <>
          {prefix}
          {username} <span className={suffixClass}>{nick}</span>
        </>
      );
    }
    // nick-user (default)
    return (
      <>
        {prefix}
        {nick} <span className={suffixClass}>{decorated}</span>
      </>
    );
  } catch (err) {
    log.error("username render failed; falling back to the nick", err);
    return <>{prefix}{nick}</>;
  }
}

export default definePlugin({
  id: "show-username",
  name: "显示用户名",
  description: "在昵称旁边显示账号用户名，防止改名冒充，支持多种样式。",
  authors: [{ name: "halcyon" }],
  category: "appearance",

  settings,

  patches: [
    {
      // The message-header module (find string survives minification). The
      // username hook renders `children: <ternary>`; capturing that whole
      // expression is fragile (nested commas/parens — a truncated capture
      // produced unbalanced code), so instead our render becomes the new
      // `children` and the original expression is parked, syntactically
      // intact, under a dummy `_hcOld` prop.
      label: "message header username",
      find: '="SYSTEM_TAG"',
      replacement: {
        match: /(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,
        replace: "$self.renderUsername(arguments[0]),_hcOld:$1?"
      }
    }
  ],

  start() {
    log.info("appending usernames to message headers");
  },

  stop() {
    // Source patch only; nothing to undo at runtime (restart clears it).
  },

  /** Called from the patch with the header component's props. */
  renderUsername(props: UsernameProps): React.ReactNode {
    try {
      return <Username original={props} />;
    } catch {
      return props?.author?.nick ?? null;
    }
  }
});
