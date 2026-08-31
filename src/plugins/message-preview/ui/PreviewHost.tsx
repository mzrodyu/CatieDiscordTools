// The panel host: owns the draft subscription while the preview is open.
//
// Kept as a component rather than re-mounting PreviewPanel on every keystroke —
// a remount would tear the DOM down mid-type and flicker. This subscribes once,
// debounces, and lets React diff the body.
//
// The draft is read from the store, not from React state we own, because the
// user types into Discord's composer and we are only watching.

import { React, useState, useEffect, useRef } from "../../../core/common/react";
import { PreviewPanel } from "./PreviewPanel";
import { currentChannelId, readDraft, subscribeToDraft } from "../draft";
import { settings } from "../settings";

/** How long to sit still after a keystroke before re-parsing. */
const DEBOUNCE_MS = 150;
/** Poll interval when this build's DraftStore exposes no change listener. */
const POLL_MS = 250;

interface Props {
  /** Called when the draft empties out, which is what sending looks like. */
  onEmptied: () => void;
}

export function PreviewHost({ onEmptied }: Props): React.ReactElement {
  const initialChannel = currentChannelId();
  const [channelId, setChannelId] = useState<string | undefined>(initialChannel);
  const [content, setContent] = useState<string>(() => readDraft(initialChannel));
  const hadContent = useRef<boolean>(readDraft(initialChannel).trim().length > 0);

  useEffect(() => {
    if (!settings.store.liveUpdate) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    let disposed = false;

    const sample = (): void => {
      if (disposed) return;
      const id = currentChannelId();
      const next = readDraft(id);
      setChannelId(id);
      setContent(next);

      // A draft that went from something to nothing is a send (or a clear).
      // Either way the preview has nothing left to say, so let the owner close
      // it instead of leaving an empty panel floating over the composer.
      const has = next.trim().length > 0;
      if (hadContent.current && !has) onEmptied();
      hadContent.current = has;
    };

    const schedule = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sample, DEBOUNCE_MS);
    };

    const { attached, off } = subscribeToDraft(schedule);
    // The store only fires for draft writes; a channel switch does not
    // necessarily touch it, so keep a slow poll either way — but a fast one
    // only when there is no listener to lean on.
    poll = setInterval(sample, attached ? POLL_MS * 4 : POLL_MS);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
      off();
    };
  }, [onEmptied]);

  return <PreviewPanel content={content} channelId={channelId} />;
}
