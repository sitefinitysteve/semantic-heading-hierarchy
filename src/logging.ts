import { LoggingInterface, HealResult, HeadingState } from './types.js';

/**
 * Enables detailed logging for all healHeadings calls via localStorage
 */
export function enableHeadingLogging(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('healHeadings.logResults', 'true');
    console.log('✅ Detailed heading healing logging ENABLED globally');
  } else {
    console.warn('localStorage not available - cannot enable global logging');
  }
}

/**
 * Disables detailed logging for all healHeadings calls via localStorage
 */
export function disableHeadingLogging(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('healHeadings.logResults', 'false');
    console.log('❌ Detailed heading healing logging DISABLED globally');
  } else {
    console.warn('localStorage not available - cannot disable global logging');
  }
}

/**
 * Clears localStorage override, returns to using function parameters for logging
 */
export function clearHeadingLogging(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('healHeadings.logResults');
    console.log('🔄 Heading healing logging reset - will use function parameter');
  } else {
    console.warn('localStorage not available - cannot clear global logging');
  }
}

/**
 * Gets the current logging status from localStorage
 * @returns The current logging override value or null if not set
 */
export function getHeadingLoggingStatus(): string | null {
  if (typeof localStorage !== 'undefined') {
    const setting = localStorage.getItem('healHeadings.logResults');
    if (setting === null) {
      console.log('📋 Heading healing logging: Using function parameter (no override set)');
    } else {
      console.log(`📋 Heading healing logging: ${setting === 'true' ? 'ENABLED' : 'DISABLED'} (localStorage override)`);
    }
    return setting;
  } else {
    console.log('📋 Heading healing logging: localStorage not available');
    return null;
  }
}

/**
 * Toggles detailed logging on or off based on its current state, persisting via localStorage
 * @returns The new logging state (true = now enabled, false = now disabled)
 */
export function toggleHeadingLogging(): boolean {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage not available - cannot toggle global logging');
    return false;
  }
  // Anything other than an explicit 'true' (including unset) is treated as off, so a toggle turns it on.
  const turningOn = localStorage.getItem('healHeadings.logResults') !== 'true';
  if (turningOn) {
    enableHeadingLogging();
  } else {
    disableHeadingLogging();
  }
  return turningOn;
}

/** Short human label for each heading state, used in the summary table and per-row lines. */
const STATE_LABEL: Record<HeadingState, string> = {
  'anchor': 'anchor',
  'promoted': 'promoted',
  'changed': 'changed',
  'unchanged': 'unchanged',
  'skipped-list': 'skipped (list)',
  'ignored-before-h1': 'ignored (before H1)',
  'ignored-additional-h1': 'ignored (extra H1)'
};

/** A glyph per state so the expanded log scans quickly. */
const STATE_ICON: Record<HeadingState, string> = {
  'anchor': '⚓',
  'promoted': '⤴️',
  'changed': '🔧',
  'unchanged': '·',
  'skipped-list': '⏭️',
  'ignored-before-h1': '⚠️',
  'ignored-additional-h1': '⚠️'
};

const STATES_THAT_GET_A_CLASS = new Set<HeadingState>(['changed', 'promoted']);

/** Collapse whitespace and clip long heading text so the table stays readable. */
function truncate(text: string, max = 60): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Emits a single collapsed console group summarising a heal run. Expanding it reveals:
 *   1. a console.table overview (level change, state, added class, text), and
 *   2. one line per heading logging the LIVE element - in a browser these are clickable and
 *      highlight the node in the Elements panel, so you can see exactly what changed.
 *
 * Kept here (rather than inline in core) so the heal logic stays focused on DOM work and the
 * console formatting can evolve independently.
 *
 * @param result - the HealResult returned by healHeadings
 * @param meta.classPrefix - the prefix used for styling classes (to show what was added)
 * @param meta.fromGlobalOverride - true when logging was turned on via the localStorage override,
 *        so we append the persistent-global FYI note
 */
export function logHealSummary(
  result: HealResult,
  meta: { classPrefix: string; fromGlobalOverride: boolean }
): void {
  const { headings, modifiedCount } = result;
  const skippedCount = headings.filter(h =>
    h.state === 'skipped-list' ||
    h.state === 'ignored-before-h1' ||
    h.state === 'ignored-additional-h1'
  ).length;

  const header = `🩺 healHeadings — ${modifiedCount} changed, ${skippedCount} skipped, ${headings.length} total`;

  // One collapsed line keeps the console tidy; everything else lives inside the group.
  const startGroup = typeof console.groupCollapsed === 'function' ? console.groupCollapsed : console.log;
  startGroup.call(console, header);

  // Scannable overview. Each row mirrors a HeadingResult plus the styling class we added (if any).
  if (typeof console.table === 'function') {
    console.table(
      headings.map(h => ({
        heading: h.from === h.to ? `H${h.from}` : `H${h.from} → H${h.to}`,
        state: STATE_LABEL[h.state],
        class: STATES_THAT_GET_A_CLASS.has(h.state) ? `${meta.classPrefix}${h.from}` : '',
        text: truncate(h.text)
      }))
    );
  }

  // Clickable element references: in the browser each logged node highlights on hover and can be
  // revealed in the Elements panel on click - the "see what changed" affordance.
  headings.forEach(h => {
    const arrow = h.from === h.to ? `H${h.from}` : `H${h.from} → H${h.to}`;
    const cls = STATES_THAT_GET_A_CLASS.has(h.state) ? `  +${meta.classPrefix}${h.from} class` : '';
    console.log(`${STATE_ICON[h.state]} ${arrow}  ${STATE_LABEL[h.state]}${cls}  "${truncate(h.text)}"`, h.element);
  });

  // The global override persists across page loads, so remind callers it is on (and how to stop it).
  if (meta.fromGlobalOverride) {
    console.log('ℹ️  FYI: heading-healing logging is ON globally and persists across page loads. Turn it off any time with disableHeadingLogging().');
  }

  if (typeof console.groupEnd === 'function') console.groupEnd();
}

/**
 * Creates a logging interface object that implements LoggingInterface
 */
export function createLoggingInterface(): LoggingInterface {
  return {
    enable: enableHeadingLogging,
    disable: disableHeadingLogging,
    toggle: toggleHeadingLogging,
    clear: clearHeadingLogging,
    status: getHeadingLoggingStatus
  };
}