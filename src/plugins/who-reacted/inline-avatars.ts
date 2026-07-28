// Inline reactor avatars — the "直接能看到" surface.
//
// This is the primary interaction, not a garnish: your Discord build doesn't
// ship the native "reaction preview" that draws faces inside the pill, so
// without this every reaction is opaque unless you go through the details
// popout. We scan every visible reaction pill, fetch its reactors on demand,
// and drop a tight avatar stack INSIDE the pill — just like the native
// preview draws it on builds that have it, so the pill grows naturally instead
// of getting a foreign strip hanging off the side.
//
// Anchoring notes: `.reaction__…` and `.reactionInner__…` are two class names
// on the SAME element on current builds, not a parent/child pair. `pill` here
// is that element; appending to `pill.parentElement` puts the host in the
// reactions ROW as a peer of every pill (Flex item) — which is exactly the
// "avatars float on the row below the pill" symptom the earlier attempt had.
// So we `pill.appendChild(host)` and lean on CSS to size it like the count.
//
// Data comes from the same `fetchReactors` cache the hover card uses; visible
// pills for the same reaction share one request.

import { fetchReactors, resolveReaction, type Reactor } from "./reactors";
import { logger } from "../../core/logger";
import { settings } from "./settings";

const log = logger("who-reacted");

/** Every pill we've already decorated, keyed by the pill DOM element. */
const DECORATED = new WeakSet<Element>();
/** Marker attribute — lets us find (and clean up) hosts on stop. */
const HOST_ATTR = "data-hc-reactors";

let scanTimer: ReturnType<typeof setInterval> | undefined;
let mutationObserver: MutationObserver | undefined;

/** The reaction pill selector — same one the hover surface uses. */
const REACTION_SELECTOR = '[class*="reactionInner"], [class*="reaction_"]';

function makeHost(): HTMLSpanElement {
  const host = document.createElement("span");
  host.className = "hc-inline-reactors";
  host.setAttribute(HOST_ATTR, "1");
  return host;
}

function fillHost(host: HTMLSpanElement, reactors: Reactor[], totalHint: number | null): void {
  const max = Math.max(1, Math.min(6, Math.trunc(settings.store.inlineAvatarCount) || 3));
  const shown = reactors.slice(0, max);
  const total = totalHint ?? reactors.length;
  const overflow = Math.max(0, total - shown.length);

  host.textContent = ""; // rebuild
  for (const reactor of shown) {
    const img = document.createElement("img");
    img.className = "hc-inline-reactors__avatar";
    if (reactor.avatarUrl) img.src = reactor.avatarUrl;
    img.alt = "";
    img.loading = "lazy";
    img.title = reactor.name;
    img.referrerPolicy = "no-referrer";
    host.appendChild(img);
  }
  // Only surface the `+N` badge when we actually rendered at least one avatar.
  // Otherwise the pill ends up with a lone `+1` sitting next to Discord's own
  // count with no faces to justify it — the exact "看不到,重复了吗" symptom.
  if (shown.length > 0 && overflow > 0) {
    const more = document.createElement("span");
    more.className = "hc-inline-reactors__more";
    more.textContent = `+${overflow}`;
    host.appendChild(more);
  }
}

/**
 * True when Discord itself is already drawing reactor faces inside this pill
 * (the native Reaction Preview feature). We detect it by looking for an avatar
 * URL — emoji URLs use `/emojis/` and don't match — so if the pill already
 * shows any user avatar we back off and let the native UI stand alone.
 */
function pillHasNativePreview(pill: Element): boolean {
  return (
    pill.querySelector('img[src*="cdn.discordapp.com/avatars/"]') != null ||
    pill.querySelector('img[src*="cdn.discordapp.com/embed/avatars/"]') != null
  );
}

/**
 * Decorate one pill: resolve target via React fiber, fetch reactors, mount
 * avatar stack. Idempotent per pill via DECORATED.
 */
async function decorate(pill: Element): Promise<void> {
  if (DECORATED.has(pill)) return;

  // Bow out when Discord's own Reaction Preview is already drawing faces —
  // stacking a second stack on top just repeats the info and cramps the pill.
  // Sticky: mark DECORATED so we don't keep re-checking on every scan tick.
  if (pillHasNativePreview(pill)) {
    DECORATED.add(pill);
    return;
  }

  DECORATED.add(pill);

  const target = resolveReaction(pill);
  if (!target) return;
  if (target.count != null && target.count <= 0) return;

  const host = makeHost();
  try {
    pill.appendChild(host);
  } catch {
    return;
  }

  try {
    const wanted = Math.min(12, Math.max(6, (settings.store.inlineAvatarCount || 3) + 3));
    const reactors = await fetchReactors(target, wanted);
    if (!host.isConnected) return; // pill repainted; a fresh scan will redo it

    // Empty response (API cache miss, missing access, rate limit already
    // spent, …): drop the host cleanly rather than leaving a bare `+N` badge
    // with no faces. Forget DECORATED too so the next scan can retry.
    if (reactors.length === 0) {
      host.remove();
      DECORATED.delete(pill);
      return;
    }

    // Native preview may have arrived AFTER our first check (Discord streams
    // it in). If so, hide out now — same reason as above.
    if (pillHasNativePreview(pill)) {
      host.remove();
      return;
    }

    fillHost(host, reactors, target.count);
  } catch (err) {
    log.debug("inline avatars: fetch failed", err);
    host.remove();
    DECORATED.delete(pill);
  }
}

function scan(): void {
  if (!settings.store.inlineAvatars) return;
  let pills: NodeListOf<Element>;
  try {
    pills = document.querySelectorAll(REACTION_SELECTOR);
  } catch {
    return;
  }
  pills.forEach((pill) => {
    if (!pill.isConnected) return;
    // If a repaint stripped our host from a pill we thought was decorated,
    // forget it so the next call re-appends.
    if (DECORATED.has(pill) && !pill.querySelector(`[${HOST_ATTR}]`)) DECORATED.delete(pill);
    void decorate(pill);
  });
}

export function startInlineAvatars(): void {
  if (!settings.store.inlineAvatars) return;
  stopInlineAvatars();

  scan();
  scanTimer = setInterval(scan, 1500);

  if (typeof MutationObserver === "function") {
    mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(REACTION_SELECTOR)) void decorate(node);
          node.querySelectorAll?.(REACTION_SELECTOR).forEach((pill) => void decorate(pill));
        });
      }
    });
    try {
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    } catch {
      // best effort; scan interval keeps things fresh
    }
  }

  log.info("inline reactor avatars: enabled");
}

export function stopInlineAvatars(): void {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = undefined;
  }
  if (mutationObserver) {
    try {
      mutationObserver.disconnect();
    } catch {
      // already gone
    }
    mutationObserver = undefined;
  }
  try {
    document.querySelectorAll(`[${HOST_ATTR}]`).forEach((host) => host.remove());
  } catch {
    // best effort
  }
}
