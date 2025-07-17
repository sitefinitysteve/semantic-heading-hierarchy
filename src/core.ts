import { FixOptions, ElementReplacement } from './types.js';

/**
 * Corrects improper heading hierarchies by ensuring proper semantic structure
 * @param containerOrSelector - CSS selector string or DOM element to search within
 * @param options - Options object or boolean for logResults (for backwards compatibility)
 */
export function healHeadings(
  containerOrSelector: string | Element = document.body,
  options: boolean | FixOptions = false
): void {
  // Handle backwards compatibility - if options is boolean, treat as logResults
  let logResults = false;
  let classPrefix = 'hs-';
  let forceSingleH1 = false;
  
  if (typeof options === 'boolean') {
    logResults = options;
  } else if (typeof options === 'object' && options !== null) {
    logResults = options.logResults || false;
    classPrefix = options.classPrefix || 'hs-';
    forceSingleH1 = options.forceSingleH1 || false;
  }
  
  // Check localStorage for global logging override
  if (typeof localStorage !== 'undefined') {
    const logOverride = localStorage.getItem('healHeadings.logResults');
    if (logOverride !== null) {
      logResults = logOverride === 'true';
    }
  }
  
  let container: Element;
  
  // Handle selector string
  if (typeof containerOrSelector === 'string') {
    const elements = document.querySelectorAll(containerOrSelector);
    
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${containerOrSelector}`);
      return;
    }
    
    if (elements.length > 1) {
      console.error(`Multiple elements found for selector: ${containerOrSelector}. Selector must match exactly one element.`);
      return;
    }
    
    container = elements[0];
  } else {
    // Handle DOM element
    container = containerOrSelector;
  }
  
  if (!container || !(container instanceof Element)) {
    console.warn('Invalid container provided to healHeadings');
    return;
  }

  // Find the first H1 element within the container
  const h1Element = container.querySelector('h1');
  if (!h1Element) {
    if (logResults) {
      console.log('No H1 found - skipping heading structure fix');
    }
    return;
  }

  // Get all headings within the container
  const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const h1Index = allHeadings.indexOf(h1Element);
  
  // Check for headings before the H1 and warn (always warn, regardless of logging setting)
  const headingsBeforeH1 = allHeadings.slice(0, h1Index);
  if (headingsBeforeH1.length > 0) {
    const headingTypes = headingsBeforeH1.map(h => h.tagName.toLowerCase()).join(', ');
    console.warn(`⚠️  Found ${headingsBeforeH1.length} heading(s) before H1: ${headingTypes}. These headings will be ignored for accessibility compliance. Consider restructuring your HTML to place all content headings after the main H1.`);
  }
  
  // Check for additional H1s after the first one
  const additionalH1s = allHeadings.slice(h1Index + 1).filter(h => h.tagName.toLowerCase() === 'h1');
  if (additionalH1s.length > 0) {
    if (forceSingleH1) {
      console.warn(`⚠️  Found ${additionalH1s.length} additional H1 element(s) after the first H1. These will be converted to H2 elements due to forceSingleH1 option.`);
    } else {
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

  if (headings.length === 0) {
    if (logResults) {
      console.log('No H2-H6 headings found after H1 - nothing to fix');
    }
    return;
  }

  if (logResults) {
    console.log(`Found ${headings.length} heading(s) to process after H1`);
  }

  let previousLevel = 1; // Start with H1 level
  const elementsToReplace: ElementReplacement[] = [];

  // Process each heading
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const originalTag = heading.tagName.toLowerCase();
    const originalLevel = parseInt(originalTag.charAt(1), 10);

    // Check if this heading is inside a list with sibling items
    const listItem = heading.closest('li');
    if (listItem) {
      // Check if this li has sibling li elements
      const parentList = listItem.parentElement;
      if (parentList) {
        const siblingItems = parentList.querySelectorAll('li');
        
        if (siblingItems.length > 1) {
          // Skip headings in lists with multiple items
          if (logResults) {
            console.log(`Skipping ${originalTag} in list with ${siblingItems.length} items`);
          }
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

    // Queue element for replacement if level changed
    if (newLevel !== originalLevel) {
      elementsToReplace.push({
        original: heading,
        newLevel: newLevel,
        originalLevel: originalLevel,
        originalTag: originalTag
      });

      if (logResults) {
        console.log(`Will change ${originalTag.toUpperCase()} → H${newLevel} (will add ${classPrefix}${originalLevel} class)`);
      }
    }

    previousLevel = newLevel;
  }

  // Apply DOM modifications
  elementsToReplace.forEach((item) => {
    const { original, newLevel, originalLevel, originalTag } = item;

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

    if (logResults) {
      console.log(`Replaced ${originalTag.toUpperCase()} with H${newLevel}, added ${classPrefix}${originalLevel} class`);
    }
  });

  if (logResults) {
    console.log(`Heading structure fix complete. Modified ${elementsToReplace.length} heading(s)`);
  }
}