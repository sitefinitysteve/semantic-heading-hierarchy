import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { loadFixture, createTestContainer, cleanupContainer, analyzeHeadings } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

/**
 * Full-page audit using the real McMaster Optimal Aging Portal homepage.
 *
 * The captured markup is the page AFTER the library has already run in production:
 * the hero subtitle is <h2 class="hs-3" data-prev-heading="3"> (originally an <h3>).
 * That single heal is the only correction the page ever needed.
 */
const htmlvalidate = new HtmlValidate({ rules: { 'heading-level': 'error' } });

async function headingLevelErrors(html) {
    const report = await htmlvalidate.validateString(html);
    return report.results?.length > 0
        ? report.results[0].messages.filter(m => m.ruleId === 'heading-level')
        : [];
}

// Walk every heading in document order and flag any jump deeper than one level
// (e.g. H1 -> H3). Going back up any number of levels is allowed.
function findSkippedLevels(container) {
    const levels = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        .map(h => parseInt(h.tagName.charAt(1), 10));
    const violations = [];
    let prev = 0;
    levels.forEach((level, i) => {
        if (prev !== 0 && level > prev + 1) {
            violations.push({ index: i, from: prev, to: level });
        }
        prev = level;
    });
    return violations;
}

describe('McMaster homepage - full-page audit', () => {
    let container;
    let logSpy;

    beforeEach(() => {
        const html = loadFixture('mcmaster-homepage.html');
        container = createTestContainer(html);
        logSpy = vi.spyOn(console, 'log');
    });

    afterEach(() => {
        logSpy.mockRestore();
        cleanupContainer(container);
    });

    it('finds the hero H1 and produces a hierarchy with no skipped levels', async () => {
        // The H1 lives in #hero, so a whole-page heal finds it and runs.
        healHeadings(container, { logResults: true });

        expect(logSpy).not.toHaveBeenCalledWith('No H1 found - skipping heading structure fix');
        expect(container.querySelectorAll('h1').length).toBe(1);

        // The real accessibility guarantee: no heading jumps more than one level deeper.
        expect(findSkippedLevels(container)).toEqual([]);

        // And html-validate agrees there are no heading-level violations.
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('is a no-op on the already-valid captured page', () => {
        const result = healHeadings(container, { logResults: true });

        expect(result.modifiedCount).toBe(0);
        // Only the pre-existing production heal marker remains; nothing new is added.
        expect(container.querySelectorAll('[data-prev-heading]').length).toBe(1);
    });

    it('leaves the article-title H3s inside the rating lists untouched', () => {
        healHeadings(container, { logResults: true });

        const analysis = analyzeHeadings(container);
        const listHeadings = analysis.filter(h => h.isInList && h.listSiblingCount > 1);

        expect(listHeadings.length).toBe(6); // 3 evidence summaries + 3 web resource ratings
        listHeadings.forEach(h => {
            expect(h.tagName).toBe('h3');
            expect(h.hasDataPrevHeading).toBe(false);
        });
    });

    it('tags every heading with data-heading-processed so devtools shows the whole page was audited', () => {
        healHeadings(container, { logResults: true });

        const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));

        // The library leaves a fingerprint on every heading it walked - nothing is missed.
        allHeadings.forEach(h => {
            expect(h.hasAttribute('data-heading-processed')).toBe(true);
        });

        // Each value is one of the documented states (no stray/typo'd markers).
        const allowed = new Set(['anchor', 'promoted', 'changed', 'unchanged', 'skipped-list', 'ignored-before-h1', 'ignored-additional-h1']);
        allHeadings.forEach(h => {
            expect(allowed.has(h.getAttribute('data-heading-processed'))).toBe(true);
        });

        // The single hero H1 is the anchor.
        const anchors = allHeadings.filter(h => h.getAttribute('data-heading-processed') === 'anchor');
        expect(anchors.length).toBe(1);
        expect(anchors[0].tagName).toBe('H1');

        // The 6 rating-list article titles are explicitly marked as deliberately skipped.
        const skipped = allHeadings.filter(h => h.getAttribute('data-heading-processed') === 'skipped-list');
        expect(skipped.length).toBe(6);
        skipped.forEach(h => expect(h.tagName).toBe('H3'));
    });

    it('bails out when scoped to a .contentArea (no H1 inside it) - the live-site case', () => {
        const contentArea = container.querySelector('.sf_cols.contentArea');

        healHeadings(contentArea, { logResults: true });

        expect(logSpy).toHaveBeenCalledWith('No H1 found - skipping heading structure fix');
        expect(contentArea.querySelectorAll('[data-prev-heading]').length).toBe(0);
    });

    it('reproduces the production heal: a raw H1->H3 jump becomes H1->H2.hs-3', async () => {
        // Revert the hero subtitle to its authored state (the <h3> before any heal),
        // moving child nodes rather than using innerHTML.
        const subtitle = container.querySelector('h2.hs-3');
        const rawH3 = document.createElement('h3');
        while (subtitle.firstChild) rawH3.appendChild(subtitle.firstChild);
        subtitle.replaceWith(rawH3);

        // Raw page now skips H1 -> H3, which html-validate flags.
        expect((await headingLevelErrors(container.innerHTML)).length).toBeGreaterThan(0);

        healHeadings(container, { logResults: true });

        // Healed back to exactly what production shows: an H2 carrying the hs-3 marker.
        const healed = Array.from(container.querySelectorAll('h2'))
            .find(h => h.textContent.includes('Looking for something specific'));
        expect(healed).toBeTruthy();
        expect(healed.classList.contains('hs-3')).toBe(true);
        expect(healed.getAttribute('data-prev-heading')).toBe('3');
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });
});
