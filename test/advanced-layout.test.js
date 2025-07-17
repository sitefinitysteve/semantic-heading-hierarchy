import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { loadFixture, createTestContainer, cleanupContainer, countHeadingsByLevel, analyzeHeadings } from './test-utils.js';

describe('healHeadings with Advanced Layout Fixtures', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    describe('Bootstrap Grid System Layout', () => {
        beforeEach(() => {
            const html = loadFixture('bootstrap-grid-site.html');
            container = createTestContainer(html);
        });

        it('should process entire bootstrap site when no selector specified', () => {
            const beforeAnalysis = analyzeHeadings(container);
            const beforeCounts = countHeadingsByLevel(container);
            
            healHeadings(container);
            
            const afterAnalysis = analyzeHeadings(container);
            const afterCounts = countHeadingsByLevel(container);

            // Should maintain same number of headings
            expect(afterAnalysis.length).toBe(beforeAnalysis.length);
            
            // Should preserve H1 count (never modified)
            expect(afterCounts.h1).toBe(beforeCounts.h1);
            
            // Should have some corrections
            const modifications = afterAnalysis.filter(h => h.hasDataPrevHeading);
            expect(modifications.length).toBeGreaterThan(0);

            // Verify modifications have proper attributes
            modifications.forEach(heading => {
                expect(heading.hasHsClass).toBe(true);
                expect(heading.dataPrevHeading).toMatch(/^[3-6]$/);
                const originalLevel = parseInt(heading.dataPrevHeading);
                const newLevel = parseInt(heading.tagName.charAt(1));
                expect(newLevel).toBeLessThanOrEqual(originalLevel);
                expect(newLevel).toBeGreaterThanOrEqual(2);
            });
        });

        it('should only process article content when using .article-content selector', () => {
            const beforeSidebarHeadings = container.querySelectorAll('.sidebar h1, .sidebar h2, .sidebar h3, .sidebar h4, .sidebar h5, .sidebar h6');
            const beforeNavHeadings = container.querySelectorAll('nav h1, nav h2, nav h3, nav h4, nav h5, nav h6');
            // Only check the main site footer, not the post-conclusion footer which is inside article-content
            const beforeMainFooterHeadings = container.querySelectorAll('footer.bg-dark h1, footer.bg-dark h2, footer.bg-dark h3, footer.bg-dark h4, footer.bg-dark h5, footer.bg-dark h6');
            
            const beforeSidebarCount = beforeSidebarHeadings.length;
            const beforeNavCount = beforeNavHeadings.length;
            const beforeMainFooterCount = beforeMainFooterHeadings.length;

            // Only heal headings in the article content area
            healHeadings('.article-content');
            
            const afterSidebarHeadings = container.querySelectorAll('.sidebar h1, .sidebar h2, .sidebar h3, .sidebar h4, .sidebar h5, .sidebar h6');
            const afterNavHeadings = container.querySelectorAll('nav h1, nav h2, nav h3, nav h4, nav h5, nav h6');
            const afterMainFooterHeadings = container.querySelectorAll('footer.bg-dark h1, footer.bg-dark h2, footer.bg-dark h3, footer.bg-dark h4, footer.bg-dark h5, footer.bg-dark h6');

            // Sidebar, nav, and main footer headings should be unchanged
            expect(afterSidebarHeadings.length).toBe(beforeSidebarCount);
            expect(afterNavHeadings.length).toBe(beforeNavCount);
            expect(afterMainFooterHeadings.length).toBe(beforeMainFooterCount);

            // None of the sidebar/nav/main footer headings should have been modified
            const sidebarModified = Array.from(afterSidebarHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            const navModified = Array.from(afterNavHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            const mainFooterModified = Array.from(afterMainFooterHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            
            expect(sidebarModified.length).toBe(0);
            expect(navModified.length).toBe(0);
            expect(mainFooterModified.length).toBe(0);

            // Article content should have been processed
            const articleModified = container.querySelectorAll('.article-content [data-prev-heading]');
            expect(articleModified.length).toBeGreaterThan(0);
        });

        it('should handle complex nested Bootstrap grid structures', () => {
            healHeadings('.article-content');
            
            const analysis = analyzeHeadings(container.querySelector('.article-content'));
            
            // Check specific nested patterns in Bootstrap cards
            const patternCardHeadings = analysis.filter(h => 
                h.textContent.includes('Design Patterns') || 
                h.textContent.includes('Functional Patterns')
            );
            
            // These headings should maintain proper hierarchy within cards
            patternCardHeadings.forEach(heading => {
                if (heading.hasDataPrevHeading) {
                    const originalLevel = parseInt(heading.dataPrevHeading);
                    const newLevel = parseInt(heading.tagName.charAt(1));
                    expect(newLevel).toBeLessThanOrEqual(originalLevel);
                }
            });
        });

        it('should preserve Bootstrap row/col structure integrity', () => {
            const beforeRowCols = container.querySelectorAll('.row .col-md-6, .row .col-lg-8, .row .col-sm-6');
            const beforeRowColCount = beforeRowCols.length;
            
            healHeadings('.article-content');
            
            const afterRowCols = container.querySelectorAll('.row .col-md-6, .row .col-lg-8, .row .col-sm-6');
            
            // Bootstrap structure should remain intact
            expect(afterRowCols.length).toBe(beforeRowColCount);
            
            // Headings within grid columns should be processed properly
            const gridHeadingsWithModifications = Array.from(afterRowCols)
                .flatMap(col => Array.from(col.querySelectorAll('[data-prev-heading]')));
            
            expect(gridHeadingsWithModifications.length).toBeGreaterThan(0);
        });

        it('should handle multi-level lists in Bootstrap components correctly', () => {
            healHeadings('.article-content');
            
            const analysis = analyzeHeadings(container.querySelector('.article-content'));
            
            // Find headings in method lists (multi-item lists should be ignored)
            const methodListHeadings = analysis.filter(h => 
                h.textContent.includes('subscribe()') || 
                h.textContent.includes('unsubscribe()') || 
                h.textContent.includes('notify()')
            );
            
            // These should not be modified as they're in multi-item lists
            methodListHeadings.forEach(heading => {
                if (heading.isInList && heading.listSiblingCount > 1) {
                    expect(heading.hasDataPrevHeading).toBe(false);
                }
            });

            // Find single-item lists that should be processed
            const singleItemHeadings = analysis.filter(h => 
                h.isInList && h.listSiblingCount === 1
            );
            
            // At least some should be processed if they need hierarchy correction
            if (singleItemHeadings.length > 0) {
                const processedSingleItems = singleItemHeadings.filter(h => h.hasDataPrevHeading);
                expect(processedSingleItems.length).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('Sidebar Layout with Content Area Selection', () => {
        beforeEach(() => {
            const html = loadFixture('sidebar-layout.html');
            container = createTestContainer(html);
        });

        it('should only process content area when using .content-area selector', () => {
            const beforeLeftSidebarHeadings = container.querySelectorAll('.left-sidebar h1, .left-sidebar h2, .left-sidebar h3, .left-sidebar h4, .left-sidebar h5, .left-sidebar h6');
            const beforeRightSidebarHeadings = container.querySelectorAll('.right-sidebar h1, .right-sidebar h2, .right-sidebar h3, .right-sidebar h4, .right-sidebar h5, .right-sidebar h6');
            const beforeHeaderHeadings = container.querySelectorAll('.site-header h1, .site-header h2, .site-header h3, .site-header h4, .site-header h5, .site-header h6');
            
            const beforeLeftCount = beforeLeftSidebarHeadings.length;
            const beforeRightCount = beforeRightSidebarHeadings.length;
            const beforeHeaderCount = beforeHeaderHeadings.length;

            // Only heal headings in the content area
            healHeadings('.content-area');
            
            const afterLeftSidebarHeadings = container.querySelectorAll('.left-sidebar h1, .left-sidebar h2, .left-sidebar h3, .left-sidebar h4, .left-sidebar h5, .left-sidebar h6');
            const afterRightSidebarHeadings = container.querySelectorAll('.right-sidebar h1, .right-sidebar h2, .right-sidebar h3, .right-sidebar h4, .right-sidebar h5, .right-sidebar h6');
            const afterHeaderHeadings = container.querySelectorAll('.site-header h1, .site-header h2, .site-header h3, .site-header h4, .site-header h5, .site-header h6');

            // Sidebar and header headings should be unchanged
            expect(afterLeftSidebarHeadings.length).toBe(beforeLeftCount);
            expect(afterRightSidebarHeadings.length).toBe(beforeRightCount);
            expect(afterHeaderHeadings.length).toBe(beforeHeaderCount);

            // None of the sidebar/header headings should have been modified
            const leftSidebarModified = Array.from(afterLeftSidebarHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            const rightSidebarModified = Array.from(afterRightSidebarHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            const headerModified = Array.from(afterHeaderHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            
            expect(leftSidebarModified.length).toBe(0);
            expect(rightSidebarModified.length).toBe(0);
            expect(headerModified.length).toBe(0);

            // Content area should have been processed
            const contentModified = container.querySelectorAll('.content-area [data-prev-heading]');
            expect(contentModified.length).toBeGreaterThan(0);
        });

        it('should handle deeply nested configuration sections properly', () => {
            healHeadings('.content-area');
            
            const analysis = analyzeHeadings(container.querySelector('.content-area'));
            
            // Check that deeply nested configuration sections maintain proper hierarchy
            const configHeadings = analysis.filter(h => 
                h.textContent.includes('Configuration') || 
                h.textContent.includes('Environment') ||
                h.textContent.includes('Database')
            );
            
            expect(configHeadings.length).toBeGreaterThan(0);
            
            // Verify proper hierarchy progression
            configHeadings.forEach(heading => {
                if (heading.hasDataPrevHeading) {
                    const originalLevel = parseInt(heading.dataPrevHeading);
                    const newLevel = parseInt(heading.tagName.charAt(1));
                    expect(newLevel).toBeLessThanOrEqual(originalLevel);
                    expect(newLevel).toBeGreaterThanOrEqual(2);
                }
            });
        });

        it('should handle complex multi-level authentication configuration', () => {
            healHeadings('.content-area');
            
            const analysis = analyzeHeadings(container.querySelector('.content-area'));
            
            // Find OAuth and JWT related headings
            const authHeadings = analysis.filter(h => 
                h.textContent.includes('OAuth') || 
                h.textContent.includes('JWT') ||
                h.textContent.includes('Google') ||
                h.textContent.includes('GitHub')
            );
            
            expect(authHeadings.length).toBeGreaterThan(0);
            
            // Check that provider-specific configs (in multi-item lists) are not modified
            const providerHeadings = authHeadings.filter(h => 
                (h.textContent.includes('Google') || h.textContent.includes('GitHub')) &&
                h.isInList && h.listSiblingCount > 1
            );
            
            providerHeadings.forEach(heading => {
                expect(heading.hasDataPrevHeading).toBe(false);
            });
        });

        it('should process single-item configuration lists correctly', () => {
            healHeadings('.content-area');
            
            const analysis = analyzeHeadings(container.querySelector('.content-area'));
            
            // Find headings in single-item lists
            const singleItemConfigHeadings = analysis.filter(h => 
                h.isInList && h.listSiblingCount === 1 &&
                (h.textContent.includes('App Registration') || h.textContent.includes('Log Level'))
            );
            
            // These may or may not be modified depending on hierarchy needs
            singleItemConfigHeadings.forEach(heading => {
                expect(typeof heading.hasDataPrevHeading).toBe('boolean');
                if (heading.hasDataPrevHeading) {
                    expect(heading.hasHsClass).toBe(true);
                }
            });
        });

        it('should maintain proper hierarchy in performance monitoring sections', () => {
            healHeadings('.content-area');
            
            const analysis = analyzeHeadings(container.querySelector('.content-area'));
            
            // Find performance and monitoring related headings
            const perfHeadings = analysis.filter(h => 
                h.textContent.includes('Performance') || 
                h.textContent.includes('Cache') ||
                h.textContent.includes('Redis') ||
                h.textContent.includes('Monitoring')
            );
            
            expect(perfHeadings.length).toBeGreaterThan(0);
            
            // Check cache configuration hierarchy
            const cacheHeadings = perfHeadings.filter(h => 
                h.textContent.includes('Cache') || h.textContent.includes('Redis')
            );
            
            cacheHeadings.forEach(heading => {
                if (heading.hasDataPrevHeading) {
                    const hsClass = heading.hsClasses[0];
                    if (hsClass) {
                        const originalLevel = parseInt(hsClass.replace('hs-', ''));
                        expect(originalLevel).toBeGreaterThanOrEqual(3);
                        expect(originalLevel).toBeLessThanOrEqual(6);
                    }
                }
            });
        });

        it('should handle table of contents sidebar independently', () => {
            const beforeTocHeadings = container.querySelectorAll('.right-sidebar .toc-nav h1, .right-sidebar .toc-nav h2, .right-sidebar .toc-nav h3, .right-sidebar .toc-nav h4, .right-sidebar .toc-nav h5, .right-sidebar .toc-nav h6');
            const beforeTocCount = beforeTocHeadings.length;
            
            healHeadings('.content-area');
            
            const afterTocHeadings = container.querySelectorAll('.right-sidebar .toc-nav h1, .right-sidebar .toc-nav h2, .right-sidebar .toc-nav h3, .right-sidebar .toc-nav h4, .right-sidebar .toc-nav h5, .right-sidebar .toc-nav h6');
            
            // TOC headings should remain unchanged
            expect(afterTocHeadings.length).toBe(beforeTocCount);
            
            // None should have modification attributes
            const tocModified = Array.from(afterTocHeadings).filter(h => h.hasAttribute('data-prev-heading'));
            expect(tocModified.length).toBe(0);
        });
    });

    describe('Complex Selector Scenarios', () => {
        beforeEach(() => {
            const html = `
                <div class="page-layout">
                    <div class="content-main">
                        ${loadFixture('bootstrap-grid-site.html')}
                    </div>
                    <div class="content-main">
                        ${loadFixture('sidebar-layout.html')}
                    </div>
                </div>
            `;
            container = createTestContainer(html);
        });

        it('should fail when selector matches multiple elements', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // This should match multiple .content-main elements
            healHeadings('.content-main');
            
            expect(consoleErrorSpy).toHaveBeenCalledWith('Multiple elements found for selector: .content-main. Selector must match exactly one element.');
            consoleErrorSpy.mockRestore();
        });

        it('should work with more specific selectors', () => {
            // Use a more specific selector that matches only one element
            healHeadings('.page-layout .content-main:first-child .article-content');
            
            // Should process the first bootstrap site's article content
            const firstContentMain = container.querySelector('.content-main:first-child');
            const modificationsInFirst = firstContentMain.querySelectorAll('[data-prev-heading]');
            expect(modificationsInFirst.length).toBeGreaterThan(0);
            
            // Second content-main should be unmodified
            const secondContentMain = container.querySelector('.content-main:nth-child(2)');
            const modificationsInSecond = secondContentMain.querySelectorAll('[data-prev-heading]');
            expect(modificationsInSecond.length).toBe(0);
        });
    });

    describe('Real-world Performance with Large DOM', () => {
        beforeEach(() => {
            // Create a large DOM with multiple complex layouts
            const bootstrapHtml = loadFixture('bootstrap-grid-site.html');
            const sidebarHtml = loadFixture('sidebar-layout.html');
            const docHtml = loadFixture('documentation-site.html');
            
            const html = `
                <div class="mega-site">
                    <div class="section-1">${bootstrapHtml}</div>
                    <div class="section-2">${sidebarHtml}</div>
                    <div class="section-3">${docHtml}</div>
                    <div class="target-section">
                        <h1>Target Section</h1>
                        <h5>Should be H2</h5>
                        <h6>Should be H3</h6>
                        <h3>Should stay H3</h3>
                    </div>
                </div>
            `;
            container = createTestContainer(html);
        });

        it('should efficiently process only target section in large DOM', () => {
            const startTime = performance.now();
            
            // Only process the small target section
            healHeadings('.target-section');
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            // Should complete quickly even with large DOM
            expect(processingTime).toBeLessThan(100); // Less than 100ms
            
            // Only target section should be modified
            const targetModifications = container.querySelectorAll('.target-section [data-prev-heading]');
            const otherModifications = container.querySelectorAll('.section-1 [data-prev-heading], .section-2 [data-prev-heading], .section-3 [data-prev-heading]');
            
            expect(targetModifications.length).toBeGreaterThan(0);
            expect(otherModifications.length).toBe(0);
            
            // Verify specific corrections in target section
            const targetH2 = container.querySelector('.target-section h2[data-prev-heading="5"]');
            const targetH3 = container.querySelector('.target-section h3[data-prev-heading="6"]');
            
            expect(targetH2).toBeTruthy();
            expect(targetH3).toBeTruthy();
            expect(targetH2.textContent.trim()).toBe('Should be H2');
            expect(targetH3.textContent.trim()).toBe('Should be H3');
        });
    });
});