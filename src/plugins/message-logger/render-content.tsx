// Render a stored message's raw content into React nodes.
//
// Discord custom-emoji markup — `<:name:id>` (static) or `<a:name:id>`
// (animated) — is stored verbatim in a message's content. Shown as plain text
// it reads as the raw token, so we split the string and swap each token for its
// CDN image, leaving surrounding text (and unicode emoji) untouched.
//
// Shared by the log page and the in-chat edit-history renderer so the two paths
// never drift — one parser, one `.hc-emoji` style.

const EMOJI_TOKEN = /<(a)?:([A-Za-z0-9_]+):(\d+)>/g;

export function renderContent(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  // Fresh lastIndex each call; the regex is module-scoped and stateful.
  EMOJI_TOKEN.lastIndex = 0;
  for (let m = EMOJI_TOKEN.exec(content); m; m = EMOJI_TOKEN.exec(content)) {
    if (m.index > cursor) {
      parts.push(<span key={key++}>{content.slice(cursor, m.index)}</span>);
    }
    const [, animated, name, id] = m;
    parts.push(
      <img
        key={key++}
        className="hc-emoji"
        src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}`}
        alt={`:${name}:`}
        title={`:${name}:`}
        draggable={false}
        loading="lazy"
      />
    );
    cursor = m.index + m[0].length;
  }
  // No tokens: hand back the raw string so pre-wrap/whitespace is preserved.
  if (parts.length === 0) return content;
  if (cursor < content.length) {
    parts.push(<span key={key++}>{content.slice(cursor)}</span>);
  }
  return parts;
}
