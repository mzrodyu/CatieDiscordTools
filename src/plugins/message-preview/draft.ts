// Reading what the user has actually typed.
//
// The draft, not the DOM. Discord renders a custom emoji in the composer as an
// image node, so `editor.textContent` silently loses `<a:name:id>` — and those
// tokens are the whole reason this preview exists. `DraftStore.getDraft` hands
// back the real outgoing markdown, tokens intact.
//
// DraftType.ChannelMessage is 0 (verified in the current bundle: the enum reads
// `[i.ChannelMessage=0]`). The store's own signature is
// `getDraft(channelId, type)` and it returns "" when there is nothing.

import { lazy } from "../../core/modules/webpack";
import { SelectedChannelStore } from "../../core/common/discord";
import { findEditor } from "./anchor";

const DraftStore = lazy<any>((m) => m?.getName?.() === "DraftStore");

/** DraftType.ChannelMessage */
const DRAFT_CHANNEL_MESSAGE = 0;

export function currentChannelId(): string | undefined {
  try {
    const id = SelectedChannelStore.getChannelId?.();
    return typeof id === "string" && id.length ? id : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The draft for a channel. Falls back to the composer's text content only if the
 * store is unreachable on this build — that path loses custom emoji, so it is a
 * degraded answer rather than an equivalent one.
 */
export function readDraft(channelId: string | undefined): string {
  if (channelId) {
    try {
      const draft = DraftStore.getDraft?.(channelId, DRAFT_CHANNEL_MESSAGE);
      if (typeof draft === "string") return draft;
    } catch {
      // fall through to the DOM
    }
  }
  try {
    return findEditor()?.textContent ?? "";
  } catch {
    return "";
  }
}

/**
 * Subscribe to draft changes. Prefers the store's own change listener; if this
 * build's store does not expose one, the caller's poll is the fallback (hence
 * the boolean — it says whether polling is still needed).
 */
export function subscribeToDraft(onChange: () => void): { attached: boolean; off: () => void } {
  try {
    const store = DraftStore as any;
    if (typeof store?.addChangeListener === "function") {
      store.addChangeListener(onChange);
      return {
        attached: true,
        off: () => {
          try {
            store.removeChangeListener?.(onChange);
          } catch {
            // store went away with the module; nothing to detach
          }
        }
      };
    }
  } catch {
    // no store on this build
  }
  return { attached: false, off: () => undefined };
}
