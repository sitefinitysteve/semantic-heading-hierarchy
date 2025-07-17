/**
 * Corrects improper heading hierarchies by ensuring proper semantic structure
 * @param {string|Element} [containerOrSelector=document.body] - CSS selector string or DOM element to search within
 * @param {boolean|object} [options=false] - Options object or boolean for logResults (for backwards compatibility)
 * @param {boolean} [options.logResults=false] - Whether to log detailed results
 * @param {string} [options.classPrefix='hs'] - Prefix for styling classes (e.g., 'hs' creates 'hs-2', 'hs-3', etc.)
 */
function healHeadings(containerOrSelector = document.body, options = false) {
    // Handle backwards compatibility - if options is boolean, treat as logResults
    let logResults = false;
    let classPrefix = 'hs';
    
    if (typeof options === 'boolean') {
        logResults = options;
    } else if (typeof options === 'object' && options !== null) {
        logResults = options.logResults || false;
        classPrefix = options.classPrefix || 'hs';
    }
    
    // Check localStorage for global logging override
    if (typeof localStorage !== 'undefined') {
        const logOverride = localStorage.getItem('healHeadings.logResults');
        if (logOverride !== null) {
            logResults = logOverride === 'true';
        }
    }
    
    let container;
    
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

    // Get all headings within the container, but only those that come after the H1
    const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Index = allHeadings.indexOf(h1Element);
    
    // Get headings after the first H1 (excluding any other H1s)
    const headingsAfterH1 = allHeadings.slice(h1Index + 1);
    const headings = headingsAfterH1.filter(heading => heading.tagName.toLowerCase() !== 'h1');

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
    const elementsToReplace = [];

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
            const siblingItems = parentList.querySelectorAll('li');
            
            if (siblingItems.length > 1) {
                // Skip headings in lists with multiple items
                if (logResults) {
                    console.log(`Skipping ${originalTag} in list with ${siblingItems.length} items`);
                }
                continue;
            }
        }

        // Determine the correct level
        let newLevel;
        if (originalLevel <= previousLevel) {
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
                console.log(`Will change ${originalTag.toUpperCase()} → H${newLevel} (will add ${classPrefix}-${originalLevel} class)`);
            }
        }

        previousLevel = newLevel;
    }

    // Apply DOM modifications
    elementsToReplace.forEach((item) => {
        const { original, newLevel, originalLevel, originalTag } = item;

        // FIRST: Add visual styling class to original element to prevent FLOUT
        original.classList.add(`${classPrefix}-${originalLevel}`);

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
        original.parentNode.replaceChild(newHeading, original);

        if (logResults) {
            console.log(`Replaced ${originalTag.toUpperCase()} with H${newLevel}, added ${classPrefix}-${originalLevel} class`);
        }
    });

    if (logResults) {
        console.log(`Heading structure fix complete. Modified ${elementsToReplace.length} heading(s)`);
    }
}

// Helper functions for localStorage logging control
function enableHeadingLogging() {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('healHeadings.logResults', 'true');
        console.log('✅ Detailed heading healing logging ENABLED globally');
    } else {
        console.warn('localStorage not available - cannot enable global logging');
    }
}

function disableHeadingLogging() {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('healHeadings.logResults', 'false');
        console.log('❌ Detailed heading healing logging DISABLED globally');
    } else {
        console.warn('localStorage not available - cannot disable global logging');
    }
}

function clearHeadingLogging() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('healHeadings.logResults');
        console.log('🔄 Heading healing logging reset - will use function parameter');
    } else {
        console.warn('localStorage not available - cannot clear global logging');
    }
}

function getHeadingLoggingStatus() {
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

// Export the function and helpers
export { 
    healHeadings, 
    enableHeadingLogging, 
    disableHeadingLogging, 
    clearHeadingLogging, 
    getHeadingLoggingStatus 
};

// Also make them available on window object for browser usage
if (typeof window !== 'undefined') {
    window.healHeadings = healHeadings;
    window.enableHeadingLogging = enableHeadingLogging;
    window.disableHeadingLogging = disableHeadingLogging;
    window.clearHeadingLogging = clearHeadingLogging;
    window.getHeadingLoggingStatus = getHeadingLoggingStatus;
}