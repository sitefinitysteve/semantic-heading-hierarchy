import { describe, it, expect, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

/**
 * Headings inside MULTI-item lists are intentionally left alone (repeated/uniform content).
 * The "is this a multi-item list?" check must count only the DIRECT children of the heading's
 * immediate list. A single-item outer <li> that happens to contain a nested multi-item list
 * must still be treated as single-item, so its heading gets healed. Regression guard for the
 * descendant-counting bug where querySelectorAll('li') inflated the count via nested <li>.
 */
const htmlvalidate = new HtmlValidate({ rules: { 'heading-level': 'error' } });

async function headingLevelErrors(html) {
    const report = await htmlvalidate.validateString(html);
    return report.results?.length > 0
        ? report.results[0].messages.filter(m => m.ruleId === 'heading-level')
        : [];
}

describe('list-skip detection counts only direct-child list items', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    it('heals a heading in a single-item list even when a nested list has many items', async () => {
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<ul>' +
            '  <li>' +
            '    <h4>Outer heading</h4>' +
            '    <ul><li>nested a</li><li>nested b</li><li>nested c</li></ul>' +
            '  </li>' +
            '</ul>'
        );

        const result = healHeadings(container);

        // The outer list has ONE item, so its heading is healed (H4 -> H2), not skipped.
        const healed = container.querySelector('h2');
        expect(healed).toBeTruthy();
        expect(healed.textContent).toBe('Outer heading');
        expect(healed.getAttribute('data-prev-heading')).toBe('4');
        expect(healed.classList.contains('hs-4')).toBe(true);

        const outcome = result.headings.find(h => h.text === 'Outer heading');
        expect(outcome.state).toBe('changed');
        expect(result.modifiedCount).toBe(1);

        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('heals the single-item outer heading while skipping a nested multi-item list of headings', () => {
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<ul>' +
            '  <li>' +
            '    <h4>Outer heading</h4>' +
            '    <ul>' +
            '      <li><h5>Inner A</h5></li>' +
            '      <li><h5>Inner B</h5></li>' +
            '    </ul>' +
            '  </li>' +
            '</ul>'
        );

        const result = healHeadings(container);

        // Outer (single-item) heading is healed.
        const outer = container.querySelector('h2');
        expect(outer.textContent).toBe('Outer heading');
        expect(outer.getAttribute('data-prev-heading')).toBe('4');

        // Inner headings live in a multi-item list, so they are left untouched.
        const inner = container.querySelectorAll('li h5');
        expect(inner).toHaveLength(2);
        inner.forEach(h => {
            expect(h.tagName).toBe('H5');
            expect(h.hasAttribute('data-prev-heading')).toBe(false);
            expect(h.classList.contains('hs-5')).toBe(false);
        });

        expect(result.headings.map(h => h.state)).toEqual([
            'anchor', 'changed', 'skipped-list', 'skipped-list'
        ]);
    });

    it('still skips headings in a genuinely multi-item outer list', () => {
        container = createTestContainer(
            '<h1>Main</h1>' +
            '<ul>' +
            '  <li><h4>One</h4></li>' +
            '  <li><h4>Two</h4></li>' +
            '</ul>'
        );

        const result = healHeadings(container);

        const items = container.querySelectorAll('li h4');
        expect(items).toHaveLength(2);
        items.forEach(h => {
            expect(h.tagName).toBe('H4');
            expect(h.hasAttribute('data-prev-heading')).toBe(false);
        });
        expect(result.modifiedCount).toBe(0);
    });
});
