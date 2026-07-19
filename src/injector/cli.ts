// Halcyon injector CLI.
//
// Installs (or removes) a small `resources/app` shim next to Discord's
// `app.asar`. Electron loads that folder in preference to the asar, so the shim
// runs first, appends Halcyon's preload, and hands control straight back to
// Discord. The asar itself is never modified, which makes uninstalling as safe
// as deleting a folder.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { locateInstalls, type DiscordInstall } from "./discord";
import { LOADER_JS, PRELOAD_JS, SHIM_PACKAGE_JSON } from "./templates";

const here = dirname(fileURLToPath(import.meta.url));
const payloadSource = join(here, "halcyon.js");

function shimDir(install: DiscordInstall): string {
  return join(install.resourcesPath, "app");
}

function fail(message: string): never {
  console.error(`halcyon: ${message}`);
  process.exit(1);
}

function requireInstalls(): DiscordInstall[] {
  const installs = locateInstalls();
  if (!installs.length) {
    fail("no Discord installation found. Is Discord installed for the current user?");
  }
  return installs;
}

function inject(): void {
  if (!existsSync(payloadSource)) {
    fail(`payload not found at ${payloadSource}. Run \`pnpm build\` first.`);
  }

  const installs = requireInstalls();
  for (const install of installs) {
    const dir = shimDir(install);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), SHIM_PACKAGE_JSON, "utf8");
    writeFileSync(join(dir, "index.js"), LOADER_JS, "utf8");
    writeFileSync(join(dir, "preload.js"), PRELOAD_JS, "utf8");
    copyFileSync(payloadSource, join(dir, "halcyon.js"));
    console.log(`  injected  ${install.flavor}  ->  ${dir}`);
  }
  console.log("\nDone. Fully quit Discord (from the tray) and start it again.");
}

function uninject(): void {
  const installs = requireInstalls();
  let removed = 0;
  for (const install of installs) {
    const dir = shimDir(install);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      removed++;
      console.log(`  removed   ${install.flavor}  <-  ${dir}`);
    }
  }
  console.log(removed ? "\nDone. Restart Discord to run it unmodified." : "nothing to remove.");
}

function status(): void {
  const installs = locateInstalls();
  if (!installs.length) {
    console.log("no Discord installation found.");
    return;
  }
  for (const install of installs) {
    const injected = existsSync(join(shimDir(install), "index.js"));
    console.log(`  ${install.flavor.padEnd(20)} ${injected ? "injected" : "clean"}  (${install.resourcesPath})`);
  }
}

function usage(): void {
  console.log(
    [
      "Halcyon injector",
      "",
      "usage: halcyon <command>",
      "",
      "  inject     install the shim into every detected Discord install",
      "  uninject   remove the shim, restoring Discord to stock",
      "  status     show which installs currently carry the shim",
      ""
    ].join("\n")
  );
}

const command = process.argv[2];
switch (command) {
  case "inject":
    inject();
    break;
  case "uninject":
    uninject();
    break;
  case "status":
    status();
    break;
  case undefined:
  case "help":
  case "--help":
  case "-h":
    usage();
    break;
  default:
    console.error(`halcyon: unknown command "${command}"\n`);
    usage();
    process.exit(1);
}
