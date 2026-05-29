import { describe, it, expect, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

/**
 * The `healListHeadings` option: by default, headings inside a multi-item list (a <ul>/<ol> with
 * more than one <li>) are left untouched - they are treated as repeated/uniform "card" content,
 * so the healer will not promote just the first card above its siblings. That is exactly why the
 * article-title H3s in the Sitefinity ".mostRecentControl" lists show up as data-heading-processed
 * = "skipped-list".
 *
 * Set healListHeadings: true to opt in to healing them like any other heading - useful when the
 * list items are real content sections whose H1 -> Hx jump must be corrected for accessibility.
 */
const htmlvalidate = new HtmlValidate({ rules: { 'heading-level': 'error' } });

async function headingLevelErrors(html) {
    const report = await htmlvalidate.validateString(html);
    return report.results?.length > 0
        ? report.results[0].messages.filter(m => m.ruleId === 'heading-level')
        : [];
}

describe('healListHeadings option', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    it('is off by default: multi-item list headings are skipped, leaving the H1->H3 jump', async () => {
        // H1 immediately followed by a list of H3 cards - this is a real accessibility violation
        // (the level jumps from 1 to 3), but the default heuristic leaves the list alone.
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<ul>' +
            '  <li><h3>Card A</h3></li>' +
            '  <li><h3>Card B</h3></li>' +
            '  <li><h3>Card C</h3></li>' +
            '</ul>'
        );

        const result = healHeadings(container);

        // Nothing rewritten; every card heading is explicitly marked as skipped.
        expect(result.modifiedCount).toBe(0);
        const skipped = result.headings.filter(h => h.state === 'skipped-list');
        expect(skipped.length).toBe(3);
        skipped.forEach(h => expect(h.element.tagName).toBe('H3'));

        // The skip leaves a genuine H1 -> H3 jump that html-validate still flags.
        expect((await headingLevelErrors(container.innerHTML)).length).toBeGreaterThan(0);
    });

    it('heals the list headings into a valid hierarchy when enabled', async () => {
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<ul>' +
            '  <li><h3>Card A</h3></li>' +
            '  <li><h3>Card B</h3></li>' +
            '  <li><h3>Card C</h3></li>' +
            '</ul>'
        );

        const result = healHeadings(container, { healListHeadings: true });

        // The first card heals H3 -> H2 (closing the jump). Its siblings are already valid as H3
        // under the new H2, so they stay H3 - and no heading is marked "skipped-list" anymore.
        expect(result.headings.some(h => h.state === 'skipped-list')).toBe(false);

        const cardA = Array.from(container.querySelectorAll('h2')).find(h => h.textContent === 'Card A');
        expect(cardA).toBeTruthy();
        expect(cardA.classList.contains('hs-3')).toBe(true);
        expect(cardA.getAttribute('data-prev-heading')).toBe('3');

        const tags = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName);
        expect(tags).toEqual(['H1', 'H2', 'H3', 'H3']);

        // Hierarchy is now accessibility-valid.
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('marks list headings changed/unchanged (not skipped-list) when enabled, even on an already-valid page', () => {
        // H1 > H2 > H3(list items): already valid. Default would skip the list H3s; with the option
        // on they are evaluated and found correct, so they are "unchanged" rather than "skipped-list".
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<h2>Section</h2>' +
            '<ul>' +
            '  <li><h3>Item one</h3></li>' +
            '  <li><h3>Item two</h3></li>' +
            '</ul>'
        );

        const result = healHeadings(container, { healListHeadings: true });

        expect(result.modifiedCount).toBe(0);
        const listOutcomes = result.headings.filter(h => h.text.startsWith('Item'));
        expect(listOutcomes.map(h => h.state)).toEqual(['unchanged', 'unchanged']);
        listOutcomes.forEach(h => {
            expect(h.element.tagName).toBe('H3');
            expect(h.element.getAttribute('data-heading-processed')).toBe('unchanged');
        });
    });

    it('reproduces the Sitefinity case: H1 then a single H3 section + a multi-item list of H3 cards', async () => {
        // The article-title cards no longer skip past H2 once the option is on.
        container = createTestContainer(
            '<h1>Portal</h1>' +
            '<h3>Recent Evidence Summaries</h3>' +
            '<ul class="mostRecentControl">' +
            '  <li><h3>Article one</h3></li>' +
            '  <li><h3>Article two</h3></li>' +
            '  <li><h3>Article three</h3></li>' +
            '</ul>'
        );

        const result = healHeadings(container, { healListHeadings: true });

        // Section heading heals H3 -> H2, then the first article heals H3 -> ... stays H3 under it.
        const section = Array.from(container.querySelectorAll('h2'))
            .find(h => h.textContent === 'Recent Evidence Summaries');
        expect(section).toBeTruthy();
        expect(section.getAttribute('data-prev-heading')).toBe('3');

        // No card is skipped now; the whole fragment validates.
        expect(result.headings.some(h => h.state === 'skipped-list')).toBe(false);
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('still heals a single-item list heading regardless of the option (sanity)', () => {
        container = createTestContainer('<h1>Main</h1><ul><li><h4>Lonely</h4></li></ul>');

        const off = healHeadings(container, { healListHeadings: false });
        const healed = container.querySelector('h2');
        expect(healed.textContent).toBe('Lonely');
        expect(healed.getAttribute('data-prev-heading')).toBe('4');
        expect(off.modifiedCount).toBe(1);
    });
});
