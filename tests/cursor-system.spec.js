const { test, expect } = require('@playwright/test');

test.describe('Cursor System Integration', () => {
    test('should not have separate updateCursor animation loop', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Check that cursor update is integrated into master loop
        const hasSeparateCursorLoop = await page.evaluate(() => {
            // If cursor is integrated, there should be a cursorSystem or similar
            return typeof window.updateCursor === 'function';
        });

        // Should NOT have a separate updateCursor function exposed
        // (It should be integrated into masterLoop)
        expect(hasSeparateCursorLoop).toBe(false);
    });
});
