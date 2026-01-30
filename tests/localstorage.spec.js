const { test, expect } = require('@playwright/test');

test.describe('localStorage Error Handling', () => {
    test('should handle corrupted localStorage visitCount gracefully', async ({ page }) => {
        await page.goto('/');

        // Set corrupted data
        await page.evaluate(() => {
            localStorage.setItem('portfolio_visits', 'not-a-number');
        });

        // Reload page - should not crash
        await page.reload();

        // Wait for initialization
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should still work
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should handle corrupted localStorage cardInterests gracefully', async ({ page }) => {
        await page.goto('/');

        // Set corrupted JSON
        await page.evaluate(() => {
            localStorage.setItem('portfolio_interests', '{invalid json}');
        });

        // Reload page - should not crash
        await page.reload();

        // Wait for initialization
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should still work
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should use safe localStorage helper functions', async ({ page }) => {
        await page.goto('/');

        // Check that safe helper functions exist
        const hasSafeHelpers = await page.evaluate(() => {
            return typeof window.safeGetNumber === 'function' &&
                   typeof window.safeGetJSON === 'function';
        });

        expect(hasSafeHelpers).toBe(true);
    });
});
