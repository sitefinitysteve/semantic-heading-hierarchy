import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { loadFixture, createTestContainer, cleanupContainer, analyzeHeadings } from './test-utils.js';

/**
 * Real-world Sitefinity ".contentArea" markup (two col-md-6 columns, each with a
 * section <h3> followed by a "mostRecentControl" <ul> whose <li>s each contain an <h3>).
 *
 * These tests document WHY the healer appears to "do nothing" on this page, with
 * logResults: true so the reasoning is printed to the console as the test runs.
 */
describe('Sitefinity .contentArea heading healing', () => {
    let container;
    let logSpy;

    beforeEach(() => {
        const html = loadFixture('sitefinity-content-area.html');
        container = createTestContainer(html);
        // Spy WITHOUT a mock implementation so messages still print to the console.
        logSpy = vi.spyOn(console, 'log');
    });

    afterEach(() => {
        logSpy.mockRestore();
        cleanupContainer(container);
    });

    it('makes NO changes when an H1 + H2 already sit above the H3s (hierarchy is valid + list items are skipped)', () => {
        // Document order: H1 > H2 > H3 (col 1) > 3x H3 (list) > H3 (col 2) > 3x H3 (list)
        const result = healHeadings(container, { logResults: true });

        // H1 -> H2 -> H3 is already a valid sequence, so the two section H3s are left alone.
        // Every article-title H3 lives in a <li> with sibling <li>s, so they are skipped by design.
        // Net result: zero headings rewritten, therefore zero "hs-" classes added.
        const modified = container.querySelectorAll('[data-prev-heading]');
        expect(modified.length).toBe(0);

        const withHsClass = Array.from(container.querySelectorAll('[class*="hs-"]'));
        expect(withHsClass.length).toBe(0);

        // H1 is never touched.
        expect(container.querySelectorAll('h1').length).toBe(1);

        // The healer DID run and DID see all 9 headings after the H1 - it just had nothing to rewrite.
        expect(result.ran).toBe(true);
        expect(result.headings.length).toBe(10); // 1 H1 anchor + 9 after it
        expect(result.modifiedCount).toBe(0);

        // All 6 article-title H3s sit in multi-item <li> lists, so all 6 are skipped by design.
        const skipped = result.headings.filter(h => h.state === 'skipped-list');
        expect(skipped.length).toBe(6);
    });

    it('marks EVERY heading with data-heading-processed so a devtools inspection proves the library ran', () => {
        healHeadings(container, { logResults: true });

        // The anchor H1 is tagged so you can confirm the library found a hierarchy root here.
        const h1 = container.querySelector('h1');
        expect(h1.getAttribute('data-heading-processed')).toBe('anchor');

        // Not a single heading should be left without the marker - even ones left untouched.
        const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        allHeadings.forEach(h => {
            expect(h.hasAttribute('data-heading-processed')).toBe(true);
        });

        // The marker VALUE explains each heading's fate without changing anything visible:
        //   anchor       -> the H1
        //   unchanged    -> evaluated, already at the correct level (H2 + the 2 section H3s)
        //   skipped-list -> an article title inside a multi-item <li> list (the 6 ratings)
        const byState = {};
        allHeadings.forEach(h => {
            const state = h.getAttribute('data-heading-processed');
            byState[state] = (byState[state] || 0) + 1;
        });
        expect(byState).toEqual({ anchor: 1, unchanged: 3, 'skipped-list': 6 });
    });

    it('DOES add an hs- class when a real gap exists (only an H1 above the H3s)', () => {
        // Remove the H2 so the structure jumps H1 -> H3, which is a gap the healer fixes.
        container.querySelector('h2').remove();

        healHeadings(container, { logResults: true });

        // The first section heading (not in a list) jumps from the H1, so H3 -> H2 + "hs-3".
        const firstSection = Array.from(container.querySelectorAll('h2'))
            .find(h => h.textContent.trim() === 'Recent Evidence Summaries');
        expect(firstSection).toBeTruthy();
        expect(firstSection.classList.contains('hs-3')).toBe(true);
        expect(firstSection.getAttribute('data-prev-heading')).toBe('3');

        // Article-title H3s inside multi-item lists are STILL skipped.
        const analysis = analyzeHeadings(container);
        const listHeadings = analysis.filter(h => h.isInList && h.listSiblingCount > 1);
        expect(listHeadings.length).toBeGreaterThan(0);
        listHeadings.forEach(h => expect(h.hasDataPrevHeading).toBe(false));
    });

    it('bails out (this is what happened on the live site) when scoped to .contentArea, which has no H1 inside it', () => {
        // On the page the H1 lives in the masthead, OUTSIDE .contentArea. Scoping the
        // healer to .contentArea means it finds no H1 and stops before changing anything.
        const contentArea = container.querySelector('.sf_cols.contentArea');

        healHeadings(contentArea, { logResults: true });

        expect(logSpy).toHaveBeenCalledWith('No H1 found - skipping heading structure fix');
        expect(contentArea.querySelectorAll('[data-prev-heading]').length).toBe(0);
    });

    it('with promoteFirstHeading, the scoped .contentArea heals by promoting its first H3 (the live-site fix)', () => {
        const contentArea = container.querySelector('.sf_cols.contentArea');

        healHeadings(contentArea, { logResults: true, promoteFirstHeading: true });

        // "Recent Evidence Summaries" (the first heading in the fragment) becomes the H1.
        const h1 = contentArea.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1.textContent.trim()).toBe('Recent Evidence Summaries');
        expect(h1.classList.contains('hs-3')).toBe(true);
        expect(h1.getAttribute('data-prev-heading')).toBe('3');
        expect(h1.getAttribute('data-heading-processed')).toBe('promoted');

        // The second section heading cascades H3 -> H2 (one level under the new H1).
        const second = Array.from(contentArea.querySelectorAll('h2'))
            .find(h => h.textContent.trim() === 'Recent Web Resource Ratings');
        expect(second).toBeTruthy();
        expect(second.getAttribute('data-prev-heading')).toBe('3');

        // The 6 article-title H3s inside the multi-item rating lists are STILL skipped.
        const listHeadings = analyzeHeadings(contentArea).filter(h => h.isInList && h.listSiblingCount > 1);
        expect(listHeadings.length).toBe(6);
        listHeadings.forEach(h => {
            expect(h.tagName).toBe('h3');
            expect(h.hasDataPrevHeading).toBe(false);
        });
    });
});
