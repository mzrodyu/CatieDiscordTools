// Injected into every renderer module by the build (see scripts/build.mjs).
//
// Compiled JSX references a bare `React` identifier. esbuild's inject step
// rewrites those references to import this binding, which forwards to the copy
// of React resolved lazily out of Discord's module graph.

export { React } from "../core/common/react";
