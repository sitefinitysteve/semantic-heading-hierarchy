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
  fix(containerOrSelector?: string | Element, options?: boolean | FixOptions): void;
  /** Logging control methods */
  logging: LoggingInterface;
}