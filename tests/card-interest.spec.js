const { test, expect } = require('@playwright/test');

test.describe('Card Interest Counter - Single Increment', () => {
    test('should only increment interest count once per mouseenter', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Clear any existing interest data
        await page.evaluate(() => {
            localStorage.removeItem('portfolio_interests');
        });
        await page.reload();
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Get the first project card
        const card = page.locator('.project-card').first();

        // Hover over the card once
        await card.hover();
        // Wait for interest to be tracked in localStorage
        await page.waitForFunction(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return (interests['1'] || 0) >= 1;
        });

        // Check interest count
        const interestCount = await page.evaluate(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return interests['1'] || 0;
        });

        // Should be exactly 1, not 2 (which would indicate duplicate handlers)
        expect(interestCount).toBe(1);
    });

    test('should increment to 2 after two separate hovers', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Clear any existing interest data
        await page.evaluate(() => {
            localStorage.removeItem('portfolio_interests');
        });
        await page.reload();
        await page.waitForFunction(() => window.particleSystem !== undefined);

        const card = page.locator('.project-card').first();

        // Hover, leave, hover again
        await card.hover();
        // Wait for first interest to be tracked
        await page.waitForFunction(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return (interests['1'] || 0) >= 1;
        });
        await page.mouse.move(0, 0); // Move away
        // Small delay to ensure mouseenter can fire again
        await page.waitForFunction(() => true); // Yield to event loop
        await card.hover();
        // Wait for second interest to be tracked
        await page.waitForFunction(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return (interests['1'] || 0) >= 2;
        });

        const interestCount = await page.evaluate(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return interests['1'] || 0;
        });

        // Should be exactly 2
        expect(interestCount).toBe(2);
    });
});
