// Non-code assets. Pure ambient (no imports/exports) so these declarations are
// visible everywhere without being pulled in explicitly.
//
// CSS is imported as plain text via esbuild's `.css` text loader, then injected
// into the document at runtime.
declare module "*.css" {
  const content: string;
  export default content;
}
