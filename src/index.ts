import { healHeadings } from './core.js';
import { 
  enableHeadingLogging, 
  disableHeadingLogging, 
  clearHeadingLogging, 
  getHeadingLoggingStatus,
  createLoggingInterface
} from './logging.js';
import { SemanticHeadingHierarchyInterface } from './types.js';

// Re-export types for public API
export type { FixOptions } from './types.js';

/**
 * Semantic Heading Hierarchy API
 */
export const SemanticHeadingHierarchy: SemanticHeadingHierarchyInterface = {
  /**
   * Fix heading hierarchies in the specified container
   * @param containerOrSelector - CSS selector string or DOM element to search within
   * @param options - Options object or boolean for logResults (for backwards compatibility)
   */
  fix: healHeadings,

  /**
   * Logging control methods
   */
  logging: createLoggingInterface()
};

// Export as default for convenience
export default SemanticHeadingHierarchy;

// Also export the legacy functions for backwards compatibility
export { healHeadings };
export { enableHeadingLogging, disableHeadingLogging, clearHeadingLogging, getHeadingLoggingStatus };

// Browser global declarations for window object
declare global {
  interface Window {
    SemanticHeadingHierarchy: typeof SemanticHeadingHierarchy;
    healHeadings: typeof healHeadings;
    enableHeadingLogging: typeof enableHeadingLogging;
    disableHeadingLogging: typeof disableHeadingLogging;
    clearHeadingLogging: typeof clearHeadingLogging;
    getHeadingLoggingStatus: typeof getHeadingLoggingStatus;
  }
}

// Also make them available on window object for browser usage
if (typeof window !== 'undefined') {
  window.SemanticHeadingHierarchy = SemanticHeadingHierarchy;
  // Legacy global functions for backwards compatibility
  window.healHeadings = healHeadings;
  window.enableHeadingLogging = enableHeadingLogging;
  window.disableHeadingLogging = disableHeadingLogging;
  window.clearHeadingLogging = clearHeadingLogging;
  window.getHeadingLoggingStatus = getHeadingLoggingStatus;
}