import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';

describe('healHeadings - Configurable Class Prefix', () => {
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

    describe('Default "hs-" Prefix', () => {
        it('should use "hs-" prefix by default', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container);

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-4')).toBe(true);
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should use "hs-" prefix with boolean logResults for backwards compatibility', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h5>Section</h5>
            `;

            healHeadings(container, true); // Boolean logResults

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-5')).toBe(true);
            expect(heading.getAttribute('data-prev-heading')).toBe('5');
        });
    });

    describe('Custom Class Prefix', () => {
        it('should use custom prefix when specified', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container, { classPrefix: 'fs-' });

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('fs-4')).toBe(true);
            expect(heading.classList.contains('hs-4')).toBe(false);
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should use "heading-" prefix for semantic clarity', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h6>Deep Section</h6>
            `;

            healHeadings(container, { classPrefix: 'heading-' });

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('heading-6')).toBe(true);
            expect(heading.getAttribute('data-prev-heading')).toBe('6');
        });

        it('should use "style" prefix for generic styling', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h5>Section</h5>
                <h6>Subsection</h6>
            `;

            healHeadings(container, { classPrefix: 'style-' });

            const h2 = container.querySelector('h2');
            const h3 = container.querySelector('h3');
            
            expect(h2.classList.contains('style-5')).toBe(true);
            expect(h3.classList.contains('style-6')).toBe(true);
        });

        it('should handle empty string prefix', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container, { classPrefix: '' });

            const heading = container.querySelector('h2');
            // Empty prefix creates class like "-4" which is still added
            expect(heading.className).toContain('-4');
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should handle single character prefix', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container, { classPrefix: 'h' });

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('h4')).toBe(true);
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });
    });

    describe('Options Object with logResults', () => {
        it('should handle both classPrefix and logResults options', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            healHeadings(container, { 
                classPrefix: 'custom-', 
                logResults: true 
            });

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('custom-4')).toBe(true);
            
            // Verify logging occurred with custom prefix
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('custom-4 class')
            );

            consoleSpy.mockRestore();
        });

        it('should handle logResults: false with custom prefix', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h5>Section</h5>
            `;

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            healHeadings(container, { 
                classPrefix: 'test-', 
                logResults: false 
            });

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('test-5')).toBe(true);
            
            // Should not have logged details
            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Complex Hierarchy with Custom Prefix', () => {
        it('should maintain proper hierarchy progression with custom prefix', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4 class="original">First</h4>
                <h6 class="deep">Second</h6>
                <h3 class="back">Third</h3>
            `;

            healHeadings(container, { classPrefix: 'level-' });

            const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            
            // H1 unchanged
            expect(headings[0].tagName).toBe('H1');
            expect(headings[0].hasAttribute('data-prev-heading')).toBe(false);
            
            // H4 → H2 with level-4 class
            expect(headings[1].tagName).toBe('H2');
            expect(headings[1].className).toBe('original level-4');
            expect(headings[1].getAttribute('data-prev-heading')).toBe('4');
            
            // H6 → H3 with level-6 class
            expect(headings[2].tagName).toBe('H3');
            expect(headings[2].className).toBe('deep level-6');
            expect(headings[2].getAttribute('data-prev-heading')).toBe('6');
            
            // H3 stays H3 (H3 <= H3, so Math.max(2, 3) = 3)
            expect(headings[3].tagName).toBe('H3');
            expect(headings[3].className).toBe('back');
            expect(headings[3].hasAttribute('data-prev-heading')).toBe(false);
        });
    });

    describe('Integration with Selector-based Targeting', () => {
        it('should work with selectors and custom prefix', () => {
            container.innerHTML = `
                <div class="sidebar">
                    <h3>Sidebar</h3>
                    <h4>Sidebar Item</h4>
                </div>
                <div class="content">
                    <h1>Main Content</h1>
                    <h5>Content Section</h5>
                </div>
            `;

            healHeadings('.content', { classPrefix: 'content-' });

            // Sidebar should be unchanged
            const sidebarH3 = container.querySelector('.sidebar h3');
            const sidebarH4 = container.querySelector('.sidebar h4');
            expect(sidebarH3.hasAttribute('data-prev-heading')).toBe(false);
            expect(sidebarH4.hasAttribute('data-prev-heading')).toBe(false);

            // Content area should be processed with custom prefix
            const contentH2 = container.querySelector('.content h2');
            expect(contentH2).toBeTruthy();
            expect(contentH2.classList.contains('content-5')).toBe(true);
            expect(contentH2.getAttribute('data-prev-heading')).toBe('5');
        });
    });

    describe('Backwards Compatibility', () => {
        it('should maintain backwards compatibility with boolean second parameter', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            // Old API: healHeadings(container, true)
            healHeadings(container, true);

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-4')).toBe(true); // Should use default 'hs'
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should maintain backwards compatibility with boolean false', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            // Old API: healHeadings(container, false)
            healHeadings(container, false);

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-4')).toBe(true); // Should use default 'hs'
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should handle undefined options', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container, undefined);

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-4')).toBe(true); // Should use default 'hs'
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });

        it('should handle null options', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            healHeadings(container, null);

            const heading = container.querySelector('h2');
            expect(heading.classList.contains('hs-4')).toBe(true); // Should use default 'hs'
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
        });
    });
});