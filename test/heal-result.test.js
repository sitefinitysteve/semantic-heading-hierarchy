import { describe, it, expect, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';

/**
 * healHeadings() returns a structured HealResult describing what happened to every heading,
 * so callers can inspect it programmatically or `console.table(result.headings)`.
 */
describe('healHeadings return value (HealResult)', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    it('returns an empty, ran=false result when it bails (no H1, no promote)', () => {
        container = createTestContainer('<h2>No H1</h2><h3>Here</h3>');

        const result = healHeadings(container);

        expect(result.ran).toBe(false);
        expect(result.promotedFirstHeading).toBe(false);
        expect(result.modifiedCount).toBe(0);
        expect(result.headings).toEqual([]);
    });

    it('reports each heading in document order with from/to/state', () => {
        container = createTestContainer('<h1>Title</h1><h4>Deep</h4><h2>Section</h2>');

        const result = healHeadings(container);

        expect(result.ran).toBe(true);
        expect(result.modifiedCount).toBe(1);
        expect(result.headings.map(h => ({ from: h.from, to: h.to, state: h.state }))).toEqual([
            { from: 1, to: 1, state: 'anchor' },
            { from: 4, to: 2, state: 'changed' },
            { from: 2, to: 2, state: 'unchanged' }
        ]);
    });

    it('points each result.element at the live DOM node (the replacement for changed headings)', () => {
        container = createTestContainer('<h1>Title</h1><h4>Deep</h4>');

        const result = healHeadings(container);
        const changed = result.headings.find(h => h.state === 'changed');

        // The element reference is the new <h2>, and it is the node actually in the document.
        expect(changed.element.tagName).toBe('H2');
        expect(container.contains(changed.element)).toBe(true);
        expect(changed.element.getAttribute('data-prev-heading')).toBe('4');
    });

    it('flags promotedFirstHeading and records the promoted entry', () => {
        container = createTestContainer('<h3>Lead</h3><h4>Sub</h4>');

        const result = healHeadings(container, { promoteFirstHeading: true });

        expect(result.ran).toBe(true);
        expect(result.promotedFirstHeading).toBe(true);
        expect(result.headings[0]).toMatchObject({ from: 3, to: 1, state: 'promoted', text: 'Lead' });
        expect(result.headings[1]).toMatchObject({ from: 4, to: 2, state: 'changed' });
    });

    it('records list-skipped headings without modifying them', () => {
        container = createTestContainer(
            '<h1>Title</h1><ul><li><h3>A</h3></li><li><h3>B</h3></li></ul>'
        );

        const result = healHeadings(container);

        expect(result.modifiedCount).toBe(0);
        const skipped = result.headings.filter(h => h.state === 'skipped-list');
        expect(skipped.length).toBe(2);
        skipped.forEach(h => {
            expect(h.from).toBe(3);
            expect(h.to).toBe(3);
            expect(h.element.tagName).toBe('H3');
        });
    });

    it('records headings before the H1 as ignored-before-h1 without modifying them', () => {
        container = createTestContainer('<h2>Before</h2><h1>Title</h1><h4>After</h4>');

        const result = healHeadings(container);

        expect(result.modifiedCount).toBe(1);
        expect(result.headings[0]).toMatchObject({
            from: 2, to: 2, state: 'ignored-before-h1', text: 'Before'
        });
        // The ignored heading is untouched in the DOM.
        expect(result.headings[0].element.tagName).toBe('H2');
        expect(result.headings[0].element.hasAttribute('data-prev-heading')).toBe(false);
    });

    it('records additional H1s as ignored-additional-h1 by default', () => {
        container = createTestContainer(
            '<h1>First</h1><h4>Sub</h4><h1>Second</h1><h5>Tail</h5>'
        );

        const result = healHeadings(container);

        expect(result.modifiedCount).toBe(2);
        const second = result.headings.find(h => h.text === 'Second');
        expect(second).toMatchObject({ from: 1, to: 1, state: 'ignored-additional-h1' });
        // Left as an H1 in the DOM - not converted, not marked.
        expect(second.element.tagName).toBe('H1');
        expect(second.element.hasAttribute('data-prev-heading')).toBe(false);
    });

    it('reflects forceSingleH1 conversions in modifiedCount and the converted entry', () => {
        container = createTestContainer(
            '<h1>First</h1><h4>Sub</h4><h1>Second</h1><h5>Tail</h5>'
        );

        const result = healHeadings(container, { forceSingleH1: true });

        // Sub (H4->H2), Second (H1->H2) and Tail (H5->H3) are all modified.
        expect(result.modifiedCount).toBe(3);

        const second = result.headings.find(h => h.text === 'Second');
        expect(second).toMatchObject({ from: 1, to: 2, state: 'changed' });
        expect(second.element.tagName).toBe('H2');

        // The anchor is still reported as the anchor...
        expect(result.headings[0]).toMatchObject({ from: 1, to: 1, state: 'anchor' });
        // ...and exactly one H1 survives in the DOM.
        expect(container.querySelectorAll('h1')).toHaveLength(1);
    });
});
