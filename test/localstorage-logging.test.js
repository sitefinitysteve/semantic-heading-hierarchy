import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    healHeadings, 
    enableHeadingLogging, 
    disableHeadingLogging, 
    clearHeadingLogging, 
    getHeadingLoggingStatus 
} from '../src/index.js';

describe('healHeadings - localStorage Logging Control', () => {
    let container;
    let mockLocalStorage;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock localStorage
        const storage = new Map();
        mockLocalStorage = {
            getItem: vi.fn((key) => storage.get(key) || null),
            setItem: vi.fn((key, value) => storage.set(key, value)),
            removeItem: vi.fn((key) => storage.delete(key)),
            clear: vi.fn(() => storage.clear())
        };

        // Replace global localStorage
        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        mockLocalStorage.clear();
    });

    describe('localStorage Override Functionality', () => {
        it('should respect localStorage override when enabled', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            // Enable logging via localStorage
            enableHeadingLogging();

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Call healHeadings with logResults: false, but localStorage should override
            healHeadings(container, { logResults: false });

            // Should have logged because localStorage override is enabled
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Will change H4 → H2')
            );

            consoleSpy.mockRestore();
        });

        it('should respect localStorage override when disabled', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            // Disable logging via localStorage
            disableHeadingLogging();

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Call healHeadings with logResults: true, but localStorage should override
            healHeadings(container, { logResults: true });

            // Should not have logged because localStorage override is disabled
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );

            consoleSpy.mockRestore();
        });

        it('should fall back to function parameter when localStorage is cleared', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            // First enable, then clear
            enableHeadingLogging();
            clearHeadingLogging();

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Should use function parameter (true)
            healHeadings(container, { logResults: true });
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );

            consoleSpy.mockClear();

            // Should use function parameter (false)
            healHeadings(container, { logResults: false });
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );

            consoleSpy.mockRestore();
        });

        it('should work with backwards compatible boolean parameter', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            enableHeadingLogging();

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Old API with boolean - localStorage should override
            healHeadings(container, false);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Helper Functions', () => {
        it('should enable logging via enableHeadingLogging', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            enableHeadingLogging();

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('healHeadings.logResults', 'true');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Detailed heading healing logging ENABLED globally');

            consoleSpy.mockRestore();
        });

        it('should disable logging via disableHeadingLogging', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            disableHeadingLogging();

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('healHeadings.logResults', 'false');
            expect(consoleSpy).toHaveBeenCalledWith('❌ Detailed heading healing logging DISABLED globally');

            consoleSpy.mockRestore();
        });

        it('should clear logging override via clearHeadingLogging', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // First set something
            enableHeadingLogging();
            
            // Then clear it
            clearHeadingLogging();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('healHeadings.logResults');
            expect(consoleSpy).toHaveBeenCalledWith('🔄 Heading healing logging reset - will use function parameter');

            consoleSpy.mockRestore();
        });

        it('should report status when no override is set', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const status = getHeadingLoggingStatus();

            expect(status).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('📋 Heading healing logging: Using function parameter (no override set)');

            consoleSpy.mockRestore();
        });

        it('should report status when override is enabled', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            enableHeadingLogging();
            consoleSpy.mockClear(); // Clear the enable message

            const status = getHeadingLoggingStatus();

            expect(status).toBe('true');
            expect(consoleSpy).toHaveBeenCalledWith('📋 Heading healing logging: ENABLED (localStorage override)');

            consoleSpy.mockRestore();
        });

        it('should report status when override is disabled', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            disableHeadingLogging();
            consoleSpy.mockClear(); // Clear the disable message

            const status = getHeadingLoggingStatus();

            expect(status).toBe('false');
            expect(consoleSpy).toHaveBeenCalledWith('📋 Heading healing logging: DISABLED (localStorage override)');

            consoleSpy.mockRestore();
        });
    });

    describe('No localStorage Environment', () => {
        beforeEach(() => {
            // Remove localStorage by setting to undefined
            Object.defineProperty(global, 'localStorage', {
                value: undefined,
                writable: true,
                configurable: true
            });
        });

        it('should handle missing localStorage gracefully in healHeadings', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Should work normally without localStorage
            healHeadings(container, { logResults: true });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Found 1 heading(s) to process after H1')
            );

            consoleSpy.mockRestore();
        });

        it('should warn when trying to enable logging without localStorage', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            enableHeadingLogging();

            expect(consoleWarnSpy).toHaveBeenCalledWith('localStorage not available - cannot enable global logging');

            consoleWarnSpy.mockRestore();
        });

        it('should warn when trying to disable logging without localStorage', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            disableHeadingLogging();

            expect(consoleWarnSpy).toHaveBeenCalledWith('localStorage not available - cannot disable global logging');

            consoleWarnSpy.mockRestore();
        });

        it('should warn when trying to clear logging without localStorage', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            clearHeadingLogging();

            expect(consoleWarnSpy).toHaveBeenCalledWith('localStorage not available - cannot clear global logging');

            consoleWarnSpy.mockRestore();
        });

        it('should handle getHeadingLoggingStatus without localStorage', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const status = getHeadingLoggingStatus();

            expect(status).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('📋 Heading healing logging: localStorage not available');

            consoleSpy.mockRestore();
        });
    });

    describe('Integration with Custom Prefix', () => {
        it('should respect localStorage logging with custom class prefix', () => {
            container.innerHTML = `
                <h1>Main</h1>
                <h4>Section</h4>
            `;

            enableHeadingLogging();

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            healHeadings(container, { 
                classPrefix: 'custom-',
                logResults: false // Should be overridden by localStorage
            });

            // Should log with custom prefix mentioned
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('custom-4 class')
            );

            consoleSpy.mockRestore();
        });
    });
});