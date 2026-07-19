// Ambient declarations shared across the whole source tree.
//
// React is not bundled. At runtime it is pulled out of Discord's own module
// graph and exposed as a global by the build's inject step (see
// scripts/build.mjs). These declarations only teach the type checker that the
// binding exists and provide the React.* types JSX and components reference;
// they produce no output.

import type * as ReactTypes from "react";

declare global {
  const React: typeof ReactTypes;

  // The `React` value above covers `React.createElement` etc. This namespace
  // mirrors the React type surface the codebase uses, so `React.ReactNode`,
  // `React.FC`, and friends resolve without a per-file import.
  namespace React {
    type ReactNode = ReactTypes.ReactNode;
    type ReactElement = ReactTypes.ReactElement;
    type FC<P = {}> = ReactTypes.FC<P>;
    type FunctionComponent<P = {}> = ReactTypes.FunctionComponent<P>;
    type ComponentType<P = {}> = ReactTypes.ComponentType<P>;
    type PropsWithChildren<P = unknown> = ReactTypes.PropsWithChildren<P>;
    type CSSProperties = ReactTypes.CSSProperties;
    type Ref<T> = ReactTypes.Ref<T>;
    type HTMLAttributes<T> = ReactTypes.HTMLAttributes<T>;
    type ButtonHTMLAttributes<T> = ReactTypes.ButtonHTMLAttributes<T>;
    type InputHTMLAttributes<T> = ReactTypes.InputHTMLAttributes<T>;
    type SelectHTMLAttributes<T> = ReactTypes.SelectHTMLAttributes<T>;
    type KeyboardEvent<T = Element> = ReactTypes.KeyboardEvent<T>;
    type MouseEvent<T = Element> = ReactTypes.MouseEvent<T>;
    type ChangeEvent<T = Element> = ReactTypes.ChangeEvent<T>;
  }

  // Replaced at build time by esbuild's `define`.
  const HALCYON_DEV: boolean;
  const HALCYON_VERSION: string;
  const HALCYON_BUILD: string;

  interface Window {
    // Discord's webpack chunk sink. Present once the client's bundle boots.
    webpackChunkdiscord_app?: WebpackChunk[];
  }
}

// A single entry pushed onto the webpack chunk array:
//   [ chunkIds, moduleFactories, runtimeCallback? ]
type WebpackChunk = [
  Array<string | number> | symbol[],
  Record<string, unknown>,
  ((require: unknown) => void)?
];

export {};
