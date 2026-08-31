// Building the tail text.
//
// Everything here is pure: template in, string out. That keeps the send hook
// trivial and lets the substitution be tested without a client — which matters,
// because a bug in here rides out on every message you send.

/** A token count estimate that is at least in the right ballpark for CJK. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    // CJK ideographs, kana, Hangul, and full-width punctuation all sit around
    // one token per character; latin text is closer to four characters each.
    const isCjk =
      (code >= 0x3000 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0x20000 && code <= 0x3ffff);
    if (isCjk) cjk++;
    else other++;
  }
  return Math.max(1, cjk + Math.ceil(other / 4));
}

/** Symmetric percentage wobble, so consecutive tails don't read as copy-paste. */
export function jitter(value: number, percent: number, random: () => number = Math.random): number {
  if (percent <= 0 || value <= 0) return Math.round(value);
  const span = value * (percent / 100);
  return Math.max(1, Math.round(value + (random() * 2 - 1) * span));
}

export interface TailContext {
  model: string;
  /** Seconds spent composing, already rounded for display. */
  seconds: number;
  inputTokens: number;
  outputTokens: number;
  chars: number;
  now: Date;
}

function two(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Substitute `{…}` placeholders. Unknown placeholders are left untouched rather
 * than blanked: a typo should look like a typo, not silently delete part of the
 * line the user wrote.
 */
export function renderTail(template: string, ctx: TailContext): string {
  const values: Record<string, string> = {
    model: ctx.model,
    time: ctx.seconds.toFixed(1),
    in: String(ctx.inputTokens),
    out: String(ctx.outputTokens),
    total: String(ctx.inputTokens + ctx.outputTokens),
    chars: String(ctx.chars),
    clock: `${two(ctx.now.getHours())}:${two(ctx.now.getMinutes())}:${two(ctx.now.getSeconds())}`,
    date: `${ctx.now.getFullYear()}-${two(ctx.now.getMonth() + 1)}-${two(ctx.now.getDate())}`
  };
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : whole
  );
}

/** Pick one model out of the configured list. */
export function pickModel(models: readonly string[], random: () => number = Math.random): string {
  const usable = models.map((m) => m.trim()).filter((m) => m.length > 0);
  if (usable.length === 0) return "";
  if (usable.length === 1) return usable[0];
  return usable[Math.floor(random() * usable.length) % usable.length];
}

/**
 * Join a message and its tail. The tail goes on its own line when asked, which
 * is what `-#` subtext needs — Discord only treats it as subtext at the start of
 * a line, so appending inline would print the literal characters instead.
 */
export function appendTail(content: string, tail: string, ownLine: boolean): string {
  if (!tail) return content;
  if (!ownLine) return `${content} ${tail}`;
  return content.endsWith("\n") ? `${content}${tail}` : `${content}\n${tail}`;
}
