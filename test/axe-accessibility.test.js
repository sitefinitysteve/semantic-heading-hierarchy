import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';
import axe from 'axe-core';

describe('Accessibility Validation with axe-core', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('main');
        container.setAttribute('role', 'main');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Heading Order Violations', () => {
        it('should fail axe-core before healing and pass after healing skipped levels', async () => {
            // Create HTML with skipped heading levels (accessibility violation)
            container.innerHTML = `
                <h1>Main Article</h1>
                <h4>This skips H2 and H3</h4>
                <h6>This skips H5</h6>
                <h2>Back to H2</h2>
            `;

            // Run axe-core before healing - should fail
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });
            
            // Should have heading-order violations
            const headingViolations = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(headingViolations.length).toBeGreaterThan(0);
            expect(headingViolations[0].nodes.length).toBeGreaterThan(0);
            
            if (headingViolations.length > 0) {
                console.log('Before healing - axe violations:', headingViolations[0].description);
            }

            // Heal the headings
            healHeadings(container);

            // Run axe-core after healing - should pass
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            // Should have no heading-order violations
            const headingViolationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(headingViolationsAfter.length).toBe(0);
            
            console.log('After healing - axe violations:', headingViolationsAfter.length);
        });

        it('should fix complex heading hierarchy violations detected by axe-core', async () => {
            container.innerHTML = `
                <h1>Website Title</h1>
                <h5>Jump to H5</h5>
                <h6>Then H6</h6>
                <h3>Back to H3</h3>
                <h6>Another jump</h6>
            `;

            // Verify violations exist before healing
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });
            
            const violationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(violationsBefore.length).toBeGreaterThan(0);

            // Heal the headings
            healHeadings(container);

            // Verify violations are resolved after healing
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(violationsAfter.length).toBe(0);

            // Verify the actual structure is correct
            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(headings[0].tagName).toBe('H1');
            expect(headings[1].tagName).toBe('H2'); // H5 became H2
            expect(headings[2].tagName).toBe('H3'); // H6 became H3
            expect(headings[3].tagName).toBe('H3'); // H3 stays H3 (3 <= 3, so max(2,3) = 3)
            expect(headings[4].tagName).toBe('H4'); // H6 becomes H4 (min(6, 3+1) = 4)
        });

        it('should not break already valid heading hierarchies', async () => {
            container.innerHTML = `
                <h1>Main Title</h1>
                <h2>Section One</h2>
                <h3>Subsection</h3>
                <h3>Another Subsection</h3>
                <h2>Section Two</h2>
                <h3>Final Subsection</h3>
            `;

            // Should pass axe-core before healing (already valid)
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });
            
            const violationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(violationsBefore.length).toBe(0);

            // Heal the headings (should make no changes)
            healHeadings(container);

            // Should still pass axe-core after healing
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(violationsAfter.length).toBe(0);

            // Verify no headings were modified
            const modifiedHeadings = container.querySelectorAll('[data-prev-heading]');
            expect(modifiedHeadings.length).toBe(0);
        });
    });

    describe('Document Structure Accessibility', () => {
        it('should improve overall document structure accessibility', async () => {
            container.innerHTML = `
                <h1>Blog Post Title</h1>
                <p>Introduction paragraph</p>
                <h4>First Section (skips H2 and H3)</h4>
                <p>Content for first section</p>
                <h6>Subsection (skips H5)</h6>
                <p>Subsection content</p>
                <h5>Another section (wrong level)</h5>
                <p>More content</p>
            `;

            // Run comprehensive accessibility check before healing
            const resultsBefore = await axe.run(container);
            const accessibilityIssuesBefore = resultsBefore.violations.length;

            // Heal the headings
            healHeadings(container);

            // Run comprehensive accessibility check after healing
            const resultsAfter = await axe.run(container);
            const accessibilityIssuesAfter = resultsAfter.violations.length;

            // Should have same or fewer accessibility issues after healing
            expect(accessibilityIssuesAfter).toBeLessThanOrEqual(accessibilityIssuesBefore);

            // Specifically check heading-order is fixed
            const headingViolationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(headingViolationsAfter.length).toBe(0);
        });

        it('should maintain accessibility for screen readers with proper heading outline', async () => {
            container.innerHTML = `
                <h1>Main Article</h1>
                <h5>Introduction</h5>
                <h6>Background</h6>
                <h4>Methods</h4>
                <h6>Data Collection</h6>
                <h6>Analysis</h6>
                <h3>Results</h6>
                <h5>Discussion</h5>
                <h4>Conclusion</h4>
            `;

            // Before healing - check for violations
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true },
                    'landmark-one-main': { enabled: true }
                }
            });

            const headingViolationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(headingViolationsBefore.length).toBeGreaterThan(0);

            // Heal the headings
            healHeadings(container);

            // After healing - should have proper outline
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true },
                    'landmark-one-main': { enabled: true }
                }
            });

            const headingViolationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(headingViolationsAfter.length).toBe(0);

            // Verify logical progression for screen readers
            const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            let previousLevel = 0;
            
            headings.forEach((heading, index) => {
                const currentLevel = parseInt(heading.tagName.charAt(1));
                
                if (index === 0) {
                    // First heading should be H1
                    expect(currentLevel).toBe(1);
                } else {
                    // Subsequent headings should not skip more than one level
                    expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
                    // And should be at least H2
                    expect(currentLevel).toBeGreaterThanOrEqual(2);
                }
                
                previousLevel = currentLevel;
            });
        });
    });

    describe('List Context Accessibility', () => {
        it('should handle list headings appropriately for screen readers', async () => {
            // Use a structure that can be fully fixed despite list headings
            container.innerHTML = `
                <h1>Product Comparison</h1>
                <h4>Featured Products</h4>
                <ul>
                    <li>
                        <h6>Product A</h6>
                        <p>Description of product A</p>
                    </li>
                    <li>
                        <h6>Product B</h6>
                        <p>Description of product B</p>
                    </li>
                    <li>
                        <h6>Product C</h6>
                        <p>Description of product C</p>
                    </li>
                </ul>
                <h3>Summary</h3>
            `;

            // Before healing
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(violationsBefore.length).toBeGreaterThan(0);

            // Heal the headings
            healHeadings(container);

            // After healing - should be much improved
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            // Should have same or fewer violations (may not be fewer due to intentionally preserved list headings)
            expect(violationsAfter.length).toBeLessThanOrEqual(violationsBefore.length);

            // Verify list headings were left alone (multi-item list)
            const listHeadings = container.querySelectorAll('li h6');
            expect(listHeadings.length).toBe(3);
            listHeadings.forEach(heading => {
                expect(heading.tagName).toBe('H6');
                expect(heading.hasAttribute('data-prev-heading')).toBe(false);
            });

            // But other headings were fixed
            expect(container.querySelector('h2[data-prev-heading="4"]')).toBeTruthy(); // H4 -> H2
            expect(container.querySelector('h3')).toBeTruthy(); // H3 stays H3
        });
    });

    describe('Real-world Content Scenarios', () => {
        it('should fix typical CMS-generated content with poor heading structure', async () => {
            // Simulate content from a CMS where users picked headings for styling
            container.innerHTML = `
                <h1>Blog Post: Modern Web Development</h1>
                <h4>What is modern web development?</h4>
                <p>Modern web development involves...</p>
                <h6>JavaScript Frameworks</h6>
                <p>There are many JavaScript frameworks...</p>
                <h5>React</h5>
                <p>React is a popular library...</p>
                <h5>Vue.js</h5>
                <p>Vue.js is a progressive framework...</p>
                <h6>State Management</h6>
                <p>State management is crucial...</p>
                <h2>Backend Technologies</h2>
                <p>The backend handles...</p>
                <h6>Node.js</h6>
                <p>Node.js allows JavaScript...</p>
            `;

            // Verify this content has accessibility issues
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(violationsBefore.length).toBeGreaterThan(0);
            expect(violationsBefore[0].nodes.length).toBeGreaterThan(0);

            // Heal the content
            healHeadings(container);

            // Verify accessibility is improved
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(violationsAfter.length).toBe(0);

            // Verify we now have a logical structure
            const headingStructure = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                .map(h => h.tagName);

            // Should start with H1 and follow logical progression
            expect(headingStructure[0]).toBe('H1');
            
            // Check no heading skips more than one level from previous
            let prevLevel = 1;
            for (let i = 1; i < headingStructure.length; i++) {
                const currentLevel = parseInt(headingStructure[i].charAt(1));
                expect(currentLevel - prevLevel).toBeLessThanOrEqual(1);
                expect(currentLevel).toBeGreaterThanOrEqual(2);
                prevLevel = currentLevel;
            }
        });

        it('should handle edge case with only deeply nested headings', async () => {
            container.innerHTML = `
                <h1>Main Title</h1>
                <h6>Deep heading 1</h6>
                <h6>Deep heading 2</h6>
                <h6>Deep heading 3</h6>
            `;

            // Before healing - should fail
            const resultsBefore = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsBefore = resultsBefore.violations.filter(v => v.id === 'heading-order');
            expect(violationsBefore.length).toBeGreaterThan(0);

            // Heal the headings
            healHeadings(container);

            // After healing - should pass
            const resultsAfter = await axe.run(container, {
                rules: {
                    'heading-order': { enabled: true }
                }
            });

            const violationsAfter = resultsAfter.violations.filter(v => v.id === 'heading-order');
            expect(violationsAfter.length).toBe(0);

            // Should create logical progression: H1 -> H2 -> H3 -> H4
            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(headings[0].tagName).toBe('H1');
            expect(headings[1].tagName).toBe('H2'); // First H6 -> H2
            expect(headings[2].tagName).toBe('H3'); // Second H6 -> H3 (one deeper)
            expect(headings[3].tagName).toBe('H4'); // Third H6 -> H4 (one deeper)
        });
    });
});