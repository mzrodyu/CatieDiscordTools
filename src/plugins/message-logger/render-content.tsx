// Render a stored message's raw content into React nodes.
//
// Discord custom-emoji markup — `<:name:id>` (static) or `<a:name:id>`
// (animated) — is stored verbatim in a message's content. Shown as plain text
// it reads as the raw token, so we split the string and swap each token for its
// CDN image, leaving surrounding text (and unicode emoji) untouched.
//
// Shared by the log page and the in-chat edit-history renderer so the two paths
// never drift — one parser, one `.hc-emoji` style.
//
// Optionally marks search hits. Highlighting has to happen HERE rather than in
// the log page, because the page never sees the plain-text runs: by the time it
// has nodes, the string has already been cut apart around emoji images. Doing it
// here also means a hit spanning an emoji boundary marks the text on both sides
// instead of being missed.

import { emojiCdnUrl } from "../../core/common/cdn";
import { splitHighlights } from "./search";

const EMOJI_TOKEN = /<(a)?:([A-Za-z0-9_]+):(\d+)>/g;

/** Text run, with search hits wrapped in <mark>. */
function textRun(text: string, highlight: RegExp | null | undefined, keyFrom: number): React.ReactNode[] {
  if (!highlight) return [<span key={keyFrom}>{text}</span>];
  return splitHighlights(text, highlight).map((run, i) =>
    run.hit ? (
      <mark key={`${keyFrom}-${i}`} className="hc-hit">
        {run.text}
      </mark>
    ) : (
      <span key={`${keyFrom}-${i}`}>{run.text}</span>
    )
  );
}

export function renderContent(content: string, highlight?: RegExp | null): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  // Fresh lastIndex each call; the regex is module-scoped and stateful.
  EMOJI_TOKEN.lastIndex = 0;
  for (let m = EMOJI_TOKEN.exec(content); m; m = EMOJI_TOKEN.exec(content)) {
    if (m.index > cursor) {
      parts.push(...textRun(content.slice(cursor, m.index), highlight, key++));
    }
    const [, animated, name, id] = m;
    parts.push(
      <img
        key={key++}
        className="hc-emoji"
        src={emojiCdnUrl(id, Boolean(animated), 48)}
        alt={`:${name}:`}
        title={`:${name}:`}
        draggable={false}
        loading="lazy"
      />
    );
    cursor = m.index + m[0].length;
  }
  // No tokens and nothing to mark: hand back the raw string so pre-wrap /
  // whitespace is preserved exactly as before.
  if (parts.length === 0 && !highlight) return content;
  if (cursor < content.length) {
    parts.push(...textRun(content.slice(cursor), highlight, key++));
  }
  return parts;
}
