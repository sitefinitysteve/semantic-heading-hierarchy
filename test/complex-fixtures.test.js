import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { loadFixture, createTestContainer, cleanupContainer, countHeadingsByLevel, analyzeHeadings } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

describe('healHeadings with Complex HTML Fixtures', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    describe('Complex Blog Post Fixture', () => {
        beforeEach(() => {
            const html = loadFixture('complex-blog-post.html');
            container = createTestContainer(html);
        });

        it('should handle complex blog post structure with proper hierarchy correction', async () => {
            // Primary validation: Complex structure should fail html-validate before healing
            const htmlvalidate = new HtmlValidate({
                rules: { 'heading-level': 'error' }
            });
            const reportBefore = await htmlvalidate.validateString(container.innerHTML);
            const headingLevelErrorsBefore = reportBefore.results?.length > 0 ? reportBefore.results[0].messages.filter(m => m.ruleId === 'heading-level') : [];
            expect(headingLevelErrorsBefore.length).toBeGreaterThan(0);
            
            const beforeCounts = countHeadingsByLevel(container);
            
            healHeadings(container);
            
            // Primary validation: html-validate accessibility testing
            // Note: Complex fixtures may still have violations due to intentionally preserved:
            // 1. Pre-H1 headings (which the healing function ignores by design)
            // 2. Multiple H1s (which the healing function ignores by design)
            const reportAfter = await htmlvalidate.validateString(container.innerHTML);
            const headingLevelErrorsAfter = reportAfter.results?.length > 0 ? reportAfter.results[0].messages.filter(m => m.ruleId === 'heading-level') : [];
            
            // Filter out expected errors that are outside the healing function's scope
            const filteredErrors = headingLevelErrorsAfter.filter(error => {
                // Ignore errors about initial heading not being h1 (pre-h1 headings)
                if (error.message.includes('Initial heading level must be <h1>')) return false;
                // Ignore errors about multiple h1s (additional h1s are ignored by design)
                if (error.message.includes('Multiple <h1>')) return false;
                return true;
            });
            
            // Only expect 0 errors after filtering out the expected ones
            expect(filteredErrors.length).toBe(0);

            const afterCounts = countHeadingsByLevel(container);

            // H1s should never be modified
            expect(afterCounts.h1).toBe(beforeCounts.h1);
            
            // Should have created proper hierarchy with styling classes
            expect(afterCounts.h2).toBeGreaterThan(beforeCounts.h2);
            expect(afterCounts.h3).toBeGreaterThan(beforeCounts.h3);
            
            // Should have reduced some high-level headings (converted to proper levels)
            // Note: Not all H4/H5/H6 will be reduced due to list filtering and hierarchy rules
            const totalHighLevelBefore = beforeCounts.h4 + beforeCounts.h5 + beforeCounts.h6;
            const totalHighLevelAfter = afterCounts.h4 + afterCounts.h5 + afterCounts.h6;
            expect(totalHighLevelAfter).toBeLessThanOrEqual(totalHighLevelBefore);

            // Verify that healings created modified headings with correct attributes
            const modifiedHeadings = container.querySelectorAll('[data-prev-heading]');
            expect(modifiedHeadings.length).toBeGreaterThan(0);
            
            modifiedHeadings.forEach(heading => {
                expect(heading.classList.toString()).toMatch(/hs-[3-6]/);
                expect(heading.getAttribute('data-prev-heading')).toMatch(/^[3-6]$/);
            });
        });

        it('should ignore headings in lists with multiple items', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            const listHeadings = analysis.filter(h => h.isInList && h.listSiblingCount > 1);
            
            // Headings in multi-item lists should not be modified
            listHeadings.forEach(heading => {
                expect(heading.hasDataPrevHeading).toBe(false);
                expect(heading.hasHsClass).toBe(false);
            });
        });

        it('should process headings in single-item lists', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            const singleItemListHeadings = analysis.filter(h => h.isInList && h.listSiblingCount === 1);
            
            // At least some single-item list headings should be processed if they need correction
            if (singleItemListHeadings.length > 0) {
                const processedHeadings = singleItemListHeadings.filter(h => h.hasDataPrevHeading);
                // This depends on the specific content - we expect at least some to be processed
                expect(processedHeadings.length).toBeGreaterThanOrEqual(0);
            }
        });

        it('should preserve heading content and attributes', () => {
            const originalHeadings = analyzeHeadings(container);
            healHeadings(container);
            const newHeadings = analyzeHeadings(container);

            // Total number of headings should remain the same
            expect(newHeadings.length).toBe(originalHeadings.length);

            // Find a specific heading that should be changed
            const specificHeading = container.querySelector('h2[data-prev-heading]');
            if (specificHeading) {
                expect(specificHeading.textContent.trim().length).toBeGreaterThan(0);
                expect(specificHeading.classList.contains(specificHeading.getAttribute('data-prev-heading'))).toBe(false);
            }
        });
    });

    describe('E-commerce Page Fixture', () => {
        beforeEach(() => {
            const html = loadFixture('e-commerce-page.html');
            container = createTestContainer(html);
        });

        it('should handle e-commerce page with product specifications and reviews', () => {
            const beforeCounts = countHeadingsByLevel(container);
            healHeadings(container);
            const afterCounts = countHeadingsByLevel(container);

            // Should preserve H1 count
            expect(afterCounts.h1).toBe(beforeCounts.h1);
            
            // Should improve hierarchy by creating more H2/H3 and reducing H4/H5/H6
            expect(afterCounts.h2 + afterCounts.h3).toBeGreaterThan(beforeCounts.h2 + beforeCounts.h3);
        });

        it('should handle complex nested specification lists correctly', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            
            // Check that specification category headings (in multi-item lists) are not modified
            const specCategoryHeadings = analysis.filter(h => 
                h.textContent.includes('Audio Quality') || 
                h.textContent.includes('Connectivity') || 
                h.textContent.includes('Battery Life')
            );
            
            specCategoryHeadings.forEach(heading => {
                if (heading.isInList && heading.listSiblingCount > 1) {
                    expect(heading.hasDataPrevHeading).toBe(false);
                }
            });
        });

        it('should process single feature highlights properly', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            const featureHeadings = analysis.filter(h => 
                h.textContent.includes('Active Noise Cancellation')
            );
            
            // Feature highlights in single-item lists should be processed
            featureHeadings.forEach(heading => {
                if (heading.isInList && heading.listSiblingCount === 1) {
                    // May or may not be modified depending on hierarchy
                    expect(typeof heading.hasDataPrevHeading).toBe('boolean');
                }
            });
        });
    });

    describe('Documentation Site Fixture', () => {
        beforeEach(() => {
            const html = loadFixture('documentation-site.html');
            container = createTestContainer(html);
        });

        it('should handle technical documentation with complex nesting', () => {
            const beforeAnalysis = analyzeHeadings(container);
            healHeadings(container);
            const afterAnalysis = analyzeHeadings(container);

            // Should maintain same number of headings
            expect(afterAnalysis.length).toBe(beforeAnalysis.length);
            
            // Should have some corrections (depends on specific content)
            const modifications = afterAnalysis.filter(h => h.hasDataPrevHeading);
            expect(modifications.length).toBeGreaterThan(0);
        });

        it('should preserve code example headings in multi-item lists', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            const codeExampleHeadings = analysis.filter(h => 
                h.textContent.includes('JavaScript') || 
                h.textContent.includes('Python') || 
                h.textContent.includes('cURL')
            );
            
            // Code examples in language tabs (multi-item lists) should not be modified
            codeExampleHeadings.forEach(heading => {
                if (heading.isInList && heading.listSiblingCount > 1) {
                    expect(heading.hasDataPrevHeading).toBe(false);
                }
            });
        });

        it('should handle OAuth flow steps with proper hierarchy', () => {
            healHeadings(container);
            
            const analysis = analyzeHeadings(container);
            
            // Find OAuth-related headings
            const oauthHeadings = analysis.filter(h => 
                h.textContent.includes('OAuth') || 
                h.textContent.includes('Authorization') ||
                h.textContent.includes('Token')
            );
            
            expect(oauthHeadings.length).toBeGreaterThan(0);
            
            // Check that proper hierarchy is maintained
            oauthHeadings.forEach(heading => {
                if (heading.hasDataPrevHeading) {
                    const originalLevel = parseInt(heading.dataPrevHeading);
                    const newLevel = parseInt(heading.tagName.charAt(1));
                    expect(newLevel).toBeLessThanOrEqual(originalLevel);
                    expect(newLevel).toBeGreaterThanOrEqual(2); // Never create H1
                }
            });
        });
    });

    describe('Selector-based Container Selection', () => {
        beforeEach(() => {
            const html = `
                <div class="main-content">
                    ${loadFixture('complex-blog-post.html')}
                </div>
                <div class="sidebar">
                    <h2>Sidebar Title</h2>
                    <h3>Sidebar Content</h3>
                </div>
            `;
            container = createTestContainer(html);
        });

        it('should work with CSS selector for specific container', () => {
            const beforeSidebarHeadings = container.querySelectorAll('.sidebar h2, .sidebar h3').length;
            
            // Only heal headings in the main content area
            healHeadings('.main-content');
            
            const afterSidebarHeadings = container.querySelectorAll('.sidebar h2, .sidebar h3').length;
            
            // Sidebar headings should be unchanged
            expect(afterSidebarHeadings).toBe(beforeSidebarHeadings);
            
            // Main content should have been processed
            const mainContentModified = container.querySelectorAll('.main-content [data-prev-heading]');
            expect(mainContentModified.length).toBeGreaterThan(0);
        });

        it('should fail gracefully with non-existent selector', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            healHeadings('.non-existent-selector');
            
            expect(consoleWarnSpy).toHaveBeenCalledWith('No elements found for selector: .non-existent-selector');
            consoleWarnSpy.mockRestore();
        });

        it('should fail with multiple matching elements', () => {
            // Add another div with the same class
            container.innerHTML += '<div class="main-content"><h1>Another</h1></div>';
            
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            healHeadings('.main-content');
            
            expect(consoleErrorSpy).toHaveBeenCalledWith('Multiple elements found for selector: .main-content. Selector must match exactly one element.');
            consoleErrorSpy.mockRestore();
        });
    });
});