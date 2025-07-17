import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';

describe('healHeadings', () => {
    let container;

    beforeEach(() => {
        // Create a fresh container for each test
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Clean up after each test
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    it('should never modify H1 tags', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h1>Another H1</h1>
            <h2>Subtitle</h2>
        `;

        const h1Elements = container.querySelectorAll('h1');
        const originalH1Count = h1Elements.length;
        const originalH1Text = Array.from(h1Elements).map(h1 => h1.textContent);

        healHeadings(container);

        const newH1Elements = container.querySelectorAll('h1');
        expect(newH1Elements.length).toBe(originalH1Count);
        
        Array.from(newH1Elements).forEach((h1, index) => {
            expect(h1.textContent).toBe(originalH1Text[index]);
            expect(h1.hasAttribute('data-prev-heading')).toBe(false);
            expect(h1.classList.contains('hs-1')).toBe(false);
        });
    });

    it('should ignore headings placed before the main H1', () => {
        container.innerHTML = `
            <h2>Before H1</h2>
            <h3>Also before H1</h3>
            <h1>Main Title</h1>
            <h3>After H1</h3>
        `;

        healHeadings(container);

        const beforeH1Headings = container.querySelectorAll('h2, h3');
        const h1 = container.querySelector('h1');
        
        // Check that headings before H1 are unchanged
        const firstH2 = beforeH1Headings[0];
        const firstH3 = beforeH1Headings[1];
        
        expect(firstH2.tagName.toLowerCase()).toBe('h2');
        expect(firstH3.tagName.toLowerCase()).toBe('h3');
        expect(firstH2.hasAttribute('data-prev-heading')).toBe(false);
        expect(firstH3.hasAttribute('data-prev-heading')).toBe(false);

        // But the H3 after H1 should be changed to H2
        const afterH1Heading = container.querySelector('h1 ~ h2, h1 ~ h3');
        expect(afterH1Heading.tagName.toLowerCase()).toBe('h2');
        expect(afterH1Heading.getAttribute('data-prev-heading')).toBe('3');
    });

    it('should add correct hs-X class and data-prev-heading attribute when changing headings', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h4>Should become H2</h4>
        `;

        healHeadings(container);

        const changedHeading = container.querySelector('h2');
        expect(changedHeading).toBeTruthy();
        expect(changedHeading.classList.contains('hs-4')).toBe(true);
        expect(changedHeading.getAttribute('data-prev-heading')).toBe('4');
        expect(changedHeading.textContent).toBe('Should become H2');
    });

    it('should ignore headings inside lists with multiple li elements', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <ul>
                <li><h3>Item 1 Heading</h3></li>
                <li><h3>Item 2 Heading</h3></li>
                <li><h3>Item 3 Heading</h3></li>
            </ul>
            <h3>Regular heading</h3>
        `;

        healHeadings(container);

        // List headings should remain unchanged
        const listHeadings = container.querySelectorAll('li h3');
        expect(listHeadings.length).toBe(3);
        listHeadings.forEach(heading => {
            expect(heading.tagName.toLowerCase()).toBe('h3');
            expect(heading.hasAttribute('data-prev-heading')).toBe(false);
        });

        // Regular heading should be changed to H2
        const regularHeading = container.querySelector('ul ~ h2');
        expect(regularHeading).toBeTruthy();
        expect(regularHeading.getAttribute('data-prev-heading')).toBe('3');
    });

    it('should process headings inside lists with only a single li element', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <ul>
                <li><h4>Single item heading</h4></li>
            </ul>
        `;

        healHeadings(container);

        // Single list item heading should be processed
        const listHeading = container.querySelector('li h2');
        expect(listHeading).toBeTruthy();
        expect(listHeading.classList.contains('hs-4')).toBe(true);
        expect(listHeading.getAttribute('data-prev-heading')).toBe('4');
        expect(listHeading.textContent).toBe('Single item heading');
    });

    it('should leave perfectly valid heading hierarchy unchanged', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h2>Section 1</h2>
            <h3>Subsection 1.1</h3>
            <h3>Subsection 1.2</h3>
            <h2>Section 2</h2>
            <h3>Subsection 2.1</h3>
            <h4>Sub-subsection 2.1.1</h4>
        `;

        const originalHTML = container.innerHTML;
        healHeadings(container);

        // Check that no elements have data-prev-heading attribute
        const modifiedHeadings = container.querySelectorAll('[data-prev-heading]');
        expect(modifiedHeadings.length).toBe(0);

        // Check that no hs-X classes were added
        const styledHeadings = container.querySelectorAll('[class*="hs-"]');
        expect(styledHeadings.length).toBe(0);
    });

    it('should correct simple skipped level (h1 -> h3 becomes h1 -> h2)', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h3>Should become H2</h3>
        `;

        healHeadings(container);

        const h1 = container.querySelector('h1');
        const correctedHeading = container.querySelector('h2');
        
        expect(h1.textContent).toBe('Main Title');
        expect(correctedHeading).toBeTruthy();
        expect(correctedHeading.textContent).toBe('Should become H2');
        expect(correctedHeading.classList.contains('hs-3')).toBe(true);
        expect(correctedHeading.getAttribute('data-prev-heading')).toBe('3');
    });

    it('should handle complex hierarchy corrections', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h5>Jump to H5</h5>
            <h6>Then H6</h6>
            <h2>Back to H2</h2>
            <h5>Another jump</h5>
        `;

        healHeadings(container);

        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        expect(headings[0].tagName.toLowerCase()).toBe('h1'); // unchanged
        expect(headings[1].tagName.toLowerCase()).toBe('h2'); // h5 -> h2
        expect(headings[2].tagName.toLowerCase()).toBe('h3'); // h6 -> h3
        expect(headings[3].tagName.toLowerCase()).toBe('h2'); // h2 unchanged
        expect(headings[4].tagName.toLowerCase()).toBe('h3'); // h5 -> h3

        // Check attributes
        expect(headings[1].getAttribute('data-prev-heading')).toBe('5');
        expect(headings[2].getAttribute('data-prev-heading')).toBe('6');
        expect(headings[4].getAttribute('data-prev-heading')).toBe('5');
    });

    it('should handle missing container gracefully', () => {
        expect(() => healHeadings(null)).not.toThrow();
        expect(() => healHeadings(undefined)).not.toThrow();
        expect(() => healHeadings('invalid')).not.toThrow();
    });

    it('should handle container with no H1', () => {
        container.innerHTML = `
            <h2>No H1 here</h2>
            <h3>Just other headings</h3>
        `;

        const originalHTML = container.innerHTML;
        healHeadings(container);

        // Should remain unchanged
        expect(container.innerHTML).toBe(originalHTML);
    });

    it('should preserve all original attributes when changing headings', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <h4 id="test-id" class="original-class" data-custom="value">Test Heading</h4>
        `;

        healHeadings(container);

        const changedHeading = container.querySelector('h2');
        expect(changedHeading.id).toBe('test-id');
        expect(changedHeading.classList.contains('original-class')).toBe(true);
        expect(changedHeading.classList.contains('hs-4')).toBe(true);
        expect(changedHeading.getAttribute('data-custom')).toBe('value');
        expect(changedHeading.getAttribute('data-prev-heading')).toBe('4');
    });

    it('should handle ordered lists the same as unordered lists', () => {
        container.innerHTML = `
            <h1>Main Title</h1>
            <ol>
                <li><h3>Item 1</h3></li>
                <li><h3>Item 2</h3></li>
            </ol>
        `;

        healHeadings(container);

        // List headings should remain unchanged
        const listHeadings = container.querySelectorAll('li h3');
        expect(listHeadings.length).toBe(2);
        listHeadings.forEach(heading => {
            expect(heading.tagName.toLowerCase()).toBe('h3');
            expect(heading.hasAttribute('data-prev-heading')).toBe(false);
        });
    });
});