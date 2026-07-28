// The floating card listing who reacted.
//
// Purely informational and non-interactive (the host is pointer-events: none),
// so it behaves like a tooltip: it can never swallow the click that would
// toggle your own reaction.

import { React, useState, useEffect } from "../../../core/common/react";
import {
  cachedReactors,
  emojiLabel,
  fetchReactors,
  type ReactionTarget,
  type Reactor
} from "../reactors";
import { settings } from "../settings";

type State =
  | { kind: "loading" }
  | { kind: "ready"; reactors: Reactor[] }
  | { kind: "error"; message: string };

function customEmojiUrl(emoji: ReactionTarget["emoji"]): string {
  const ext = emoji.animated ? "gif" : "webp";
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${ext}?size=32`;
}

function EmojiPreview({ emoji }: { emoji: ReactionTarget["emoji"] }): React.ReactElement {
  if (emoji.id) {
    return (
      <img
        className="hc-whoreacted__emoji-img"
        src={customEmojiUrl(emoji)}
        alt={emojiLabel(emoji)}
        width={18}
        height={18}
      />
    );
  }
  return <span className="hc-whoreacted__emoji-char">{emoji.name ?? ""}</span>;
}

export function ReactorCard({ target }: { target: ReactionTarget }): React.ReactElement {
  const s = settings.store;
  const [state, setState] = useState<State>(() => {
    const cached = cachedReactors(target);
    return cached ? ({ kind: "ready", reactors: cached } as State) : ({ kind: "loading" } as State);
  });

  // The card is mounted fresh for each hover, so a one-shot effect is exactly
  // the right lifetime here.
  useEffect(() => {
    let live = true;
    fetchReactors(target, s.maxUsers)
      .then((reactors) => {
        if (live) setState({ kind: "ready", reactors });
      })
      .catch((err: unknown) => {
        if (!live) return;
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : "未知错误";
        setState({ kind: "error", message });
      });
    return () => {
      live = false;
    };
  }, []);

  const shown = state.kind === "ready" ? state.reactors.slice(0, s.maxUsers) : [];
  const total = target.count ?? (state.kind === "ready" ? state.reactors.length : null);
  const hidden =
    state.kind === "ready" && total != null ? Math.max(0, total - shown.length) : 0;

  return (
    <div className="hc-whoreacted">
      <div className="hc-whoreacted__head">
        <EmojiPreview emoji={target.emoji} />
        <span className="hc-whoreacted__title">谁点了这个表情</span>
        {total != null && <span className="hc-whoreacted__count">{total}</span>}
      </div>

      {state.kind === "loading" && <div className="hc-whoreacted__hint">正在查询…</div>}

      {state.kind === "error" && (
        <div className="hc-whoreacted__hint hc-whoreacted__hint--error">
          查询失败：{state.message}
        </div>
      )}

      {state.kind === "ready" && shown.length === 0 && (
        <div className="hc-whoreacted__hint">没有人（可能刚刚被取消）</div>
      )}

      {shown.length > 0 && (
        <div className="hc-whoreacted__list">
          {shown.map((reactor) => (
            <div className="hc-whoreacted__row" key={reactor.id}>
              {s.showAvatars && reactor.avatarUrl && (
                <img
                  className="hc-whoreacted__avatar"
                  src={reactor.avatarUrl}
                  alt=""
                  width={20}
                  height={20}
                />
              )}
              <span className="hc-whoreacted__name">{reactor.name}</span>
              {reactor.bot && <span className="hc-whoreacted__tag">BOT</span>}
              {s.showIds && <span className="hc-whoreacted__id">{reactor.id}</span>}
            </div>
          ))}
          {hidden > 0 && <div className="hc-whoreacted__more">还有 {hidden} 人</div>}
        </div>
      )}
    </div>
  );
}
