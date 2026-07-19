// A live tail of the runtime's log ring. Reads the buffered history on mount
// and appends new entries as they arrive. Levels are colored, not iconified,
// to keep the view dense and quiet.

import { useEffect, useRef, useState } from "../../core/common/react";
import { getLogHistory, onLog, type LogEntry } from "../../core/logger";
import { EmptyState } from "../components/EmptyState";
import { ListIcon } from "../../icons";

const MAX_VISIBLE = 500;
const PAGE_SIZE = 100;

export function LogsView(): React.ReactElement {
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogHistory().slice());
  // 0 = the newest page. Older pages keep their content stable as logs stream in.
  const [page, setPage] = useState(0);
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

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const clamped = Math.min(page, pageCount - 1);
  // Pages are counted from the tail: page 0 is the newest slice.
  const end = entries.length - clamped * PAGE_SIZE;
  const visible = entries.slice(Math.max(0, end - PAGE_SIZE), end);

  // Keep the view pinned to the bottom only while watching the live page.
  useEffect(() => {
    if (clamped !== 0) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, clamped]);

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
    <div className="hc-stack">
      <div className="hc-logs" ref={scrollRef}>
        {visible.map((entry, index) => (
          <div className="hc-logline" data-level={entry.level} key={`${entry.time}-${index}`}>
            <span className="hc-logline__time">{formatTime(entry.time)}</span>
            <span className="hc-logline__scope">{entry.scope}</span>
            <span className="hc-logline__msg">{entry.parts.map(stringify).join(" ")}</span>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="hc-pager">
          <button
            type="button"
            className="hc-tab"
            disabled={clamped >= pageCount - 1}
            onClick={() => setPage(Math.min(pageCount - 1, clamped + 1))}
          >
            ← 更早
          </button>
          <span className="hc-pager__label">
            {clamped === 0 ? "实时" : `第 ${pageCount - clamped} / ${pageCount} 页`}
          </span>
          <button
            type="button"
            className="hc-tab"
            disabled={clamped === 0}
            onClick={() => setPage(Math.max(0, clamped - 1))}
          >
            更新 →
          </button>
        </div>
      )}
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
