import { FixOptions, ElementReplacement, HealResult, HeadingResult } from './types.js';
import { logHealSummary } from './logging.js';

/**
 * Corrects improper heading hierarchies by ensuring proper semantic structure
 * @param containerOrSelector - CSS selector string or DOM element to search within
 * @param options - Options object or boolean for logResults (for backwards compatibility)
 * @returns A HealResult describing every heading (in document order) and what the healer did
 *          with it. When it bails (e.g. no H1 and promoteFirstHeading is off) `ran` is false.
 */
export function healHeadings(
  containerOrSelector: string | Element = document.body,
  options: boolean | FixOptions = false
): HealResult {
  // Handle backwards compatibility - if options is boolean, treat as logResults
  let logResults = false;
  let classPrefix = 'hs-';
  let forceSingleH1 = false;
  let promoteFirstHeading = false;
  let healListHeadings = false;

  if (typeof options === 'boolean') {
    logResults = options;
  } else if (typeof options === 'object' && options !== null) {
    logResults = options.logResults || false;
    classPrefix = options.classPrefix || 'hs-';
    forceSingleH1 = options.forceSingleH1 || false;
    promoteFirstHeading = options.promoteFirstHeading || false;
    healListHeadings = options.healListHeadings || false;
  }

  // A classPrefix containing whitespace would make classList.add() throw and abort the heal
  // mid-DOM-mutation, leaving the page half-healed. Guard against it by falling back to the
  // default prefix (same forgiving spirit as the empty-string fallback above).
  if (/\s/.test(classPrefix)) {
    console.warn(`Invalid classPrefix "${classPrefix}" contains whitespace; falling back to "hs-".`);
    classPrefix = 'hs-';
  }

  // Check localStorage for global logging override. Track whether the override is what turned
  // logging on, so we can show a "this is on globally" FYI when the run finishes.
  let logFromGlobalOverride = false;
  if (typeof localStorage !== 'undefined') {
    const logOverride = localStorage.getItem('healHeadings.logResults');
    if (logOverride !== null) {
      logResults = logOverride === 'true';
      logFromGlobalOverride = logResults;
    }
  }

  // Per-heading outcomes (keyed by the original element) assembled into the return value.
  const outcomes = new Map<Element, HeadingResult>();
  let didPromote = false;
  const empty = (): HealResult => ({ ran: false, promotedFirstHeading: false, modifiedCount: 0, headings: [] });

  let container: Element;
  
  // Handle selector string
  if (typeof containerOrSelector === 'string') {
    const elements = document.querySelectorAll(containerOrSelector);
    
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${containerOrSelector}`);
      return empty();
    }

    if (elements.length > 1) {
      console.error(`Multiple elements found for selector: ${containerOrSelector}. Selector must match exactly one element.`);
      return empty();
    }
    
    container = elements[0];
  } else {
    // Handle DOM element
    container = containerOrSelector;
  }
  
  if (!container || !(container instanceof Element)) {
    console.warn('Invalid container provided to healHeadings');
    return empty();
  }

  // Find the first H1 element within the container
  let h1Element = container.querySelector('h1');

  if (!h1Element) {
    // By default there is nothing to anchor to, so we bail. With promoteFirstHeading enabled
    // we instead promote the first heading in the container up to <h1> and heal from there.
    if (!promoteFirstHeading) {
      if (logResults) {
        console.log('No H1 found - skipping heading structure fix');
      }
      return empty();
    }

    const firstHeading = container.querySelector('h2, h3, h4, h5, h6');
    if (!firstHeading) {
      if (logResults) {
        console.log('No H1 found and no headings to promote - nothing to fix');
      }
      return empty();
    }

    const promotedLevel = parseInt(firstHeading.tagName.charAt(1), 10);

    // Preserve the original size so the page does not visually jump (same FLOUT-prevention
    // approach as a normal heal): keep a styling hook and record where it came from.
    firstHeading.classList.add(`${classPrefix}${promotedLevel}`);

    const promotedH1 = document.createElement('h1');
    Array.from(firstHeading.attributes).forEach(attr => {
      promotedH1.setAttribute(attr.name, attr.value);
    });
    // Move child nodes across rather than copying innerHTML - preserves nested markup and
    // event listeners without a parse round-trip.
    while (firstHeading.firstChild) {
      promotedH1.appendChild(firstHeading.firstChild);
    }
    promotedH1.setAttribute('data-prev-heading', promotedLevel.toString());
    promotedH1.setAttribute('data-heading-processed', 'promoted');

    if (firstHeading.parentNode) {
      firstHeading.parentNode.replaceChild(promotedH1, firstHeading);
    }

    h1Element = promotedH1;
    didPromote = true;
    outcomes.set(promotedH1, {
      text: (promotedH1.textContent || '').trim(),
      from: promotedLevel,
      to: 1,
      state: 'promoted',
      element: promotedH1
    });
  } else {
    // Mark the anchor H1 so a devtools inspection confirms the library ran on this container.
    h1Element.setAttribute('data-heading-processed', 'anchor');
    outcomes.set(h1Element, {
      text: (h1Element.textContent || '').trim(),
      from: 1,
      to: 1,
      state: 'anchor',
      element: h1Element
    });
  }

  // Get all headings within the container
  const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const h1Index = allHeadings.indexOf(h1Element);

  // Check for headings before the H1 and warn (always warn, regardless of logging setting)
  const headingsBeforeH1 = allHeadings.slice(0, h1Index);
  if (headingsBeforeH1.length > 0) {
    const headingTypes = headingsBeforeH1.map(h => h.tagName.toLowerCase()).join(', ');
    headingsBeforeH1.forEach(h => {
      h.setAttribute('data-heading-processed', 'ignored-before-h1');
      const lvl = parseInt(h.tagName.charAt(1), 10);
      outcomes.set(h, { text: (h.textContent || '').trim(), from: lvl, to: lvl, state: 'ignored-before-h1', element: h });
    });
    console.warn(`⚠️  Found ${headingsBeforeH1.length} heading(s) before H1: ${headingTypes}. These headings will be ignored for accessibility compliance. Consider restructuring your HTML to place all content headings after the main H1.`);
  }
  
  // Check for additional H1s after the first one
  const additionalH1s = allHeadings.slice(h1Index + 1).filter(h => h.tagName.toLowerCase() === 'h1');
  if (additionalH1s.length > 0) {
    if (forceSingleH1) {
      console.warn(`⚠️  Found ${additionalH1s.length} additional H1 element(s) after the first H1. These will be converted to H2 elements due to forceSingleH1 option.`);
    } else {
      // Not converting them, so they are skipped by the loop below - mark them as ignored here.
      additionalH1s.forEach(h => {
        h.setAttribute('data-heading-processed', 'ignored-additional-h1');
        outcomes.set(h, { text: (h.textContent || '').trim(), from: 1, to: 1, state: 'ignored-additional-h1', element: h });
      });
      console.warn(`⚠️  Found ${additionalH1s.length} additional H1 element(s) after the first H1. These will be ignored. Consider using the forceSingleH1 option to convert them to H2 elements.`);
    }
  }
  
  // Get headings after the first H1
  const headingsAfterH1 = allHeadings.slice(h1Index + 1);
  
  // Handle additional H1s based on forceSingleH1 option
  let headings: Element[];
  if (forceSingleH1) {
    // Include all headings after the first H1 (we'll convert additional H1s to H2s)
    headings = headingsAfterH1;
  } else {
    // Exclude any other H1s (original behavior)
    headings = headingsAfterH1.filter(heading => heading.tagName.toLowerCase() !== 'h1');
  }

  let previousLevel = 1; // Start with H1 level
  const elementsToReplace: ElementReplacement[] = [];

  // Process each heading
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const originalTag = heading.tagName.toLowerCase();
    const originalLevel = parseInt(originalTag.charAt(1), 10);

    // Check if this heading is inside a list with sibling items. Skipped by default (uniform
    // "card" content), but healListHeadings opts in to treating list headings like any other.
    const listItem = healListHeadings ? null : heading.closest('li');
    if (listItem) {
      // Check if this li has sibling li elements. Count only the DIRECT children of the
      // immediate list - querySelectorAll('li') also matches <li> in nested sublists, which
      // would wrongly treat a single-item list (with a nested list inside it) as multi-item
      // and skip a heading that should have been healed.
      const parentList = listItem.parentElement;
      if (parentList) {
        const siblingItems = Array.from(parentList.children).filter(el => el.tagName === 'LI');

        if (siblingItems.length > 1) {
          // Skip headings in lists with multiple items
          heading.setAttribute('data-heading-processed', 'skipped-list');
          outcomes.set(heading, { text: (heading.textContent || '').trim(), from: originalLevel, to: originalLevel, state: 'skipped-list', element: heading });
          continue;
        }
      }
    }

    // Determine the correct level
    let newLevel: number;
    
    // Handle additional H1s when forceSingleH1 is enabled
    if (originalLevel === 1 && forceSingleH1) {
      // Convert additional H1s to H2s
      newLevel = 2;
    } else if (originalLevel <= previousLevel) {
      // Same level or going back up - minimum H2
      newLevel = Math.max(2, originalLevel);
    } else {
      // Going deeper - don't skip levels (accessibility rule)
      newLevel = Math.min(originalLevel, previousLevel + 1);
    }

    // Ensure we stay within valid heading range (H2-H6)
    newLevel = Math.max(2, Math.min(newLevel, 6));

    // Mark every evaluated heading so a devtools inspection shows it was processed.
    // For changed headings this value is carried onto the replacement element when
    // attributes are copied below.
    const changed = newLevel !== originalLevel;
    heading.setAttribute('data-heading-processed', changed ? 'changed' : 'unchanged');
    outcomes.set(heading, { text: (heading.textContent || '').trim(), from: originalLevel, to: newLevel, state: changed ? 'changed' : 'unchanged', element: heading });

    // Queue element for replacement if level changed
    if (newLevel !== originalLevel) {
      elementsToReplace.push({
        original: heading,
        newLevel: newLevel,
        originalLevel: originalLevel,
        originalTag: originalTag
      });
    }

    previousLevel = newLevel;
  }

  // Apply DOM modifications
  elementsToReplace.forEach((item) => {
    const { original, newLevel, originalLevel } = item;

    // FIRST: Add visual styling class to original element to prevent FLOUT
    original.classList.add(`${classPrefix}${originalLevel}`);

    // THEN: Create new heading element
    const newHeading = document.createElement(`h${newLevel}`);

    // Copy all attributes (including the class we just added)
    Array.from(original.attributes).forEach(attr => {
      newHeading.setAttribute(attr.name, attr.value);
    });

    // Copy innerHTML
    newHeading.innerHTML = original.innerHTML;

    // Add data attribute for tracking
    newHeading.setAttribute('data-prev-heading', originalLevel.toString());

    // Replace element in DOM
    if (original.parentNode) {
      original.parentNode.replaceChild(newHeading, original);
    }

    // Point the recorded outcome at the element that now lives in the DOM.
    const outcome = outcomes.get(original);
    if (outcome) {
      outcome.element = newHeading;
    }
  });

  // Assemble the per-heading outcomes in document order (allHeadings is the pre-modification
  // snapshot; each outcome.element has been repointed to its replacement where applicable).
  const headingResults = allHeadings
    .map(h => outcomes.get(h))
    .filter((r): r is HeadingResult => r !== undefined);

  const result: HealResult = {
    ran: true,
    promotedFirstHeading: didPromote,
    modifiedCount: elementsToReplace.length,
    headings: headingResults
  };

  // One consolidated, collapsible console summary instead of a line per heading. Includes a
  // table overview and clickable live-element references for "what changed" inspection.
  if (logResults) {
    logHealSummary(result, { classPrefix, fromGlobalOverride: logFromGlobalOverride });
  }

  return result;
}