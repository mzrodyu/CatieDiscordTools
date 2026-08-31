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

/**
 * Message edits do NOT go through DraftStore — the DraftType enum has no
 * EditMessage member (ChannelMessage=0, ThreadSettings=1, FirstThreadMessage=2,
 * ApplicationLauncherCommand=3, Poll=4, SlashCommand=5, ForwardContextMessage=6,
 * InteractionModal=7). Edits live in their own store, which is why previewing an
 * edit showed "还没输入内容": we were reading the channel's (empty) draft while
 * the text sat in here. `getEditingTextValue` hands back the raw markdown,
 * already unparsed back from the rich value, which is exactly what will be sent.
 */
const EditMessageStore = lazy<any>((m) => m?.getName?.() === "EditMessageStore");

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

/** Whether the channel is mid-edit, and the id of the message being edited. */
export function editingMessageId(channelId: string | undefined): string | undefined {
  if (!channelId) return undefined;
  try {
    const id = EditMessageStore.getEditingMessageId?.(channelId);
    return typeof id === "string" && id.length ? id : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The text that will actually be sent: the edit buffer when a message is being
 * edited, otherwise the channel draft. Falls back to the composer's text content
 * only if both stores are unreachable on this build — that path loses custom
 * emoji, so it is a degraded answer rather than an equivalent one.
 */
export function readDraft(channelId: string | undefined): string {
  if (channelId) {
    try {
      if (EditMessageStore.isEditingAny?.(channelId)) {
        const editing = EditMessageStore.getEditingTextValue?.(channelId);
        if (typeof editing === "string") return editing;
      }
    } catch {
      // not editing, or no store on this build
    }
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
  const detach: Array<() => void> = [];
  // Both stores, because either can be the one changing: the channel draft while
  // composing, the edit buffer while editing a sent message.
  for (const candidate of [DraftStore, EditMessageStore]) {
    try {
      const store = candidate as any;
      if (typeof store?.addChangeListener === "function") {
        store.addChangeListener(onChange);
        detach.push(() => {
          try {
            store.removeChangeListener?.(onChange);
          } catch {
            // store went away with the module; nothing to detach
          }
        });
      }
    } catch {
      // store absent on this build; the caller's poll covers it
    }
  }
  return {
    attached: detach.length > 0,
    off: () => {
      for (const off of detach) off();
    }
  };
}
