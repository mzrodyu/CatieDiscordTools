// The "pick reactions from your servers" overlay — server first, then that
// server's emoji.
//
// A self-contained overlay (createRoot into a div we append), same shape as
// emote-cloner's picker. Step 1 is a searchable list of the servers you're in
// (icon + name + how many custom emoji). Step 2 is that one server's emoji as a
// grid — far fewer than the everything-at-once list, and searchable. Selection
// is by (name+id) and PERSISTS as you move between servers, so you can gather
// the same "BAKA" from several servers and add them all at once.

import { React, mountDetached, useMemo, useState } from "../../../core/common/react";
import { injectStyles } from "../../../ui/inject-styles";
import { logger } from "../../../core/logger";
import { XmarkIcon, ChevronLeftIcon } from "@halcyon/icons";
import {
  collectGuildEmojis,
  emojiImageUrl,
  guildIconUrl,
  reactionKey,
  type GuildEmojiGroup,
  type ReactionEmoji
} from "../emoji";

const log = logger("quick-react");

export const STYLE_ID = "halcyon-quick-react";

const PICKER_CSS = `
.hc-qr-grid{display:flex;flex-wrap:wrap;gap:6px;padding:2px}
.hc-qr-tile{position:relative;width:42px;height:42px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;background:var(--background-secondary,rgba(255,255,255,.04))}
.hc-qr-tile:hover{background:var(--background-modifier-hover,rgba(255,255,255,.08))}
.hc-qr-tile--sel{border-color:var(--brand-500,#5865f2)}
.hc-qr-tile img{width:28px;height:28px;object-fit:contain}
.hc-qr-tile__uni{font-size:24px;line-height:1}
.hc-qr-tile__badge{position:absolute;top:-5px;right:-5px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:var(--brand-500,#5865f2);color:#fff;font-size:10px;line-height:15px;text-align:center}
.hc-qr-note{opacity:.55;font-size:12px;padding:6px 2px}
.hc-qr-count{margin-right:auto;opacity:.7;font-size:13px}
.hc-qr-foot{display:flex;align-items:center;gap:8px;justify-content:flex-end;padding:10px var(--hc-space-4,16px)}
.hc-qr-guildcount{margin-left:auto;opacity:.5;font-size:12px}
.hc-qr-back{display:inline-flex;align-items:center;gap:4px;cursor:pointer;background:none;border:none;color:var(--hc-label-secondary,#b5bac1);font-size:13px;padding:0}
.hc-qr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.hc-qr-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 6px 3px 5px;border-radius:8px;background:var(--background-secondary,rgba(255,255,255,.05));font-size:12px}
.hc-qr-chip img{width:18px;height:18px;object-fit:contain}
.hc-qr-chip__x{cursor:pointer;opacity:.5;display:inline-flex;align-items:center}
.hc-qr-chip__x:hover{opacity:1}
.hc-qr-add{display:flex;gap:8px;align-items:center;margin-top:6px}
.hc-qr-add .hc-input{flex:1}
.hc-qr-msgbtn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;cursor:pointer;color:var(--interactive-normal,#b5bac1);border-radius:4px}
.hc-qr-msgbtn:hover{color:var(--interactive-hover,#dbdee1);background:var(--background-modifier-hover,rgba(255,255,255,.06))}
.hc-qr-msgbtn svg{width:20px;height:20px}
`;

/** Inject the plugin's own styles (grid + chips + hover button) once. */
export function ensureQuickReactStyles(): void {
  injectStyles();
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = PICKER_CSS;
  document.head.appendChild(style);
}

let host: HTMLDivElement | null = null;
let unmount: (() => void) | null = null;
let keyHandler: ((event: KeyboardEvent) => void) | null = null;

export function closeReactionPicker(): void {
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

/** Open the picker. `onAdd` gets the chosen emoji when the user confirms. */
export function openReactionPicker(onAdd: (emojis: ReactionEmoji[]) => void): void {
  ensureQuickReactStyles();
  closeReactionPicker();

  host = document.createElement("div");
  host.className = "halcyon";
  document.body.appendChild(host);

  keyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeReactionPicker();
  };
  document.addEventListener("keydown", keyHandler);

  try {
    unmount = mountDetached(
      React.createElement(PickerModal, { onAdd, onClose: closeReactionPicker }),
      host
    );
  } catch (err) {
    log.error("无法打开表情选择器", err);
    closeReactionPicker();
  }
}

type View = { mode: "guilds" } | { mode: "emojis"; guildId: string; guildName: string };

function PickerModal({
  onAdd,
  onClose
}: {
  onAdd: (emojis: ReactionEmoji[]) => void;
  onClose: () => void;
}): React.ReactElement {
  const groups = useMemo(() => collectGuildEmojis(), []);
  const [view, setView] = useState<View>({ mode: "guilds" });
  const [guildQuery, setGuildQuery] = useState("");
  const [emojiQuery, setEmojiQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, ReactionEmoji>>({});
  const selectedCount = Object.keys(selected).length;

  const toggle = (e: ReactionEmoji): void =>
    setSelected((prev) => {
      const next = { ...prev };
      const key = reactionKey(e);
      if (next[key]) delete next[key];
      else next[key] = e;
      return next;
    });
  const addMany = (list: ReactionEmoji[]): void =>
    setSelected((prev) => {
      const next = { ...prev };
      for (const e of list) next[reactionKey(e)] = e;
      return next;
    });
  const confirm = (): void => {
    const list = Object.values(selected);
    if (list.length) onAdd(list);
    onClose();
  };
  const openGuild = (g: GuildEmojiGroup): void => {
    setEmojiQuery("");
    setView({ mode: "emojis", guildId: g.guildId, guildName: g.guildName });
  };

  const current = view.mode === "emojis" ? groups.find((g) => g.guildId === view.guildId) : undefined;

  return (
    <div
      className="hc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="挑选反应表情"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hc-emote-picker">
        <div className="hc-emote-picker__head">
          {view.mode === "emojis" ? (
            <button className="hc-qr-back" onClick={() => setView({ mode: "guilds" })}>
              <ChevronLeftIcon size={16} /> 服务器
            </button>
          ) : (
            <span className="hc-emote-picker__title">挑选反应表情</span>
          )}
          <button className="hc-emote-picker__close" onClick={onClose} aria-label="关闭">
            <XmarkIcon size={18} />
          </button>
        </div>

        {view.mode === "guilds" ? (
          <GuildList groups={groups} query={guildQuery} setQuery={setGuildQuery} onOpen={openGuild} />
        ) : (
          <EmojiList
            group={current}
            guildName={view.guildName}
            query={emojiQuery}
            setQuery={setEmojiQuery}
            selected={selected}
            toggle={toggle}
            addMany={addMany}
          />
        )}

        <div className="hc-qr-foot">
          <span className="hc-qr-count">已选 {selectedCount} 个</span>
          <button
            className="hc-btn hc-btn--primary hc-btn--sm"
            onClick={confirm}
            disabled={selectedCount === 0}
          >
            添加 {selectedCount} 个
          </button>
        </div>
      </div>
    </div>
  );
}

function GuildList({
  groups,
  query,
  setQuery,
  onOpen
}: {
  groups: GuildEmojiGroup[];
  query: string;
  setQuery: (v: string) => void;
  onOpen: (g: GuildEmojiGroup) => void;
}): React.ReactElement {
  const q = query.trim().toLowerCase();
  const filtered = q ? groups.filter((g) => g.guildName.toLowerCase().includes(q)) : groups;
  return (
    <>
      <div className="hc-emote-picker__search">
        <input
          className="hc-input"
          placeholder="搜索服务器…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </div>
      <div className="hc-emote-picker__list">
        {filtered.length === 0 ? (
          <div className="hc-emote-picker__empty">
            {groups.length === 0 ? "没读到服务器表情（先进几个有自定义表情的服务器）" : "没有匹配的服务器"}
          </div>
        ) : (
          filtered.map((g) => {
            const icon = guildIconUrl(g.guildId, g.guildIcon, 48);
            return (
              <div
                key={g.guildId}
                className="hc-emote-picker__item"
                role="button"
                tabIndex={0}
                onClick={() => onOpen(g)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onOpen(g);
                }}
              >
                <div className="hc-emote-picker__icon">
                  {icon ? <img src={icon} alt="" /> : g.guildName.charAt(0).toUpperCase()}
                </div>
                <div className="hc-emote-picker__name">{g.guildName}</div>
                <span className="hc-qr-guildcount">{g.emojis.length}</span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function EmojiList({
  group,
  guildName,
  query,
  setQuery,
  selected,
  toggle,
  addMany
}: {
  group: GuildEmojiGroup | undefined;
  guildName: string;
  query: string;
  setQuery: (v: string) => void;
  selected: Record<string, ReactionEmoji>;
  toggle: (e: ReactionEmoji) => void;
  addMany: (list: ReactionEmoji[]) => void;
}): React.ReactElement {
  const emojis = group?.emojis ?? [];
  const q = query.trim().toLowerCase();
  const filtered = q ? emojis.filter((e) => e.name.toLowerCase().includes(q)) : emojis;
  return (
    <>
      <div className="hc-emote-picker__search">
        <input
          className="hc-input"
          placeholder={`在 ${guildName} 里搜…`}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </div>
      <div className="hc-qr-add">
        <span className="hc-qr-count">{filtered.length} 个</span>
        <button
          className="hc-btn hc-btn--secondary hc-btn--sm"
          onClick={() => addMany(filtered)}
          disabled={filtered.length === 0}
        >
          全选这些
        </button>
      </div>
      <div className="hc-emote-picker__list">
        {filtered.length === 0 ? (
          <div className="hc-emote-picker__empty">没有匹配的表情</div>
        ) : (
          <div className="hc-qr-grid">
            {filtered.map((e) => {
              const key = reactionKey(e);
              const url = emojiImageUrl(e, 40);
              const sel = Boolean(selected[key]);
              return (
                <div
                  key={key}
                  className={`hc-qr-tile${sel ? " hc-qr-tile--sel" : ""}`}
                  role="button"
                  tabIndex={0}
                  title={`:${e.name}:`}
                  onClick={() => toggle(e)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") toggle(e);
                  }}
                >
                  {url ? <img src={url} alt={e.name} /> : <span className="hc-qr-tile__uni">{e.name}</span>}
                  {sel && <span className="hc-qr-tile__badge">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
