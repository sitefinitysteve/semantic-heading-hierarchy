/**
 * Options for the fix function
 */
export interface FixOptions {
  /** Whether to log detailed results to the console */
  logResults?: boolean;
  /** Prefix for styling classes (e.g., 'hs-' creates 'hs-2', 'hs-3', etc.) */
  classPrefix?: string;
  /** Force single H1 by converting additional H1s to H2s */
  forceSingleH1?: boolean;
  /** When no H1 exists, promote the first heading in the container to H1 instead of bailing */
  promoteFirstHeading?: boolean;
}

/**
 * What the healer decided to do with a given heading.
 */
export type HeadingState =
  | 'anchor'                 // the H1 the hierarchy is measured from
  | 'promoted'               // promoted up to H1 because none existed (promoteFirstHeading)
  | 'changed'                // level was rewritten
  | 'unchanged'              // evaluated, already at the correct level
  | 'skipped-list'           // inside a multi-item list, left alone by design
  | 'ignored-before-h1'      // appears before the H1, ignored
  | 'ignored-additional-h1'; // an extra H1 after the first, ignored

/**
 * Outcome for a single heading after healing.
 */
export interface HeadingResult {
  /** Trimmed text content of the heading */
  text: string;
  /** Original heading level (1-6) as authored */
  from: number;
  /** Final heading level (1-6) after healing (equal to `from` when unchanged) */
  to: number;
  /** What the healer did with this heading */
  state: HeadingState;
  /** The heading element as it exists after healing (the replacement element if it was rewritten) */
  element: Element;
}

/**
 * Structured result returned by healHeadings describing what happened to every heading.
 */
export interface HealResult {
  /** True when an H1 anchor was found or created and headings were processed */
  ran: boolean;
  /** True when the first heading was promoted to H1 because none existed */
  promotedFirstHeading: boolean;
  /** Number of headings whose level was changed */
  modifiedCount: number;
  /** Per-heading outcome, in document order */
  headings: HeadingResult[];
}

/**
 * Internal structure for tracking elements to be replaced
 */
export interface ElementReplacement {
  original: Element;
  newLevel: number;
  originalLevel: number;
  originalTag: string;
}

/**
 * Logging interface for the SemanticHeadingHierarchy API
 */
export interface LoggingInterface {
  /** Enable detailed logging for all fix calls via localStorage */
  enable(): void;
  /** Disable detailed logging for all fix calls via localStorage */
  disable(): void;
  /** Toggle detailed logging on/off based on current state; returns the new state */
  toggle(): boolean;
  /** Clear localStorage override, returns to using function parameters for logging */
  clear(): void;
  /** Get the current logging status from localStorage */
  status(): string | null;
}

/**
 * Main API interface for SemanticHeadingHierarchy
 */
export interface SemanticHeadingHierarchyInterface {
  /** Fix heading hierarchies in the specified container */
  fix(containerOrSelector?: string | Element, options?: boolean | FixOptions): HealResult;
  /** Logging control methods */
  logging: LoggingInterface;
}