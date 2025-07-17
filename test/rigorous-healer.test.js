import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';

describe('healHeadings - Rigorous Core Functionality Tests', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Basic Hierarchy Correction', () => {
        it('should correct H1→H4 to H1→H2 with proper attributes', () => {
            container.innerHTML = `
                <h1>Main Title</h1>
                <h4 id="section" class="original" data-test="value">Section Title</h4>
            `;

            healHeadings(container);

            // Verify H1 unchanged
            const h1 = container.querySelector('h1');
            expect(h1.textContent).toBe('Main Title');
            expect(h1.tagName).toBe('H1');
            expect(h1.hasAttribute('data-prev-heading')).toBe(false);

            // Verify H4 became H2 with correct attributes
            const h2 = container.querySelector('h2');
            expect(h2).toBeTruthy();
            expect(h2.textContent).toBe('Section Title');
            expect(h2.tagName).toBe('H2');
            expect(h2.id).toBe('section');
            expect(h2.className).toBe('original hs-4');
            expect(h2.getAttribute('data-test')).toBe('value');
            expect(h2.getAttribute('data-prev-heading')).toBe('4');

            // Verify no H4 remains
            expect(container.querySelector('h4')).toBeNull();
        });

        it('should create proper hierarchy progression: H1→H4→H6→H2 becomes H1→H2→H3→H2', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>First Section</h4>
                <h6>Subsection</h6>
                <h2>Second Section</h2>
            `;

            healHeadings(container);

            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(headings).toHaveLength(4);

            // H1 unchanged
            expect(headings[0].tagName).toBe('H1');
            expect(headings[0].textContent).toBe('Main');
            expect(headings[0].hasAttribute('data-prev-heading')).toBe(false);

            // H4 becomes H2
            expect(headings[1].tagName).toBe('H2');
            expect(headings[1].textContent).toBe('First Section');
            expect(headings[1].getAttribute('data-prev-heading')).toBe('4');
            expect(headings[1].classList.contains('hs-4')).toBe(true);

            // H6 becomes H3 (one level deeper than previous H2)
            expect(headings[2].tagName).toBe('H3');
            expect(headings[2].textContent).toBe('Subsection');
            expect(headings[2].getAttribute('data-prev-heading')).toBe('6');
            expect(headings[2].classList.contains('hs-6')).toBe(true);

            // H2 stays H2
            expect(headings[3].tagName).toBe('H2');
            expect(headings[3].textContent).toBe('Second Section');
            expect(headings[3].hasAttribute('data-prev-heading')).toBe(false);
        });

        it('should handle complex level jumping: H1→H6→H5→H4→H3 becomes H1→H2→H3→H4→H3', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h6>Jump to H6</h6>
                <h5>Back to H5</h5>
                <h4>Back to H4</h4>
                <h3>Finally H3</h3>
            `;

            healHeadings(container);

            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(headings).toHaveLength(5);

            expect(headings[0].tagName).toBe('H1');
            
            // H6 becomes H2 (first after H1)
            expect(headings[1].tagName).toBe('H2');
            expect(headings[1].getAttribute('data-prev-heading')).toBe('6');
            
            // H5 becomes H3 (can go one level deeper than H2)
            expect(headings[2].tagName).toBe('H3');
            expect(headings[2].getAttribute('data-prev-heading')).toBe('5');
            
            // H4 stays H4 because H4 <= previous H3, so originalLevel is used
            expect(headings[3].tagName).toBe('H4');
            expect(headings[3].hasAttribute('data-prev-heading')).toBe(false);
            
            // H3 becomes H3 (going deeper from H2)
            expect(headings[4].tagName).toBe('H3');
            expect(headings[4].hasAttribute('data-prev-heading')).toBe(false);
        });
    });

    describe('List Detection Logic', () => {
        it('should ignore headings in multi-item lists but process others', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h5>Should become H2</h5>
                <ul>
                    <li><h4>Item 1</h4></li>
                    <li><h4>Item 2</h4></li>
                    <li><h4>Item 3</h4></li>
                </ul>
                <h6>Should become H3</h6>
            `;

            healHeadings(container);

            // Non-list headings should be corrected
            expect(container.querySelector('h2[data-prev-heading="5"]')).toBeTruthy();
            expect(container.querySelector('h3[data-prev-heading="6"]')).toBeTruthy();

            // List headings should remain unchanged
            const listHeadings = container.querySelectorAll('li h4');
            expect(listHeadings).toHaveLength(3);
            listHeadings.forEach(heading => {
                expect(heading.tagName).toBe('H4');
                expect(heading.hasAttribute('data-prev-heading')).toBe(false);
                expect(heading.classList.contains('hs-4')).toBe(false);
            });
        });

        it('should process headings in single-item lists', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <ul>
                    <li><h5 class="single">Single Item</h5></li>
                </ul>
                <h4>After list</h4>
            `;

            healHeadings(container);

            // Single-item list heading should be processed
            const singleHeading = container.querySelector('li h2');
            expect(singleHeading).toBeTruthy();
            expect(singleHeading.textContent).toBe('Single Item');
            expect(singleHeading.className).toBe('single hs-5');
            expect(singleHeading.getAttribute('data-prev-heading')).toBe('5');

            // Following heading should continue proper hierarchy
            const afterList = container.querySelector('h3[data-prev-heading="4"]');
            expect(afterList).toBeTruthy();
            expect(afterList.textContent).toBe('After list');
        });

        it('should handle nested lists correctly', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <ul>
                    <li>
                        <h5>Parent Item</h5>
                        <ul>
                            <li><h6>Nested Item 1</h6></li>
                            <li><h6>Nested Item 2</h6></li>
                        </ul>
                    </li>
                    <li><h5>Another Parent</h5></li>
                </ul>
            `;

            healHeadings(container);

            // Parent list has multiple items, so headings shouldn't change
            const parentHeadings = container.querySelectorAll('ul > li > h5');
            expect(parentHeadings).toHaveLength(2);
            parentHeadings.forEach(heading => {
                expect(heading.tagName).toBe('H5');
                expect(heading.hasAttribute('data-prev-heading')).toBe(false);
            });

            // Nested list also has multiple items, so shouldn't change
            const nestedHeadings = container.querySelectorAll('ul ul li h6');
            expect(nestedHeadings).toHaveLength(2);
            nestedHeadings.forEach(heading => {
                expect(heading.tagName).toBe('H6');
                expect(heading.hasAttribute('data-prev-heading')).toBe(false);
            });
        });
    });

    describe('DOM Structure Preservation', () => {
        it('should preserve exact DOM structure and all attributes', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <div class="section">
                    <h4 id="test" class="original highlight" data-custom="value" title="tooltip">
                        <span class="icon">→</span>
                        Section with <em>emphasis</em>
                    </h4>
                    <p>Content after heading</p>
                </div>
            `;

            healHeadings(container);

            const section = container.querySelector('.section');
            const heading = section.querySelector('h2');
            const paragraph = section.querySelector('p');

            // Verify heading transformation
            expect(heading).toBeTruthy();
            expect(heading.tagName).toBe('H2');
            expect(heading.id).toBe('test');
            expect(heading.className).toBe('original highlight hs-4');
            expect(heading.getAttribute('data-custom')).toBe('value');
            expect(heading.getAttribute('title')).toBe('tooltip');
            expect(heading.getAttribute('data-prev-heading')).toBe('4');

            // Verify inner HTML preserved exactly (with whitespace)
            expect(heading.innerHTML).toBe('\n                        <span class="icon">→</span>\n                        Section with <em>emphasis</em>\n                    ');

            // Verify DOM structure preserved
            expect(heading.nextElementSibling).toBe(paragraph);
            expect(heading.parentElement).toBe(section);
            expect(paragraph.textContent).toBe('Content after heading');
        });

        it('should handle headings with complex nested HTML', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h6>
                    <img src="icon.png" alt="icon" />
                    <a href="#section" class="link">
                        Section <code>with.code()</code>
                    </a>
                    <span class="badge">NEW</span>
                </h6>
            `;

            healHeadings(container);

            const heading = container.querySelector('h2');
            expect(heading.getAttribute('data-prev-heading')).toBe('6');
            
            // Verify complex HTML structure preserved
            const img = heading.querySelector('img');
            const link = heading.querySelector('a');
            const code = heading.querySelector('code');
            const badge = heading.querySelector('span.badge');

            expect(img.src).toContain('icon.png');
            expect(img.alt).toBe('icon');
            expect(link.href).toContain('#section');
            expect(link.className).toBe('link');
            expect(code.textContent).toBe('with.code()');
            expect(badge.textContent).toBe('NEW');
        });

        it('should handle existing hs-X classes by preserving them', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h5 class="existing hs-2 other">Title</h5>
            `;

            healHeadings(container);

            const heading = container.querySelector('h2');
            expect(heading.className).toBe('existing hs-2 other hs-5');
            expect(heading.getAttribute('data-prev-heading')).toBe('5');
        });
    });

    describe('Edge Cases and Error Conditions', () => {
        it('should handle headings with only whitespace', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>   \n\t   </h4>
                <h5>Real Content</h5>
            `;

            healHeadings(container);

            expect(container.querySelector('h2[data-prev-heading="4"]')).toBeTruthy();
            expect(container.querySelector('h3[data-prev-heading="5"]')).toBeTruthy();
            
            const whitespaceHeading = container.querySelector('h2[data-prev-heading="4"]');
            expect(whitespaceHeading.textContent).toBe('   \n\t   ');
        });

        it('should handle empty headings', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4></h4>
                <h5>Content</h5>
            `;

            healHeadings(container);

            const emptyHeading = container.querySelector('h2[data-prev-heading="4"]');
            expect(emptyHeading).toBeTruthy();
            expect(emptyHeading.textContent).toBe('');
            expect(emptyHeading.innerHTML).toBe('');
        });

        it('should handle headings before H1 by ignoring them completely', () => {
            container.innerHTML = `
                <h2>Before H1</h2>
                <h3>Also before</h3>
                <h1>Main Title</h1>
                <h4>After H1</h4>
            `;

            healHeadings(container);

            // Headings before H1 should be completely unchanged
            const beforeH1_1 = container.querySelector('h2');
            const beforeH1_2 = container.querySelector('h3');
            
            expect(beforeH1_1.textContent).toBe('Before H1');
            expect(beforeH1_1.hasAttribute('data-prev-heading')).toBe(false);
            expect(beforeH1_1.classList.contains('hs-2')).toBe(false);
            
            expect(beforeH1_2.textContent).toBe('Also before');
            expect(beforeH1_2.hasAttribute('data-prev-heading')).toBe(false);

            // Only heading after H1 should be processed
            const afterH1 = container.querySelector('h2[data-prev-heading="4"]');
            expect(afterH1).toBeTruthy();
            expect(afterH1.textContent).toBe('After H1');
        });

        it('should ignore additional H1 elements but continue processing after them', () => {
            container.innerHTML = `
                <h1>First H1</h1>
                <h4>After first H1</h4>
                <h1>Second H1</h1>
                <h5>After second H1</h5>
            `;

            healHeadings(container);

            // Both H1s should remain unchanged
            const h1s = container.querySelectorAll('h1');
            expect(h1s).toHaveLength(2);
            h1s.forEach(h1 => {
                expect(h1.tagName).toBe('H1');
                expect(h1.hasAttribute('data-prev-heading')).toBe(false);
            });

            // First heading after first H1 should be processed
            const firstAfter = container.querySelector('h2[data-prev-heading="4"]');
            expect(firstAfter).toBeTruthy();
            expect(firstAfter.textContent).toBe('After first H1');

            // Second H1 should be ignored, and processing should continue
            const secondAfter = container.querySelector('h3[data-prev-heading="5"]');
            expect(secondAfter).toBeTruthy();
            expect(secondAfter.textContent).toBe('After second H1');
        });

        it('should handle maximum heading levels (never go beyond H6)', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h2>Level 2</h2>
                <h3>Level 3</h3>
                <h4>Level 4</h4>
                <h5>Level 5</h5>
                <h6>Level 6</h6>
                <h6>Another H6</h6>
            `;

            healHeadings(container);

            // All should remain unchanged as hierarchy is already correct
            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                expect(heading.hasAttribute('data-prev-heading')).toBe(false);
            });

            // Test going beyond H6 - should cap at H6
            container.innerHTML = `
                <h1>Main</h1>
                <h6>First H6</h6>
                <h6>Second H6</h6>
            `;

            healHeadings(container);

            const newHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(newHeadings).toHaveLength(3);
            
            expect(newHeadings[0].tagName).toBe('H1');
            expect(newHeadings[1].tagName).toBe('H2'); // First H6 becomes H2
            expect(newHeadings[2].tagName).toBe('H3'); // Second H6 becomes H3 (min(6, 2+1) = 3)
            expect(newHeadings[1].getAttribute('data-prev-heading')).toBe('6');
            expect(newHeadings[2].getAttribute('data-prev-heading')).toBe('6');
        });

        it('should handle minimum heading levels (never create H1)', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h2>Back to H2</h2>
            `;

            healHeadings(container);

            // H2 should remain H2, not become H1
            const h2 = container.querySelector('h2');
            expect(h2.tagName).toBe('H2');
            expect(h2.hasAttribute('data-prev-heading')).toBe(false);
        });
    });

    describe('No H1 Scenarios', () => {
        it('should do nothing when no H1 exists', () => {
            container.innerHTML = `
                <h2>No H1 here</h2>
                <h3>Just other headings</h3>
                <h4>More headings</h4>
            `;

            const originalHTML = container.innerHTML;
            healHeadings(container);

            // Nothing should change
            expect(container.innerHTML).toBe(originalHTML);
        });

        it('should handle empty container gracefully', () => {
            container.innerHTML = '';
            
            expect(() => healHeadings(container)).not.toThrow();
            expect(container.innerHTML).toBe('');
        });
    });
});