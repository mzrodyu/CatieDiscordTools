// Where the preview button hangs: the button row inside the chat input.
//
// Discord hashes every CSS class per build, so `channelTextArea__1a2b3` is not
// something to select on — the plain name does not even appear in the current
// bundle. What IS stable is the accessibility contract around the composer: the
// message box is a `[role="textbox"][contenteditable="true"]` inside a `form`.
// So anchoring walks that structure first and only then narrows by class
// prefix, which is the same `[class*="…"]` trick the rest of the project uses.
//
// If every strategy misses, we say so once and print what the DOM actually
// looks like (dom-probe), so a future Discord reshuffle is fixed against real
// class names instead of a guess.

import { probeSelector, classNamesContaining } from "../../core/dom-probe";
import { logger } from "../../core/logger";

const log = logger("message-preview");

/** The composer's editable box. ARIA + contenteditable, not a class name. */
const EDITOR_SELECTOR = '[role="textbox"][contenteditable="true"]';

let warned = false;

/** The live composer element, preferring the one the user is actually in. */
export function findEditor(): HTMLElement | null {
  try {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.matches(EDITOR_SELECTOR)) return active;
    const all = document.querySelectorAll<HTMLElement>(EDITOR_SELECTOR);
    // Last one wins: Discord keeps hidden/offscreen editors around (thread
    // composer, forum drafts), and the visible one is mounted last.
    for (let i = all.length - 1; i >= 0; i--) {
      const el = all[i];
      if (el.offsetParent !== null) return el;
    }
    return all.length ? all[all.length - 1] : null;
  } catch {
    return null;
  }
}

/**
 * The container holding the composer's icon cluster (gift / GIF / sticker /
 * emoji), scoped to the form the editor lives in so we can never land on some
 * unrelated `buttons` container elsewhere on the page.
 */
export function findButtonRow(): Element | null {
  const editor = findEditor();
  if (!editor) return null;

  const form: Element | null = editor.closest("form") ?? editor.parentElement?.parentElement ?? null;
  if (!form) return null;

  for (const selector of ['[class*="buttons_"]', '[class*="buttons"]']) {
    try {
      const found: Element[] = Array.from(form.querySelectorAll<Element>(selector));
      // Prefer the deepest match: the outer wrapper often also carries a
      // `buttons`-ish class, and appending there puts our button in the wrong
      // row (below the text, not beside the emoji picker).
      let best: Element | null = null;
      let bestDepth = -1;
      for (const el of found) {
        let depth = 0;
        for (let p: Element | null = el.parentElement; p && p !== form; p = p.parentElement) depth++;
        if (depth > bestDepth) {
          best = el;
          bestDepth = depth;
        }
      }
      if (best) return best;
    } catch {
      // bad selector for this engine; try the next
    }
  }

  // Last resort: the editor's grandparent. Not the icon row, but it keeps the
  // button reachable instead of the plugin silently doing nothing.
  return editor.parentElement?.parentElement ?? null;
}

/** Report a miss once, with the surrounding DOM, so it is fixable later. */
export function reportAnchorMiss(): void {
  if (warned) return;
  warned = true;
  log.warn(
    "找不到输入框的按钮行，预览按钮没挂上。当前 DOM 情况：",
    probeSelector(EDITOR_SELECTOR),
    "含 buttons 的 class 名：",
    classNamesContaining("buttons")
  );
}

export function resetAnchorWarning(): void {
  warned = false;
}
