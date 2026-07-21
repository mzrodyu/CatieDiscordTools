// Active update detection.
//
// The build already ships passive auto-update for the userscript (Tampermonkey
// polls @updateURL and swaps in a higher @version on its own). This module adds
// the *active* half: at settings-open time it asks the repo what the latest
// published version is and, if it is newer than the running build, surfaces a
// notice. That matters most for the browser-extension install, which has no
// script-manager auto-update behind it.
//
// The version of record is package.json on the repo's main branch — the same
// value the build stamps into @version and HALCYON_VERSION, so the comparison
// is apples to apples.
//
// Fetching cross-origin from inside Discord is the catch: Discord's CSP
// (connect-src) blocks a page-context fetch to raw.githubusercontent.com, and
// the userscript runs with `@grant none` (it must, to stay in page context and
// win the Webpack race), so GM_xmlhttpRequest is not available either. The one
// target that *can* reach GitHub is the extension, whose isolated-world bridge
// holds host permission — so we prefer a privileged fetch relayed through
// HalcyonNative and fall back to a plain fetch that simply returns null when
// CSP forbids it. Either way the check degrades to "unknown", never throws.

import { logger } from "./logger";

const log = logger("update");

const REPO = "mzrodyu/CatieDiscordTools";
const VERSION_URL = `https://raw.githubusercontent.com/${REPO}/main/package.json`;

/** Where a user goes to get the new build (install buttons live in the README). */
export const PROJECT_URL = `https://github.com/${REPO}`;

export type UpdateStatus = "checking" | "current" | "outdated" | "unknown";

export interface UpdateState {
  status: UpdateStatus;
  /** The running build's version. */
  current: string;
  /** The latest published version, or null when it could not be determined. */
  latest: string | null;
}

let cached: UpdateState | null = null;
let inflight: Promise<UpdateState> | null = null;

/** The version of the running build (stamped by the build; "dev" when unset). */
export function currentVersion(): string {
  return typeof HALCYON_VERSION !== "undefined" ? HALCYON_VERSION : "dev";
}

/** Last known result, or null if no check has completed yet. */
export function getCachedUpdate(): UpdateState | null {
  return cached;
}

/**
 * Compare two dotted version strings numerically. Any leading `v`, and the
 * pre-release / build tails after `-` or `+`, are ignored; missing segments
 * count as zero (so `0.2` and `0.2.0` are equal).
 */
function parseVersion(v: string): number[] {
  return String(v)
    .trim()
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((p) => parseInt(p, 10))
    .filter((n) => Number.isFinite(n));
}

function isNewer(remote: string, local: string): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

/**
 * Fetch text cross-origin. Prefers the extension's privileged relay (the only
 * path that gets past Discord's CSP); otherwise a best-effort page fetch that
 * returns null rather than throwing when the CSP blocks it.
 */
async function fetchText(url: string): Promise<string | null> {
  const native = (globalThis as any).HalcyonNative;
  if (native && typeof native.fetchText === "function") {
    try {
      const text = await native.fetchText(url);
      if (typeof text === "string") return text;
    } catch {
      // fall through to the page fetch
    }
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return await res.text();
  } catch {
    // CSP / offline — treated as "unknown" by the caller
  }
  return null;
}

/**
 * Check the repo for a newer published version. Result is cached; call with
 * `force` to bypass the cache (e.g. a manual "check again"). Concurrent callers
 * share one in-flight request.
 */
export async function checkForUpdate(force = false): Promise<UpdateState> {
  if (!force && cached && cached.status !== "unknown") return cached;
  if (inflight) return inflight;

  inflight = (async (): Promise<UpdateState> => {
    const current = currentVersion();
    const raw = await fetchText(VERSION_URL);

    let state: UpdateState;
    if (raw == null) {
      state = { status: "unknown", current, latest: null };
    } else {
      let latest: string | null = null;
      try {
        const parsed = JSON.parse(raw);
        latest = typeof parsed?.version === "string" && parsed.version ? parsed.version : null;
      } catch {
        latest = null;
      }

      if (!latest) {
        state = { status: "unknown", current, latest: null };
      } else if (current === "dev") {
        // A local dev build has no meaningful version to compare against.
        state = { status: "current", current, latest };
      } else {
        state = { status: isNewer(latest, current) ? "outdated" : "current", current, latest };
      }
    }

    if (state.status === "outdated") {
      log.info(`update available: ${state.current} → ${state.latest}`);
    } else if (state.status === "unknown") {
      log.info("could not determine the latest version (CSP or offline) — skipping notice");
    } else {
      log.info(`up to date (${state.current})`);
    }

    cached = state;
    inflight = null;
    return state;
  })();

  return inflight;
}
