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
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";

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
  zipDirectory(outDir, r("dist/halcyon-extension.zip"));
}

// --- minimal zip writer ------------------------------------------------------
//
// dist/halcyon-extension.zip is committed to the repository so users can grab
// the extension with one click instead of downloading the whole source tree.
// A hand-rolled writer keeps the build free of dependencies; the format bits
// below are the minimum a zip needs (local headers + central directory).

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipDirectory(dir, outFile) {
  const entries = readdirSync(dir).filter((name) => statSync(resolve(dir, name)).isFile());
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const name of entries) {
    const data = readFileSync(resolve(dir, name));
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    // Store uncompressed when deflate does not help (already-minified payloads rarely hit this).
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += 30 + nameBuf.length + body.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);

  writeFileSync(outFile, Buffer.concat([...locals, centralBuf, end]));
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
