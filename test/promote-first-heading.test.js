import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';
import { HtmlValidate } from 'html-validate';

/**
 * The `promoteFirstHeading` option: when a container has no <h1>, instead of bailing,
 * promote the first heading in document order up to <h1> and then heal the rest normally.
 * This is the opt-in fix for the live-site case where the healer is scoped to a fragment
 * (e.g. a Sitefinity .contentArea) whose H1 lives elsewhere on the page.
 */
const htmlvalidate = new HtmlValidate({ rules: { 'heading-level': 'error' } });

async function headingLevelErrors(html) {
    const report = await htmlvalidate.validateString(html);
    return report.results?.length > 0
        ? report.results[0].messages.filter(m => m.ruleId === 'heading-level')
        : [];
}

describe('promoteFirstHeading option', () => {
    let container;
    let logSpy;

    afterEach(() => {
        if (logSpy) logSpy.mockRestore();
        cleanupContainer(container);
    });

    it('is off by default: a headless fragment is left completely untouched', () => {
        container = createTestContainer('<h2>Lead</h2><h3>Sub</h3>');

        healHeadings(container);

        // No anchor was created and nothing was marked - the library bailed as before.
        expect(container.querySelector('h1')).toBeNull();
        expect(container.querySelector('[data-heading-processed]')).toBeNull();
        expect(container.querySelector('[data-prev-heading]')).toBeNull();
    });

    it('promotes the first heading to H1 and cascades the rest down a level', () => {
        container = createTestContainer(
            '<h2>Lead Section</h2><h3>Sub Section</h3><h2>Second Section</h2>'
        );

        healHeadings(container, { promoteFirstHeading: true });

        const h1 = container.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1.textContent).toBe('Lead Section');

        // Promoted heading keeps its original visual size and records where it came from.
        expect(h1.classList.contains('hs-2')).toBe(true);
        expect(h1.getAttribute('data-prev-heading')).toBe('2');
        // A synthesized anchor is distinguishable from a real one in devtools.
        expect(h1.getAttribute('data-heading-processed')).toBe('promoted');

        // The former <h3> cannot skip a level under the new H1, so it cascades to H2.
        const tags = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName);
        expect(tags).toEqual(['H1', 'H2', 'H2']);
    });

    it('turns a headless fragment into an accessibility-valid hierarchy', async () => {
        container = createTestContainer('<h3>Card Title</h3><h4>Card Detail</h4>');

        // Raw fragment (no H1, starts at H3) is flagged by html-validate.
        expect((await headingLevelErrors(container.innerHTML)).length).toBeGreaterThan(0);

        healHeadings(container, { promoteFirstHeading: true });

        expect(container.querySelector('h1').textContent).toBe('Card Title');
        expect(await headingLevelErrors(container.innerHTML)).toEqual([]);
    });

    it('still does nothing when the container has headings-less content', () => {
        container = createTestContainer('<p>No headings here</p>');
        logSpy = vi.spyOn(console, 'log');

        healHeadings(container, { promoteFirstHeading: true, logResults: true });

        expect(container.querySelector('h1')).toBeNull();
        expect(logSpy).toHaveBeenCalledWith('No H1 found and no headings to promote - nothing to fix');
    });

    it('promotes nested markup inside the heading without losing it', () => {
        container = createTestContainer(
            '<h2><span class="icon">★</span> Rich <em>Heading</em></h2><h3>Next</h3>'
        );

        healHeadings(container, { promoteFirstHeading: true });

        const h1 = container.querySelector('h1');
        expect(h1.querySelector('span.icon')).toBeTruthy();
        expect(h1.querySelector('em').textContent).toBe('Heading');
    });
});
