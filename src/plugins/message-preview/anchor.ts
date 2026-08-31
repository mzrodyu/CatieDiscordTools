// Locating the composer's editable box.
//
// Only the editor, not the button row: the button is injected into Discord's own
// React button array by a source patch (see index.tsx), because splicing a DOM
// node into that flex container is what broke it — React re-renders the row on
// every keystroke, and an unexpected child made it throw and blank the whole
// icon cluster (gift / GIF / sticker / emoji all disappeared).
//
// The editor is still found by hand, for two read-only jobs: positioning the
// panel above the input, and reading text when DraftStore is unreachable. It is
// matched on its accessibility contract — `[role="textbox"][contenteditable]` —
// never on a hashed class name.

/** The composer's editable box. ARIA + contenteditable, not a class name. */
const EDITOR_SELECTOR = '[role="textbox"][contenteditable="true"]';

/** The live composer element, preferring the one the user is actually in. */
export function findEditor(): HTMLElement | null {
  try {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.matches(EDITOR_SELECTOR)) return active;
    const all = document.querySelectorAll<HTMLElement>(EDITOR_SELECTOR);
    // Last visible one wins: Discord keeps hidden/offscreen editors around
    // (thread composer, forum drafts) and the one on screen is mounted last.
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].offsetParent !== null) return all[i];
    }
    return all.length ? all[all.length - 1] : null;
  } catch {
    return null;
  }
}
