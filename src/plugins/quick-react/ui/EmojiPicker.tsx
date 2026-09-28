// The "pick reactions from your servers" picker — rendered INLINE in the
// settings page, not as a floating overlay.
//
// Why inline: the settings surface holds a focus lock. A picker mounted on
// document.body sits outside that lock, so clicks on tiles work but the lock
// steals focus back from any <input> — you can't type in the search box. Living
// inside the settings React tree (like the manual-add field, which works) puts
// the search inputs inside the lock, so they focus normally.
//
// Two steps: a searchable server list, then that one server's emoji as a
// searchable grid. Selection is by (name+id) and PERSISTS across servers, so the
// same "BAKA" from several servers can be gathered and added together.

import { React, useMemo, useState } from "../../../core/common/react";
import { injectStyles } from "../../../ui/inject-styles";
import { ChevronLeftIcon } from "@halcyon/icons";
import {
  collectGuildEmojis,
  emojiImageUrl,
  guildIconUrl,
  reactionKey,
  type GuildEmojiGroup,
  type ReactionEmoji
} from "../emoji";

export const STYLE_ID = "halcyon-quick-react";

const PICKER_CSS = `
.hc-qr-inline{display:flex;flex-direction:column;max-height:340px;margin-top:8px;border:1px solid var(--hc-separator-opaque,rgba(255,255,255,.08));border-radius:8px;overflow:hidden;background:var(--hc-bg-secondary,rgba(0,0,0,.12))}
.hc-qr-inline-head{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--hc-separator-opaque,rgba(255,255,255,.08))}
.hc-qr-grid{display:flex;flex-wrap:wrap;gap:6px;padding:2px}
.hc-qr-tile{position:relative;width:42px;height:42px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;background:var(--background-secondary,rgba(255,255,255,.04))}
.hc-qr-tile:hover{background:var(--background-modifier-hover,rgba(255,255,255,.08))}
.hc-qr-tile--sel{border-color:var(--brand-500,#5865f2)}
.hc-qr-tile img{width:28px;height:28px;object-fit:contain}
.hc-qr-tile__uni{font-size:24px;line-height:1}
.hc-qr-tile__badge{position:absolute;top:-5px;right:-5px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:var(--brand-500,#5865f2);color:#fff;font-size:10px;line-height:15px;text-align:center}
.hc-qr-count{opacity:.7;font-size:13px}
.hc-qr-back{display:inline-flex;align-items:center;gap:4px;cursor:pointer;background:none;border:none;color:var(--hc-label-secondary,#b5bac1);font-size:13px;padding:0}
.hc-qr-guildcount{margin-left:auto;opacity:.5;font-size:12px}
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

type View = { mode: "guilds" } | { mode: "emojis"; guildId: string; guildName: string };

/** Inline picker. `onAdd` receives the chosen emoji when "添加" is pressed. */
export function ReactionPicker({
  onAdd
}: {
  onAdd: (emojis: ReactionEmoji[]) => void;
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
  const commit = (): void => {
    const list = Object.values(selected);
    if (list.length) {
      onAdd(list);
      setSelected({});
    }
  };
  const openGuild = (g: GuildEmojiGroup): void => {
    setEmojiQuery("");
    setView({ mode: "emojis", guildId: g.guildId, guildName: g.guildName });
  };
  const current = view.mode === "emojis" ? groups.find((g) => g.guildId === view.guildId) : undefined;

  return (
    <div className="hc-qr-inline">
      <div className="hc-qr-inline-head">
        {view.mode === "emojis" ? (
          <button className="hc-qr-back" onClick={() => setView({ mode: "guilds" })}>
            <ChevronLeftIcon size={16} /> 服务器
          </button>
        ) : (
          <span className="hc-qr-count">选服务器</span>
        )}
        <span className="hc-qr-count" style={{ marginLeft: "auto" }}>
          已选 {selectedCount}
        </span>
        <button
          className="hc-btn hc-btn--primary hc-btn--sm"
          onClick={commit}
          disabled={selectedCount === 0}
        >
          添加 {selectedCount} 个
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
      <div className="hc-qr-add" style={{ padding: "0 8px" }}>
        <span className="hc-qr-count">{filtered.length} 个</span>
        <button
          className="hc-btn hc-btn--secondary hc-btn--sm"
          onClick={() => addMany(filtered)}
          disabled={filtered.length === 0}
          style={{ marginLeft: "auto" }}
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
