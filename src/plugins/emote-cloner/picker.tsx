// Server picker modal for emote-cloner.
//
// Clicking the "复制到服务器" menu item opens this instead of showing a nested
// submenu: with many servers a submenu is easy to mis-click, and it can't show
// server icons. This is a self-contained overlay — the same approach the
// settings panel uses (createRoot into a div we append ourselves), so it
// doesn't depend on Discord's native modal internals — with a search box and a
// scrollable list of servers, each with its icon.
//
// After a server is picked it runs the clone inline and shows the result in the
// modal itself (copying / done / the real error message). This is deliberate:
// the toast module isn't present on every build, so relying on a toast for
// feedback meant a failed (or even successful) clone looked like "nothing
// happened". The modal always tells you what happened.

import { React, mountDetached, useState } from "../../core/common/react";
import { injectStyles } from "../../ui/inject-styles";
import { logger } from "../../core/logger";

const log = logger("emote-cloner");

export interface GuildInfo {
  id: string;
  name: string;
  /** Icon hash, or null when the server has no custom icon. */
  icon: string | null;
}

/** CDN url for a guild icon (animated hashes start with `a_`). */
function iconUrl(g: GuildInfo): string {
  const ext = g.icon && g.icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${ext}?size=64`;
}

let host: HTMLDivElement | null = null;
let unmount: (() => void) | null = null;
let keyHandler: ((event: KeyboardEvent) => void) | null = null;

export function closeGuildPicker(): void {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
  if (unmount) {
    try {
      unmount();
    } catch {
      // already torn down
    }
    unmount = null;
  }
  if (host) {
    host.remove();
    host = null;
  }
}

export function openGuildPicker(opts: {
  title: string;
  guilds: GuildInfo[];
  /** Runs the clone into the chosen guild. Its promise drives the modal status. */
  onPick: (guildId: string) => Promise<void> | void;
}): void {
  injectStyles();
  closeGuildPicker(); // never stack two pickers

  host = document.createElement("div");
  host.className = "halcyon";
  document.body.appendChild(host);

  keyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeGuildPicker();
  };
  document.addEventListener("keydown", keyHandler);

  try {
    unmount = mountDetached(
      React.createElement(PickerModal, {
        title: opts.title,
        guilds: opts.guilds,
        onPick: opts.onPick,
        onClose: closeGuildPicker
      }),
      host
    );
  } catch (err) {
    log.error("could not open guild picker", err);
    closeGuildPicker();
  }
}

type Status =
  | { state: "idle" }
  | { state: "working"; guild: string }
  | { state: "done"; guild: string }
  | { state: "error"; guild: string; message: string };

function PickerModal({
  title,
  guilds,
  onPick,
  onClose
}: {
  title: string;
  guilds: GuildInfo[];
  onPick: (guildId: string) => Promise<void> | void;
  onClose: () => void;
}): React.ReactElement {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const q = query.trim().toLowerCase();
  const filtered = q ? guilds.filter((g) => g.name.toLowerCase().includes(q)) : guilds;

  const pick = (g: GuildInfo): void => {
    setStatus({ state: "working", guild: g.name });
    Promise.resolve()
      .then(() => onPick(g.id))
      .then(() => {
        setStatus({ state: "done", guild: g.name });
        setTimeout(onClose, 1000);
      })
      .catch((err: any) => {
        log.error("clone failed", err);
        setStatus({ state: "error", guild: g.name, message: err?.message ?? String(err) });
      });
  };

  return (
    <div
      className="hc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && status.state !== "working") onClose();
      }}
    >
      <div className="hc-emote-picker">
        <div className="hc-emote-picker__head">
          <span className="hc-emote-picker__title">{title}</span>
          <button
            className="hc-emote-picker__close"
            onClick={onClose}
            aria-label="关闭"
            disabled={status.state === "working"}
          >
            ✕
          </button>
        </div>

        {status.state === "idle" ? (
          <>
            <div className="hc-emote-picker__search">
              <input
                className="hc-input"
                placeholder="搜索服务器…"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </div>

            <div className="hc-emote-picker__list">
              {filtered.length === 0 ? (
                <div className="hc-emote-picker__empty">
                  {guilds.length === 0 ? "没有可管理表情的服务器" : "没有匹配的服务器"}
                </div>
              ) : (
                filtered.map((g) => (
                  <div
                    key={g.id}
                    className="hc-emote-picker__item"
                    role="button"
                    tabIndex={0}
                    onClick={() => pick(g)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") pick(g);
                    }}
                  >
                    <div className="hc-emote-picker__icon">
                      {g.icon ? <img src={iconUrl(g)} alt="" /> : g.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hc-emote-picker__name">{g.name}</div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="hc-emote-picker__status" data-state={status.state}>
            <div className="hc-emote-picker__status-icon">
              {status.state === "working" ? "⏳" : status.state === "done" ? "✓" : "✕"}
            </div>
            <div className="hc-emote-picker__status-title">
              {status.state === "working"
                ? `正在复制到 ${status.guild}…`
                : status.state === "done"
                  ? `已复制到 ${status.guild}`
                  : "复制失败"}
            </div>
            {status.state === "error" && (
              <>
                <div className="hc-emote-picker__status-detail">{status.message}</div>
                <button
                  className="hc-btn hc-btn--secondary hc-btn--sm"
                  onClick={() => setStatus({ state: "idle" })}
                >
                  返回列表
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
