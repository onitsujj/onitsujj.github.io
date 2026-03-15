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

test.describe('Reduced Motion Support', () => {
    test('should disable smooth scrolling and decorative canvases when reduced motion is requested', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const htmlScrollBehavior = await page.locator('html').evaluate((el) => {
            return window.getComputedStyle(el).scrollBehavior;
        });
        expect(htmlScrollBehavior).toBe('auto');

        const hiddenCanvases = await page.evaluate(() => {
            const selectors = ['#neural-bg', '#cursor-trail', '#particle-name'];
            return selectors.every((selector) => {
                const el = document.querySelector(selector);
                return el && window.getComputedStyle(el).display === 'none';
            });
        });
        expect(hiddenCanvases).toBe(true);
    });

    test('should keep the hero name visible in reduced motion mode', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();
        await expect(heading).toContainText(/onitsujj/i);
    });
});

test.describe('Mobile Hero Particle Anchor', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test('should reserve space for the particle name on small mobile viewports', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const anchorRect = await page.locator('.hero-name-anchor').evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height
            };
        });

        expect(anchorRect.width).toBeGreaterThan(0);
        expect(anchorRect.height).toBeGreaterThan(0);
    });
});
