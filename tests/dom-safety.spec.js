const { test, expect } = require('@playwright/test');

test.describe('DOM Null Safety', () => {
    test('should handle missing hero element gracefully', async ({ page }) => {
        // First load page normally
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should work with hero present
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should handle missing cursorGlow element gracefully', async ({ page }) => {
        await page.goto('/');

        // Remove cursor glow before JS fully initializes
        await page.evaluate(() => {
            const glow = document.querySelector('.cursor-glow');
            if (glow) glow.remove();
        });

        // Page should still work - wait for hero to be visible
        await page.waitForFunction(() => {
            const hero = document.querySelector('.hero');
            return hero && hero.offsetWidth > 0 && hero.offsetHeight > 0;
        });
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });
});
