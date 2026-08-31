// The preview panel: one message row, as it will appear once sent.
//
// Rendered as a real message line (avatar, display name, timestamp, body)
// because that is the question being asked — "发出去之后长什么样" — and a bare
// content bubble answers a narrower one.
//
// Below it, when and only when they differ, the literal text that will go on the
// wire. That block is not decoration: 假 Nitro rewrites locked emoji into CDN
// links, so for cross-server or animated emoji the rendered row and the
// transmitted text are genuinely different things, and a preview that showed
// only the former would be lying by omission.

import { React } from "../../../core/common/react";
import { UserStore } from "../../../core/common/discord";
import { avatarCdnUrl } from "../../../core/common/cdn";
import { runtime } from "../../../core/runtime";
import { renderMessageContent } from "../render";
import { settings } from "../settings";

interface Props {
  content: string;
  channelId: string | undefined;
}

function displayName(user: any): string {
  return (
    (typeof user?.globalName === "string" && user.globalName) ||
    (typeof user?.global_name === "string" && user.global_name) ||
    (typeof user?.username === "string" && user.username) ||
    "你"
  );
}

/**
 * What 假 Nitro will actually transmit. Asked through the live plugin instance
 * rather than reimplemented here, so the two can never drift; skipped entirely
 * when the plugin is off, because then nothing rewrites anything.
 */
function outgoingText(channelId: string | undefined, content: string): string {
  if (!channelId) return content;
  try {
    if (!runtime.isEnabled("fake-nitro")) return content;
    const plugin = runtime.getPlugin("fake-nitro") as { previewOutgoing?: (c: string, t: string) => string } | undefined;
    const preview = plugin?.previewOutgoing?.(channelId, content);
    return typeof preview === "string" ? preview : content;
  } catch {
    return content;
  }
}

export function PreviewPanel({ content, channelId }: Props): React.ReactElement {
  const user = (() => {
    try {
      return UserStore.getCurrentUser?.();
    } catch {
      return undefined;
    }
  })();

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return (
      <div className="hc-preview">
        <div className="hc-preview__empty">还没输入内容</div>
      </div>
    );
  }

  const name = displayName(user);
  const avatar = user?.id ? avatarCdnUrl(String(user.id), user.avatar, 40) : undefined;
  const outgoing = settings.store.showRawOutgoing ? outgoingText(channelId, content) : content;
  const rewritten = outgoing !== content;

  return (
    <div className="hc-preview">
      <div className="hc-preview__row">
        {avatar ? (
          <img className="hc-preview__avatar" src={avatar} alt="" width={40} height={40} draggable={false} />
        ) : (
          <div className="hc-preview__avatar hc-preview__avatar--blank" />
        )}
        <div className="hc-preview__main">
          <div className="hc-preview__head">
            <span className="hc-preview__name">{name}</span>
            <span className="hc-preview__time">刚刚</span>
          </div>
          <div className="hc-preview__body">{renderMessageContent(content, channelId)}</div>
        </div>
      </div>

      {rewritten ? (
        <div className="hc-preview__raw">
          <div className="hc-preview__raw-title">假 Nitro 会把它改写成：</div>
          <code className="hc-preview__raw-text">{outgoing}</code>
        </div>
      ) : null}
    </div>
  );
}
