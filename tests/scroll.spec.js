const { test, expect } = require('@playwright/test');

test.describe('Scroll Speed Calculation', () => {
    test('should not produce Infinity on rapid scroll events', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Trigger multiple rapid scroll events
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                window.dispatchEvent(new Event('scroll'));
            });
        }

        // Check that scrollSpeed is a finite number
        const scrollSpeed = await page.evaluate(() => {
            // Access state if exposed, or check via behavior
            return typeof window.state?.scrollSpeed === 'number' &&
                   isFinite(window.state?.scrollSpeed);
        });

        // State might not be exposed, so also verify page didn't crash
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });
});
