const { test, expect } = require('@playwright/test');

test.describe('Mobile Particle Effect', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('should strictly disable repulsion on small screens', async ({ page }) => {
        // Go to page
        await page.goto('/');

        // Wait for particle system to initialize
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Check isMobile flag
        const isMobile = await page.evaluate(() => window.particleSystem.isMobile);
        console.log('Detected isMobile:', isMobile);
        expect(isMobile).toBe(true);

        // Check dimensions to be sure
        const canvasWidth = await page.evaluate(() => window.particleSystem.canvas.width);
        console.log('Canvas width:', canvasWidth);
        expect(canvasWidth).toBeLessThanOrEqual(375); // Should match hero width
    });

    test('should enable repulsion on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');

        await page.waitForFunction(() => window.particleSystem !== undefined);

        const isMobile = await page.evaluate(() => window.particleSystem.isMobile);
        console.log('Desktop isMobile:', isMobile);
        expect(isMobile).toBe(false);
    });
});
