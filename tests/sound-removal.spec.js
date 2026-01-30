const { test, expect } = require('@playwright/test');

test.describe('SoundSystem Removal', () => {
    test('should not have SoundSystem class', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        const hasSoundSystem = await page.evaluate(() => {
            return typeof window.soundSystem !== 'undefined';
        });

        expect(hasSoundSystem).toBe(false);
    });

    test('should not have sound toggle button in DOM', async ({ page }) => {
        await page.goto('/');

        const soundToggle = page.locator('.sound-toggle');
        await expect(soundToggle).toHaveCount(0);
    });

    test('should not have sound visualizer in dock', async ({ page }) => {
        await page.goto('/');

        const soundVisualizer = page.locator('.sound-visualizer');
        await expect(soundVisualizer).toHaveCount(0);
    });
});
