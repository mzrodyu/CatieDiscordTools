// How long you spent on this message.
//
// `{time}` is the headline number in a bot tail, and a fabricated constant reads
// as fake immediately. So measure the real thing: the clock starts when a
// channel's draft goes from empty to non-empty, and stops when the message is
// sent. Switch channels mid-thought and each keeps its own start time.
//
// Watched through DraftStore rather than keystrokes: a paste has no keydown, and
// the draft is the same source the send path reads.

import { lazy } from "../../core/modules/webpack";

const DraftStore = lazy<any>((m) => m?.getName?.() === "DraftStore");

/** DraftType.ChannelMessage */
const DRAFT_CHANNEL_MESSAGE = 0;

/** channelId -> epoch ms when this draft stopped being empty. */
const started = new Map<string, number>();

let listening = false;
let onChange: (() => void) | undefined;

function draftOf(channelId: string): string {
  try {
    const draft = DraftStore.getDraft?.(channelId, DRAFT_CHANNEL_MESSAGE);
    return typeof draft === "string" ? draft : "";
  } catch {
    return "";
  }
}

/**
 * Note the current state of every draft we know about. Called on each store
 * change: a draft that just became non-empty starts a clock, one that emptied
 * (sent, or cleared) drops it.
 */
function sample(): void {
  try {
    const drafts = DraftStore.getState?.();
    // Shape: { [userId]: { [channelId]: { [draftType]: {…} } } }. Walking it is
    // cheaper than guessing which channel changed, and it keeps the tracker
    // correct across channel switches.
    const seen = new Set<string>();
    for (const byChannel of Object.values(drafts ?? {})) {
      if (typeof byChannel !== "object" || byChannel === null) continue;
      for (const channelId of Object.keys(byChannel)) {
        seen.add(channelId);
        const has = draftOf(channelId).trim().length > 0;
        if (has) {
          if (!started.has(channelId)) started.set(channelId, Date.now());
        } else {
          started.delete(channelId);
        }
      }
    }
    // Channels whose draft record disappeared entirely.
    for (const channelId of Array.from(started.keys())) {
      if (!seen.has(channelId)) started.delete(channelId);
    }
  } catch {
    // Store shape changed; elapsed() falls back to its floor value.
  }
}

export function startTypingClock(): void {
  if (listening) return;
  try {
    onChange = sample;
    DraftStore.addChangeListener?.(onChange);
    listening = true;
    sample();
  } catch {
    listening = false;
  }
}

export function stopTypingClock(): void {
  try {
    if (onChange) DraftStore.removeChangeListener?.(onChange);
  } catch {
    // module went away; nothing to detach
  }
  onChange = undefined;
  listening = false;
  started.clear();
}

/**
 * Seconds spent composing this message, floored at `min` so a paste-and-send
 * never reports 0.0s. Consumes the start time: the next message starts fresh.
 */
export function elapsedSeconds(channelId: string, min: number): number {
  const from = started.get(channelId);
  started.delete(channelId);
  if (from === undefined) return min;
  return Math.max(min, (Date.now() - from) / 1000);
}
