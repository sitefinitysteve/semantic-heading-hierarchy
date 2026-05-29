import { describe, it, expect, afterEach } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

/**
 * Healing must be idempotent: running healHeadings again on an already-healed container
 * should be a no-op for the hierarchy. CMS components re-render and re-run client scripts,
 * so a second pass is a realistic, frequent scenario. The meaningful outputs (tags, hs-
 * classes, data-prev-heading, accessibility validity) must stay stable and classes must not
 * accumulate. Note that data-heading-processed intentionally reflects the LATEST run.
 */
const htmlvalidate = new HtmlValidate({ rules: { 'heading-level': 'error' } });

async function headingLevelErrors(html) {
    const report = await htmlvalidate.validateString(html);
    return report.results?.length > 0
        ? report.results[0].messages.filter(m => m.ruleId === 'heading-level')
        : [];
}

const tagsOf = (container) =>
    Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName);

const hsClassesOf = (el) =>
    Array.from(el.classList).filter(c => c.startsWith('hs-'));

describe('healHeadings idempotency (re-running an already-healed container)', () => {
    let container;

    afterEach(() => {
        cleanupContainer(container);
    });

    it('makes no further hierarchy changes on a second run', async () => {
        container = createTestContainer('<h1>Title</h1><h4>A</h4><h6>B</h6><h3>C</h3>');

        const first = healHeadings(container);
        expect(first.modifiedCount).toBe(2);
        const tagsAfterFirst = tagsOf(container);
        expect(tagsAfterFirst).toEqual(['H1', 'H2', 'H3', 'H3']);
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);

        const second = healHeadings(container);

        // The second pass changes nothing structural.
        expect(second.modifiedCount).toBe(0);
        expect(tagsOf(container)).toEqual(tagsAfterFirst);
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('does not accumulate hs- classes or rewrite data-prev-heading on re-runs', () => {
        container = createTestContainer('<h1>Title</h1><h4>A</h4><h6>B</h6><h3>C</h3>');

        healHeadings(container);
        healHeadings(container);
        healHeadings(container); // three passes - still stable

        const formerH4 = container.querySelector('h2');
        const formerH6 = container.querySelectorAll('h3')[0];

        // Exactly one hs- class each: the original level is recorded once, not re-added.
        expect(hsClassesOf(formerH4)).toEqual(['hs-4']);
        expect(hsClassesOf(formerH6)).toEqual(['hs-6']);

        // data-prev-heading preserves the ORIGINAL pre-heal level across runs.
        expect(formerH4.getAttribute('data-prev-heading')).toBe('4');
        expect(formerH6.getAttribute('data-prev-heading')).toBe('6');
    });

    it('reports HealResult.from from the current tag, never a stale data-prev-heading', () => {
        container = createTestContainer('<h1>Title</h1><h4>A</h4><h6>B</h6><h3>C</h3>');

        healHeadings(container);
        const second = healHeadings(container);

        // On the second run every heading is already at its healed level, so from === to
        // and state is unchanged/anchor - the healer reads the live tag, not the "4"/"6"
        // left behind in data-prev-heading.
        expect(second.headings.map(h => ({ from: h.from, to: h.to, state: h.state }))).toEqual([
            { from: 1, to: 1, state: 'anchor' },
            { from: 2, to: 2, state: 'unchanged' },
            { from: 3, to: 3, state: 'unchanged' },
            { from: 3, to: 3, state: 'unchanged' }
        ]);
    });

    it('re-labels data-heading-processed to reflect the latest run (changed -> unchanged)', () => {
        container = createTestContainer('<h1>Title</h1><h4>A</h4>');

        healHeadings(container);
        // After the first run the healed heading is marked 'changed'.
        expect(container.querySelector('h2').getAttribute('data-heading-processed')).toBe('changed');

        healHeadings(container);
        // The second run makes no change, so the marker now reads 'unchanged'. This is the
        // marker describing the most recent pass, not a regression of the heal itself.
        expect(container.querySelector('h2').getAttribute('data-heading-processed')).toBe('unchanged');
    });

    it('is idempotent after a promoteFirstHeading run, settling into a plain anchor', () => {
        container = createTestContainer('<h3>Lead</h3><h4>Sub</h4>');

        const first = healHeadings(container, { promoteFirstHeading: true });
        expect(first.promotedFirstHeading).toBe(true);
        expect(first.modifiedCount).toBe(1);
        expect(tagsOf(container)).toEqual(['H1', 'H2']);

        const second = healHeadings(container, { promoteFirstHeading: true });

        // No further structural change; the synthesized H1 already exists.
        expect(second.modifiedCount).toBe(0);
        expect(second.promotedFirstHeading).toBe(false);
        expect(tagsOf(container)).toEqual(['H1', 'H2']);

        const h1 = container.querySelector('h1');
        // Promotion artifacts (visual size + origin) persist across runs...
        expect(hsClassesOf(h1)).toEqual(['hs-3']);
        expect(h1.getAttribute('data-prev-heading')).toBe('3');
        expect(h1.textContent).toBe('Lead');
        // ...but on the second pass it is just the anchor, no longer freshly 'promoted'.
        expect(h1.getAttribute('data-heading-processed')).toBe('anchor');

        // The cascaded H2 did not pick up a second hs- class.
        expect(hsClassesOf(container.querySelector('h2'))).toEqual(['hs-4']);
    });
});
