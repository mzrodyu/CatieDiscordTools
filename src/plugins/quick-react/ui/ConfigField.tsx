// The settings control for the reaction list.
//
// Rendered by the settings form as the `custom` field for `reactions`. Shows the
// configured reactions as chips (image + name, each removable), a button that
// opens the server emoji picker, and a small manual box for typing a unicode
// emoji or a `<:name:id>` token. De-dup is by (name+id), so the same "BAKA" from
// different servers all stay — that's the point.

import { React, useState } from "../../../core/common/react";
import { Button, TextInput } from "@halcyon/ui";
import { TrashIcon, XmarkIcon, ReactionIcon } from "@halcyon/icons";
import { emojiImageUrl, parseManualEmoji, reactionKey, type ReactionEmoji } from "../emoji";
import { ensureQuickReactStyles, ReactionPicker } from "./EmojiPicker";

/** Append `additions` to `list`, dropping ones already present by key. */
function merge(list: ReactionEmoji[], additions: ReactionEmoji[]): ReactionEmoji[] {
  const have = new Set(list.map(reactionKey));
  const out = list.slice();
  for (const e of additions) {
    const key = reactionKey(e);
    if (!have.has(key)) {
      have.add(key);
      out.push(e);
    }
  }
  return out;
}

export function ReactionConfigField({
  value,
  onChange
}: {
  value: ReactionEmoji[];
  onChange: (value: ReactionEmoji[]) => void;
}): React.ReactElement {
  ensureQuickReactStyles();
  const list = Array.isArray(value) ? value : [];
  const [manual, setManual] = useState("");
  const [picking, setPicking] = useState(false);

  const removeAt = (index: number): void => onChange(list.filter((_, i) => i !== index));

  const addManual = (): void => {
    const parsed = parseManualEmoji(manual);
    if (parsed) onChange(merge(list, [parsed]));
    setManual("");
  };

  return (
    <div>
      {list.length > 0 ? (
        <div className="hc-qr-chips">
          {list.map((e, i) => {
            const url = emojiImageUrl(e, 24);
            return (
              <span className="hc-qr-chip" key={`${reactionKey(e)}-${i}`}>
                {url ? <img src={url} alt={e.name} /> : <span>{e.name}</span>}
                <span>{e.name}</span>
                <span
                  className="hc-qr-chip__x"
                  role="button"
                  tabIndex={0}
                  aria-label="移除"
                  onClick={() => removeAt(i)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") removeAt(i);
                  }}
                >
                  <XmarkIcon size={14} />
                </span>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="hc-qr-note">还没配置反应。点下面从服务器挑，或手动填一个。</div>
      )}

      <div className="hc-qr-add">
        <TextInput
          value={manual}
          onChange={setManual}
          placeholder="😀 或 <:name:id>"
          onKeyDown={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              addManual();
            }
          }}
        />
        <Button size="sm" variant="secondary" onClick={addManual} disabled={!manual.trim()}>
          添加
        </Button>
      </div>

      <div className="hc-qr-add">
        <Button size="sm" variant={picking ? "secondary" : "primary"} onClick={() => setPicking((p) => !p)}>
          <ReactionIcon size={16} /> {picking ? "收起" : "从服务器挑选"}
        </Button>
        {list.length > 0 && (
          <Button size="sm" variant="destructive" onClick={() => onChange([])}>
            <TrashIcon size={16} /> 清空
          </Button>
        )}
      </div>

      {picking && <ReactionPicker onAdd={(picked) => onChange(merge(list, picked))} />}
    </div>
  );
}
