// The chip itself.
//
// Reads the counts on every render and re-renders on the three Flux actions
// that can change them, plus a slow interval as a safety net (the member-list
// group counts arrive through actions we deliberately don't enumerate, and a
// stale number is worse than a cheap poll).

import { React, useState, useEffect } from "../../../core/common/react";
import { flux } from "../../../core/flux";
import { SelectedChannelStore } from "../../../core/common/discord";
import { PeopleIcon } from "../../../icons";
import { EMPTY_COUNTS, formatCount, readCounts, type MemberCounts } from "../counts";
import { settings } from "../settings";

/** Actions after which the counts may differ. */
const WATCHED_ACTIONS = [
  "CHANNEL_SELECT",
  "GUILD_MEMBER_LIST_UPDATE",
  "GUILD_UPDATE",
  "GUILD_CREATE",
  "THREAD_MEMBER_LIST_UPDATE"
] as const;

const POLL_MS = 5000;

function sameCounts(a: MemberCounts, b: MemberCounts): boolean {
  return a.total === b.total && a.online === b.online;
}

function useMemberCounts(): MemberCounts {
  const [counts, setCounts] = useState<MemberCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let live = true;

    const refresh = (): void => {
      if (!live) return;
      let next: MemberCounts;
      try {
        next = readCounts(SelectedChannelStore.getChannelId?.());
      } catch {
        next = EMPTY_COUNTS;
      }
      // Bail on no-change so a 5s poll doesn't re-render the chip forever.
      setCounts((prev) => (sameCounts(prev, next) ? prev : next));
    };

    refresh();

    const unsubscribes = WATCHED_ACTIONS.map((type) => flux.subscribe(type, refresh));
    const timer = setInterval(refresh, POLL_MS);

    return () => {
      live = false;
      clearInterval(timer);
      for (const off of unsubscribes) off();
    };
  }, []);

  return counts;
}

export interface MemberCountChipProps {
  /** Where this instance is mounted; only affects styling. */
  variant: "header" | "list";
}

export function MemberCountChip({ variant }: MemberCountChipProps): React.ReactElement | null {
  const { total, online } = useMemberCounts();
  const s = settings.store;

  const showOnline = s.showOnline && online != null;
  const showTotal = s.showTotal && total != null;
  // Nothing to say (a DM, or a guild we have no numbers for yet): render
  // nothing at all rather than an empty box.
  if (!showOnline && !showTotal) return null;

  const parts: string[] = [];
  if (showOnline) parts.push(`在线 ${online!.toLocaleString("en-US")}`);
  if (showTotal) parts.push(`总成员 ${total!.toLocaleString("en-US")}`);

  return (
    <div
      className={`hc-membercount hc-membercount--${variant}`}
      title={parts.join(" · ")}
      aria-label={parts.join("，")}
    >
      <PeopleIcon size={14} className="hc-membercount__icon" />
      {showOnline && (
        <span className="hc-membercount__part">
          <span className="hc-membercount__dot" />
          {s.showLabels && <span className="hc-membercount__label">在线</span>}
          <span className="hc-membercount__value">{formatCount(online!, s.abbreviate)}</span>
        </span>
      )}
      {showOnline && showTotal && <span className="hc-membercount__sep">·</span>}
      {showTotal && (
        <span className="hc-membercount__part">
          {s.showLabels && <span className="hc-membercount__label">共</span>}
          <span className="hc-membercount__value">{formatCount(total!, s.abbreviate)}</span>
        </span>
      )}
    </div>
  );
}
