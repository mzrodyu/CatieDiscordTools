// A live tail of the runtime's log ring. Reads the buffered history on mount
// and appends new entries as they arrive. Levels are colored, not iconified,
// to keep the view dense and quiet.

import { useEffect, useRef, useState } from "../../core/common/react";
import { getLogHistory, onLog, type LogEntry } from "../../core/logger";
import { EmptyState } from "../components/EmptyState";
import { ListIcon } from "../../icons";

const MAX_VISIBLE = 500;

export function LogsView(): React.ReactElement {
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogHistory().slice());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEntries(getLogHistory().slice());
    return onLog((entry) => {
      setEntries((prev) => {
        const next = prev.concat(entry);
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ListIcon size={48} />}
        title="暂无日志"
        subtitle="运行时和插件的输出会实时出现在这里。"
      />
    );
  }

  return (
    <div className="hc-logs" ref={scrollRef}>
      {entries.map((entry, index) => (
        <div className="hc-logline" data-level={entry.level} key={index}>
          <span className="hc-logline__time">{formatTime(entry.time)}</span>
          <span className="hc-logline__scope">{entry.scope}</span>
          <span className="hc-logline__msg">{entry.parts.map(stringify).join(" ")}</span>
        </div>
      ))}
    </div>
  );
}

function formatTime(time: number): string {
  const date = new Date(time);
  const clock = date.toLocaleTimeString(undefined, { hour12: false });
  return `${clock}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

function stringify(part: unknown): string {
  if (typeof part === "string") return part;
  if (part instanceof Error) return part.stack ?? part.message;
  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}
