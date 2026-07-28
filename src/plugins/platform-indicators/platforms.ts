// Where a user is online, read out of Discord's own presence state.
//
// Discord already knows this — it is how the mobile badge on an avatar works —
// it just never surfaces it beyond that one case. `PresenceStore` keeps a
// `clientStatuses` map of `userId -> { desktop?, mobile?, web?, embedded? }`,
// each value being that client's status ("online" / "idle" / "dnd"). A platform
// missing from the map means the user is not connected there.
//
// Your own account is the exception: the gateway doesn't send you a presence for
// yourself, so self-indicators come from `SessionsStore`, the same store that
// powers Discord's "you're also logged in on…" list.
//
// Also in here: a tiny change bus. Presence updates arrive constantly (every
// friend going idle), and re-rendering a few dozen indicator nodes on each one
// is wasteful, so updates are coalesced into one notification every 400ms.

import { lazy } from "../../core/modules/webpack";
import { UserStore } from "../../core/common/discord";

const PresenceStore = lazy<any>((m) => m?.getName?.() === "PresenceStore");
const SessionsStore = lazy<any>((m) => m?.getName?.() === "SessionsStore");

export type Platform = "desktop" | "mobile" | "web" | "embedded";
export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

export interface PlatformPresence {
  platform: Platform;
  status: PresenceStatus;
}

/** Fixed display order, so the icons never reshuffle between renders. */
const PLATFORM_ORDER: Platform[] = ["desktop", "mobile", "web", "embedded"];

function normalizeStatus(value: unknown): PresenceStatus {
  return value === "online" || value === "idle" || value === "dnd" ? value : "online";
}

function normalizePlatform(value: unknown): Platform | null {
  switch (value) {
    case "desktop":
    case "mobile":
    case "web":
    case "embedded":
      return value;
    default:
      return null;
  }
}

function currentUserId(): string | null {
  try {
    const id = UserStore.getCurrentUser?.()?.id;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/** Whether a user id belongs to a bot, as far as the client knows. */
export function isBot(userId: string): boolean {
  try {
    return UserStore.getUser?.(userId)?.bot === true;
  } catch {
    return false;
  }
}

function fromClientStatuses(userId: string): PlatformPresence[] {
  let entry: Record<string, unknown> | undefined;
  try {
    const state = PresenceStore.getState?.();
    // `clientStatuses` on current builds; `clientStatus` on older ones.
    const map = state?.clientStatuses ?? state?.clientStatus;
    entry = map?.[userId];
  } catch {
    return [];
  }
  if (entry == null || typeof entry !== "object") return [];

  const out: PlatformPresence[] = [];
  for (const platform of PLATFORM_ORDER) {
    const status = entry[platform];
    if (status == null) continue;
    out.push({ platform, status: normalizeStatus(status) });
  }
  return out;
}

function fromSessions(): PlatformPresence[] {
  let sessions: Record<string, any> | undefined;
  try {
    sessions = SessionsStore.getSessions?.();
  } catch {
    return [];
  }
  if (sessions == null || typeof sessions !== "object") return [];

  // Keep the strongest status per platform; "all" is Discord's aggregate
  // pseudo-session and carries no client of its own.
  const best = new Map<Platform, PresenceStatus>();
  for (const session of Object.values(sessions)) {
    if (session == null || session.sessionId === "all") continue;
    const platform = normalizePlatform(session.clientInfo?.client);
    if (!platform) continue;
    if (!best.has(platform)) best.set(platform, normalizeStatus(session.status));
  }

  const out: PlatformPresence[] = [];
  for (const platform of PLATFORM_ORDER) {
    const status = best.get(platform);
    if (status) out.push({ platform, status });
  }
  return out;
}

/** Every client a user is currently connected on. Empty when offline/unknown. */
export function readPlatforms(userId: string): PlatformPresence[] {
  if (!userId) return [];
  if (userId === currentUserId()) {
    const own = fromSessions();
    // Fall through to clientStatuses if this build keeps a self presence too.
    if (own.length) return own;
  }
  return fromClientStatuses(userId);
}

// --- change bus ------------------------------------------------------------

const COALESCE_MS = 400;

let version = 0;
let scheduled: ReturnType<typeof setTimeout> | undefined;
const subscribers = new Set<() => void>();

export function presenceVersion(): number {
  return version;
}

export function subscribePresence(listener: () => void): () => void {
  subscribers.add(listener);
  return (): void => {
    subscribers.delete(listener);
  };
}

/** Note that presences changed. Coalesced; safe to call on every action. */
export function bumpPresence(): void {
  if (scheduled) return;
  scheduled = setTimeout(() => {
    scheduled = undefined;
    version++;
    for (const listener of [...subscribers]) {
      try {
        listener();
      } catch {
        // A broken indicator must not stall the rest.
      }
    }
  }, COALESCE_MS);
}

export function resetPresenceBus(): void {
  if (scheduled) {
    clearTimeout(scheduled);
    scheduled = undefined;
  }
  subscribers.clear();
}

// --- diagnostics -----------------------------------------------------------

/** Which presence sources resolved on this build, and what they hold. */
export function presenceDiagnostics(): Record<string, unknown> {
  let presenceStore = false;
  let stateKeys: string[] = [];
  let sampleCount: number | null = null;

  try {
    const state = PresenceStore.getState?.();
    presenceStore = state != null && typeof state === "object";
    if (presenceStore) stateKeys = Object.keys(state).slice(0, 12);
    const map = state?.clientStatuses ?? state?.clientStatus;
    sampleCount = map && typeof map === "object" ? Object.keys(map).length : null;
  } catch {
    presenceStore = false;
  }

  let sessionsStore = false;
  let sessionCount: number | null = null;
  try {
    const sessions = SessionsStore.getSessions?.();
    sessionsStore = sessions != null && typeof sessions === "object";
    if (sessionsStore) sessionCount = Object.keys(sessions).length;
  } catch {
    sessionsStore = false;
  }

  return {
    PresenceStore: presenceStore,
    presenceStateKeys: stateKeys,
    clientStatusesEntries: sampleCount,
    SessionsStore: sessionsStore,
    sessionCount
  };
}
