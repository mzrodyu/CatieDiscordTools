// Leveled logging for the runtime and every plugin.
//
// Everything that would otherwise reach for `console.log` goes through here so
// that (a) output carries a consistent scope prefix, (b) the in-app log viewer
// can replay recent entries, and (c) verbosity is tunable in one place.

declare const HALCYON_DEV: boolean;

export type LogLevel = "debug" | "info" | "warn" | "error";

const WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

// Muted, single-hue badges. No gradients, in keeping with the design language.
const BADGE: Record<LogLevel, string> = {
  debug: "#8E8E93",
  info: "#0A84FF",
  warn: "#FF9F0A",
  error: "#FF453A"
};

export interface LogEntry {
  time: number;
  level: LogLevel;
  scope: string;
  parts: unknown[];
}

const RING_CAPACITY = 500;
const ring: LogEntry[] = [];
const subscribers = new Set<(entry: LogEntry) => void>();

let threshold: number = (typeof HALCYON_DEV !== "undefined" && HALCYON_DEV) ? WEIGHT.debug : WEIGHT.info;

function record(level: LogLevel, scope: string, parts: unknown[]): void {
  const entry: LogEntry = { time: Date.now(), level, scope, parts };

  ring.push(entry);
  if (ring.length > RING_CAPACITY) ring.shift();

  for (const fn of subscribers) {
    try {
      fn(entry);
    } catch {
      // A broken viewer subscriber must never break logging itself.
    }
  }

  if (WEIGHT[level] < threshold) return;

  const badge = `background:${BADGE[level]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(`%cHalcyon%c ${scope}`, badge, "color:inherit;font-weight:600", ...parts);
}

export interface Logger {
  debug(...parts: unknown[]): void;
  info(...parts: unknown[]): void;
  warn(...parts: unknown[]): void;
  error(...parts: unknown[]): void;
  child(childScope: string): Logger;
}

/** Create a logger bound to a scope, e.g. `logger("modules")`. */
export function logger(scope: string): Logger {
  return {
    debug: (...p) => record("debug", scope, p),
    info: (...p) => record("info", scope, p),
    warn: (...p) => record("warn", scope, p),
    error: (...p) => record("error", scope, p),
    child: (childScope) => logger(`${scope}:${childScope}`)
  };
}

/** Adjust the minimum level that reaches the console. */
export function setLogLevel(level: LogLevel): void {
  threshold = WEIGHT[level];
}

/** Snapshot of buffered entries, oldest first. Used by the in-app viewer. */
export function getLogHistory(): readonly LogEntry[] {
  return ring.slice();
}

/** Subscribe to live log entries. Returns an unsubscribe function. */
export function onLog(fn: (entry: LogEntry) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
