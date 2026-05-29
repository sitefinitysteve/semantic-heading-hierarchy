import { LoggingInterface } from './types.js';

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