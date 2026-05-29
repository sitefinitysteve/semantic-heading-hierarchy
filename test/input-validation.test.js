import { describe, it, expect, afterEach, vi } from 'vitest';
import { healHeadings } from '../src/index.js';
import { createTestContainer, cleanupContainer } from './test-utils.js';

/**
 * Defensive handling of bad / edge-case inputs. The library is meant to run unattended on
 * live CMS pages, so a misconfigured selector or class prefix should fail safely (warn and
 * bail / fall back) rather than throw and leave the DOM half-processed.
 */
describe('input validation', () => {
    let container;
    let spies;

    afterEach(() => {
        if (spies) spies.forEach(s => s.mockRestore());
        spies = null;
        cleanupContainer(container);
    });

    describe('selector resolution', () => {
        it('warns and bails when a selector matches no elements', () => {
            container = createTestContainer('<p>nothing matches the query</p>');
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            spies = [warnSpy];

            const result = healHeadings('.shh-no-such-element');

            expect(warnSpy).toHaveBeenCalledWith('No elements found for selector: .shh-no-such-element');
            expect(result).toEqual({ ran: false, promotedFirstHeading: false, modifiedCount: 0, headings: [] });
        });

        it('errors and bails when a selector matches more than one element', () => {
            container = createTestContainer(
                '<section class="shh-dup"><h1>A</h1></section>' +
                '<section class="shh-dup"><h1>B</h1></section>'
            );
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            spies = [errorSpy];

            const result = healHeadings('.shh-dup');

            expect(errorSpy).toHaveBeenCalledWith(
                'Multiple elements found for selector: .shh-dup. Selector must match exactly one element.'
            );
            expect(result.ran).toBe(false);
            expect(result.modifiedCount).toBe(0);
        });

        it('heals normally when a selector matches exactly one element', () => {
            container = createTestContainer('<div id="shh-one"><h1>Title</h1><h4>Section</h4></div>');

            const result = healHeadings('#shh-one');

            expect(result.ran).toBe(true);
            expect(result.modifiedCount).toBe(1);
            expect(container.querySelector('#shh-one h2')).toBeTruthy();
        });
    });

    describe('classPrefix validation', () => {
        it('falls back to "hs-" (and warns) when the prefix contains whitespace, without throwing', () => {
            container = createTestContainer('<h1>Main</h1><h4>Section</h4>');
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            spies = [warnSpy];

            // A whitespace prefix would make classList.add('hs x4') throw and abort mid-heal.
            expect(() => healHeadings(container, { classPrefix: 'hs x' })).not.toThrow();

            const heading = container.querySelector('h2');
            expect(heading).toBeTruthy();
            expect(heading.classList.contains('hs-4')).toBe(true);
            expect(heading.getAttribute('data-prev-heading')).toBe('4');
            expect(warnSpy).toHaveBeenCalledWith(
                'Invalid classPrefix "hs x" contains whitespace; falling back to "hs-".'
            );
        });

        it('does not warn for a valid custom prefix', () => {
            container = createTestContainer('<h1>Main</h1><h4>Section</h4>');
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            spies = [warnSpy];

            healHeadings(container, { classPrefix: 'sec-' });

            expect(container.querySelector('h2').classList.contains('sec-4')).toBe(true);
            expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Invalid classPrefix'));
        });
    });
});
