// Locating Discord installations across platforms.
//
// We only ever need the `resources` directory that contains `app.asar`; the
// shim goes next to it. Nothing here writes anything — it just reports what it
// finds so the CLI can act on it.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform } from "node:os";

export interface DiscordInstall {
  /** "Discord", "DiscordCanary", ... */
  flavor: string;
  /** Absolute path to the resources directory holding app.asar. */
  resourcesPath: string;
}

const WINDOWS_FLAVORS = ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"];
const MAC_FLAVORS: Array<[string, string]> = [
  ["Discord", "Discord.app"],
  ["DiscordPTB", "Discord PTB.app"],
  ["DiscordCanary", "Discord Canary.app"]
];
const LINUX_FLAVORS = ["Discord", "DiscordPTB", "DiscordCanary"];

export function locateInstalls(): DiscordInstall[] {
  switch (platform()) {
    case "win32":
      return locateWindows();
    case "darwin":
      return locateMac();
    default:
      return locateLinux();
  }
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function withAsar(flavor: string, resourcesPath: string, out: DiscordInstall[]): void {
  if (existsSync(join(resourcesPath, "app.asar"))) {
    out.push({ flavor, resourcesPath });
  }
}

function locateWindows(): DiscordInstall[] {
  const localAppData = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
  const out: DiscordInstall[] = [];

  for (const flavor of WINDOWS_FLAVORS) {
    const base = join(localAppData, flavor);
    if (!isDir(base)) continue;
    const appDir = latestAppDir(base);
    if (!appDir) continue;
    withAsar(flavor, join(base, appDir, "resources"), out);
  }
  return out;
}

/** Discord installs side-by-side versioned folders like `app-1.0.9042`. */
function latestAppDir(base: string): string | undefined {
  let candidates: string[];
  try {
    candidates = readdirSync(base).filter((name) => name.startsWith("app-") && isDir(join(base, name)));
  } catch {
    return undefined;
  }
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => compareVersions(a.slice(4), b.slice(4)));
  return candidates[candidates.length - 1];
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function locateMac(): DiscordInstall[] {
  const out: DiscordInstall[] = [];
  for (const [flavor, appName] of MAC_FLAVORS) {
    const resources = join("/Applications", appName, "Contents", "Resources");
    withAsar(flavor, resources, out);
  }
  return out;
}

function locateLinux(): DiscordInstall[] {
  const out: DiscordInstall[] = [];
  const roots = [
    "/usr/share",
    "/usr/lib64",
    "/opt",
    join(homedir(), ".local", "share")
  ];
  for (const flavor of LINUX_FLAVORS) {
    for (const root of roots) {
      const resources = join(root, flavor.toLowerCase(), "resources");
      withAsar(flavor, resources, out);
    }
  }
  return out;
}
