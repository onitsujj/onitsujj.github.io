const { test, expect } = require('@playwright/test');

test.describe('Performance Detection', () => {
    test('should have hardwareConcurrency fallback', async ({ page }) => {
        await page.goto('/');

        // Mock undefined hardwareConcurrency and reload
        await page.evaluate(() => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: undefined,
                writable: true
            });
        });

        await page.reload();
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Should still detect a tier without crashing
        const tier = await page.evaluate(() => window.Performance?.tier);
        expect(['low', 'medium', 'high']).toContain(tier);
    });
});
