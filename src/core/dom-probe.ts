// DOM probing for diagnostics.
//
// Plugins that decorate Discord's own interface anchor onto class-name prefixes
// (`[class*="membersWrap"]`), because Discord appends a per-build hash to every
// class. When an anchor stops matching, the plugin degrades to doing nothing —
// correct, but indistinguishable from "the plugin is broken".
//
// These helpers turn that into a fact: they report what a selector actually
// matches in the live client, and what class names are actually present around
// a given keyword, so a missed anchor can be fixed against the real DOM instead
// of a guess. Nothing here runs unless a diagnostic asks for it.

export interface ElementSample {
  tag: string;
  classes: string;
  childCount: number;
  /** Rounded on-screen box, so an invisible (0x0) match is obvious. */
  box: string;
}

export interface SelectorReport {
  selector: string;
  count: number;
  samples: ElementSample[];
}

function describe(el: Element): ElementSample {
  let box = "n/a";
  try {
    const r = el.getBoundingClientRect();
    box = `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top)}`;
  } catch {
    // detached or exotic element
  }
  return {
    tag: el.tagName.toLowerCase(),
    classes: typeof el.className === "string" ? el.className : String(el.className ?? ""),
    childCount: el.children.length,
    box
  };
}

/** What a selector matches right now, with a few samples. */
export function probeSelector(selector: string, limit = 3): SelectorReport {
  try {
    const found = document.querySelectorAll(selector);
    const samples: ElementSample[] = [];
    for (let i = 0; i < found.length && i < limit; i++) samples.push(describe(found[i]));
    return { selector, count: found.length, samples };
  } catch {
    return { selector, count: -1, samples: [] };
  }
}

/** Run several selectors, most-specific-first, exactly like an anchor list. */
export function probeSelectors(selectors: string[], limit = 2): SelectorReport[] {
  return selectors.map((s) => probeSelector(s, limit));
}

/**
 * Every distinct class name in the document containing `needle`. This is the
 * ground truth an anchor list has to be written against: paste it back and the
 * correct prefix is right there, hash and all.
 */
export function classNamesContaining(needle: string, limit = 24): string[] {
  const out = new Set<string>();
  try {
    const nodes = document.querySelectorAll(`[class*="${needle}"]`);
    for (let i = 0; i < nodes.length && out.size < limit; i++) {
      const raw = nodes[i].className;
      if (typeof raw !== "string") continue;
      for (const name of raw.split(/\s+/)) {
        if (name.includes(needle)) out.add(name);
        if (out.size >= limit) break;
      }
    }
  } catch {
    // invalid needle; report nothing
  }
  return [...out];
}
