// String-list editor.
//
// Add-and-remove list of short strings (ids, names). Used for allow/ignore
// lists. Entries are trimmed and de-duplicated; blanks are dropped.

import { TrashIcon, PlusIcon } from "@halcyon/icons";
import { TextInput } from "./TextInput";

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
    const next = draft.trim();
    if (!next || value.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...value, next]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="hc-strlist">
      {value.map((item, index) => (
        <div className="hc-strlist__item" key={item}>
          <TextInput value={item} onChange={() => undefined} readOnly />
          <button
            type="button"
            className="hc-iconbtn hc-iconbtn--danger"
            onClick={() => removeAt(index)}
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
