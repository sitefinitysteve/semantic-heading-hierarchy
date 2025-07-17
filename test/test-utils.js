import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load HTML fixture from the fixtures directory
 * @param {string} filename - The fixture file name
 * @returns {string} - The HTML content
 */
export function loadFixture(filename) {
    const fixturePath = join(__dirname, 'fixtures', filename);
    return readFileSync(fixturePath, 'utf-8');
}

/**
 * Create a test container with the given HTML content
 * @param {string} html - The HTML content to set
 * @returns {HTMLElement} - The container element
 */
export function createTestContainer(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
}

/**
 * Clean up a test container
 * @param {HTMLElement} container - The container to remove
 */
export function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * Count headings by level in a container
 * @param {HTMLElement} container - The container to analyze
 * @returns {Object} - Object with counts for each heading level
 */
export function countHeadingsByLevel(container) {
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
        counts[tag] = container.querySelectorAll(tag).length;
    });
    
    return counts;
}

/**
 * Get all headings with their modification status
 * @param {HTMLElement} container - The container to analyze
 * @returns {Array} - Array of heading objects with metadata
 */
export function analyzeHeadings(container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    return Array.from(headings).map(heading => ({
        tagName: heading.tagName.toLowerCase(),
        textContent: heading.textContent.trim().substring(0, 50),
        hasDataPrevHeading: heading.hasAttribute('data-prev-heading'),
        dataPrevHeading: heading.getAttribute('data-prev-heading'),
        hasHsClass: Array.from(heading.classList).some(cls => cls.startsWith('hs-')),
        hsClasses: Array.from(heading.classList).filter(cls => cls.startsWith('hs-')),
        isInList: !!heading.closest('li'),
        listSiblingCount: heading.closest('li') ? heading.closest('li').parentElement.querySelectorAll('li').length : 0
    }));
}