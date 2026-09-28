// The "pick reactions from your servers" overlay.
//
// A self-contained overlay (createRoot into a div we append), the same shape as
// emote-cloner's server picker, so it doesn't lean on Discord's modal internals.
// It lists every custom emoji from the servers you're in, grouped by server,
// with a search box. Selection is by (name+id), so eight same-named "BAKA"s are
// eight separate tiles you can all pick — which is the whole point. "全选匹配"
// selects everything the current search matches, for exactly the wall-of-BAKA
// case.

import { React, mountDetached, useMemo, useState } from "../../../core/common/react";
import { injectStyles } from "../../../ui/inject-styles";
import { logger } from "../../../core/logger";
import { XmarkIcon, SearchIcon } from "@halcyon/icons";
import { collectGuildEmojis, emojiImageUrl, reactionKey, type ReactionEmoji } from "../emoji";

const log = logger("quick-react");

const STYLE_ID = "halcyon-quick-react";

const PICKER_CSS = `
.hc-qr-grid{display:flex;flex-wrap:wrap;gap:6px;padding:2px}
.hc-qr-guild{width:100%;margin:10px 2px 2px;font-size:12px;font-weight:600;opacity:.55}
.hc-qr-tile{position:relative;width:42px;height:42px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;background:var(--background-secondary,rgba(255,255,255,.04))}
.hc-qr-tile:hover{background:var(--background-modifier-hover,rgba(255,255,255,.08))}
.hc-qr-tile--sel{border-color:var(--brand-500,#5865f2)}
.hc-qr-tile img{width:28px;height:28px;object-fit:contain}
.hc-qr-tile__uni{font-size:24px;line-height:1}
.hc-qr-tile__badge{position:absolute;top:-5px;right:-5px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:var(--brand-500,#5865f2);color:#fff;font-size:10px;line-height:15px;text-align:center}
.hc-qr-note{opacity:.55;font-size:12px;padding:6px 2px}
.hc-qr-foot{display:flex;align-items:center;gap:8px;justify-content:flex-end;padding-top:10px}
.hc-qr-count{margin-right:auto;opacity:.7;font-size:13px}
.hc-qr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.hc-qr-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 6px 3px 5px;border-radius:8px;background:var(--background-secondary,rgba(255,255,255,.05));font-size:12px}
.hc-qr-chip img{width:18px;height:18px;object-fit:contain}
.hc-qr-chip__x{cursor:pointer;opacity:.5;display:inline-flex;align-items:center}
.hc-qr-chip__x:hover{opacity:1}
.hc-qr-add{display:flex;gap:8px;align-items:center;margin-top:6px}
.hc-qr-add .hc-input{flex:1}
`;

/** Inject the plugin's own styles (grid + chips) once, atop the shared sheet. */
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
  closeReactionPicker(); // never stack two

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

/** Cap on rendered tiles, so a huge emoji collection can't lock the modal. */
const MAX_TILES = 400;

function PickerModal({
  onAdd,
  onClose
}: {
  onAdd: (emojis: ReactionEmoji[]) => void;
  onClose: () => void;
}): React.ReactElement {
  const groups = useMemo(() => collectGuildEmojis(), []);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, ReactionEmoji>>({});

  const q = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => e.name.toLowerCase().includes(q)) }))
      .filter((g) => g.emojis.length > 0);
  }, [groups, q]);
  const matches = useMemo(() => filteredGroups.flatMap((g) => g.emojis), [filteredGroups]);
  const selectedCount = Object.keys(selected).length;

  const toggle = (e: ReactionEmoji): void => {
    const key = reactionKey(e);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = e;
      return next;
    });
  };
  const selectAllMatches = (): void =>
    setSelected((prev) => {
      const next = { ...prev };
      for (const e of matches) next[reactionKey(e)] = e;
      return next;
    });
  const confirm = (): void => {
    const list = Object.values(selected);
    if (list.length) onAdd(list);
    onClose();
  };

  let rendered = 0;

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
          <span className="hc-emote-picker__title">从服务器挑选反应表情</span>
          <button className="hc-emote-picker__close" onClick={onClose} aria-label="关闭">
            <XmarkIcon size={18} />
          </button>
        </div>

        <div className="hc-emote-picker__search">
          <SearchIcon size={16} className="hc-emote-picker__search-icon" />
          <input
            className="hc-input"
            placeholder="搜索表情名，比如 baka…"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </div>

        <div className="hc-emote-picker__list">
          {matches.length === 0 ? (
            <div className="hc-emote-picker__empty">
              {groups.length === 0
                ? "没读到服务器表情（先进几个有自定义表情的服务器）"
                : "没有匹配的表情"}
            </div>
          ) : (
            filteredGroups.map((g) => {
              if (rendered >= MAX_TILES) return null;
              const slice = g.emojis.slice(0, MAX_TILES - rendered);
              rendered += slice.length;
              return (
                <div key={g.guildId} className="hc-qr-grid">
                  <div className="hc-qr-guild">{g.guildName}</div>
                  {slice.map((e) => {
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
                        {url ? (
                          <img src={url} alt={e.name} />
                        ) : (
                          <span className="hc-qr-tile__uni">{e.name}</span>
                        )}
                        {sel && <span className="hc-qr-tile__badge">✓</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          {rendered >= MAX_TILES && (
            <div className="hc-qr-note">
              表情太多，只显示了前 {MAX_TILES} 个，用搜索缩小范围。
            </div>
          )}
        </div>

        <div className="hc-qr-foot">
          <span className="hc-qr-count">已选 {selectedCount} 个</span>
          <button
            className="hc-btn hc-btn--secondary hc-btn--sm"
            onClick={selectAllMatches}
            disabled={matches.length === 0}
          >
            全选匹配（{matches.length}）
          </button>
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
