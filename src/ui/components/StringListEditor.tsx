// String-list editor.
//
// Add-and-remove list of short strings (ids, names). Entries are trimmed and
// de-duplicated; blanks are dropped.
//
// Rows are editable in place. They used to be `readOnly`, which is defensible
// for a list of pasted ids but not for anything you might want to correct — a
// long model name meant deleting the whole row and retyping it to fix one
// character.
//
// Two details make in-place editing actually work:
//
//  * the key is the INDEX, not the item. Keying by content changes the key on
//    every keystroke, so React unmounts and remounts the input and the caret
//    lands nowhere — the field would drop focus after each character typed.
//  * trimming and de-duplication happen on blur, not per keystroke. Normalising
//    while typing fights the typist: a leading space vanishes as it is typed,
//    and a value that briefly matches another entry would delete its own row
//    mid-word.

import { TrashIcon, PlusIcon } from "@halcyon/icons";
import { TextInput } from "./TextInput";
import { appendEntry, normalizeAt, removeAt, updateAt } from "./string-list-ops";

// Lazy hook wrapper, NOT `const {...} = React`: a top-level destructure
// snapshots the lazy proxy before Discord's React exists and yields undefined.
import { useState } from "../../core/common/react";

export interface StringListEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  itemPlaceholder?: string;
}

export function StringListEditor({ value, onChange, itemPlaceholder }: StringListEditorProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const next = appendEntry(value, draft);
    if (next) onChange(next);
    setDraft("");
  };

  return (
    <div className="hc-strlist">
      {value.map((item, index) => (
        <div className="hc-strlist__item" key={index}>
          <TextInput
            value={item}
            onChange={(next) => onChange(updateAt(value, index, next))}
            onBlur={() => onChange(normalizeAt(value, index))}
            placeholder={itemPlaceholder}
          />
          <button
            type="button"
            className="hc-iconbtn hc-iconbtn--danger"
            onClick={() => onChange(removeAt(value, index))}
            aria-label="移除"
          >
            <TrashIcon size={18} />
          </button>
        </div>
      ))}

      <div className="hc-strlist__add">
        <TextInput
          value={draft}
          onChange={setDraft}
          placeholder={itemPlaceholder ?? "添加一项"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          className="hc-iconbtn"
          onClick={commit}
          aria-label="添加"
          disabled={!draft.trim()}
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </div>
  );
}
