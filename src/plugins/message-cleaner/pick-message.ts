// Click-to-pick a message in the chat, like Undiscord's "选取" buttons.
//
// The caller hides the settings surface first; this puts the page into a
// picking mode (hover outline + hint banner), waits for a click on a message
// row and resolves with that message's id. Escape or cancel() resolves null.

const PICKING_CLASS = "hc-cleaner-picking";
/** `chat-messages-<channel>-<message>` rows, or the inner `message-content-<message>`. */
const MESSAGE_SELECTOR = '[id^="chat-messages-"], [id^="message-content-"]';

export interface MessagePick {
  promise: Promise<string | null>;
  cancel: () => void;
}

export function pickMessage(hint: string): MessagePick {
  let finish: (id: string | null) => void = () => {};
  const promise = new Promise<string | null>((resolve) => {
    const banner = document.createElement("div");
    banner.className = "hc-cleaner-pickhint";
    banner.textContent = `${hint}（按 Esc 取消）`;
    document.body.appendChild(banner);
    document.body.classList.add(PICKING_CLASS);

    const onClick = (e: MouseEvent) => {
      const row = (e.target as Element | null)?.closest?.(MESSAGE_SELECTOR);
      // Clicks elsewhere stay live so the user can still scroll or switch channel.
      if (!row) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      finish(row.id.match(/(\d{15,25})$/)?.[1] ?? null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Keep Escape from also closing the (hidden) settings surface.
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      finish(null);
    };

    let done = false;
    finish = (id) => {
      if (done) return;
      done = true;
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      document.body.classList.remove(PICKING_CLASS);
      banner.remove();
      resolve(id);
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
  });
  return { promise, cancel: () => finish(null) };
}
