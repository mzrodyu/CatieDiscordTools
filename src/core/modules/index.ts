// Public surface of the module locator.
//
// Plugins import these through `@halcyon/api`; they should never touch
// ./webpack directly. Keeping the re-export list here lets us reshape the
// internal implementation without breaking callers.

export {
  find,
  findAll,
  findByProps,
  findBySource,
  findStore,
  waitFor,
  lazy,
  isReady,
  type ModuleFilter
} from "./webpack";
