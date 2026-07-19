// Build entry for Halcyon.
//
// Produces these artifacts:
//   dist/halcyon.js         the renderer payload (IIFE, injected into Discord)
//   dist/injector.js        the Node-side CLI that wires the payload into Discord
//   dist/extension/         the MV3 browser extension (payload + bridge + manifest)
//   dist/halcyon.user.js    the Tampermonkey/Violentmonkey userscript
//
// React/ReactDOM are never bundled. They are read out of Discord's own module
// graph at runtime. The `reactShim` inject file provides the `React` binding
// that JSX compiles against.

import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const r = (p) => resolve(root, p);

const watch = process.argv.includes("--watch");
const dev = watch || process.argv.includes("--dev");

const version = process.env.npm_package_version ?? JSON.parse(readFileSync(r("package.json"), "utf8")).version;

/** Shared options for anything that runs inside the Discord renderer. */
const rendererCommon = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "esnext",
  sourcemap: dev ? "inline" : false,
  minify: !dev,
  legalComments: "none",
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  inject: [r("src/runtime/react-shim.ts")],
  loader: {
    ".css": "text",
    ".svg": "text"
  },
  define: {
    HALCYON_DEV: JSON.stringify(dev),
    HALCYON_VERSION: JSON.stringify(version),
    // Stamped at build time and logged at boot, so "which build is actually
    // running" is never a guess (extension reloads are easy to miss).
    HALCYON_BUILD: JSON.stringify(new Date().toISOString().slice(0, 19).replace("T", " "))
  },
  logLevel: "info"
};

// The metadata block Tampermonkey/Violentmonkey parse. `@run-at document-start`
// is load-bearing: the payload must take over Webpack before Discord's first
// chunk, same constraint as the extension's content script.
const userscriptBanner = `// ==UserScript==
// @name         Halcyon for Discord
// @namespace    halcyon
// @version      ${version}
// @description  A restrained, iOS-styled plugin layer for the Discord web client.
// @author       caitemm (mzrodyu)
// @match        *://*.discord.com/*
// @run-at       document-start
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==
`;

const targets = [
  {
    ...rendererCommon,
    entryPoints: [r("src/main.ts")],
    outfile: r("dist/halcyon.js"),
    globalName: "Halcyon"
  },
  {
    // Browser-extension payload. Same renderer code, loaded via a MAIN-world
    // content script instead of the desktop preload.
    ...rendererCommon,
    entryPoints: [r("src/extension/main.ts")],
    outfile: r("dist/extension/halcyon.js"),
    globalName: "Halcyon"
  },
  {
    // Userscript build. Kept readable (no minify) so script managers and users
    // can audit what they are installing.
    ...rendererCommon,
    entryPoints: [r("src/userscript/main.ts")],
    outfile: r("dist/halcyon.user.js"),
    globalName: "Halcyon",
    minify: false,
    banner: { js: userscriptBanner }
  },
  {
    entryPoints: [r("src/injector/cli.ts")],
    outfile: r("dist/injector.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    sourcemap: dev ? "inline" : false,
    minify: false,
    banner: { js: "#!/usr/bin/env node" },
    logLevel: "info"
  }
];

/** Copy the extension's static files (manifest + isolated bridge) next to its payload. */
function copyExtensionAssets() {
  const outDir = r("dist/extension");
  mkdirSync(outDir, { recursive: true });
  copyFileSync(r("src/extension/manifest.json"), resolve(outDir, "manifest.json"));
  copyFileSync(r("src/extension/bridge.js"), resolve(outDir, "bridge.js"));
}

if (watch) {
  const contexts = await Promise.all(targets.map((t) => context(t)));
  await Promise.all(contexts.map((c) => c.watch()));
  copyExtensionAssets();
  console.log("halcyon: watching for changes");
} else {
  await Promise.all(targets.map((t) => build(t)));
  copyExtensionAssets();
  console.log("halcyon: build complete");
}
