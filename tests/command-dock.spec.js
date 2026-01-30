const { test, expect } = require('@playwright/test');

test.describe('Command Dock Footer Visibility', () => {
    test('should have dock-hidden CSS class with correct properties', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Apply the class and wait for transition to complete
        const dockHiddenStyles = await page.evaluate(async () => {
            const dock = document.querySelector('.command-dock');
            if (!dock) return null;

            // Add the hidden class
            dock.classList.add('dock-hidden');

            // Wait for transition to complete (300ms + buffer)
            await new Promise(resolve => setTimeout(resolve, 350));

            const computed = window.getComputedStyle(dock);
            const result = {
                opacity: computed.opacity,
                pointerEvents: computed.pointerEvents,
                hasTransformY: computed.transform.includes('matrix') // translateY results in matrix
            };

            // Remove the class to restore state
            dock.classList.remove('dock-hidden');

            return result;
        });

        expect(dockHiddenStyles).not.toBeNull();
        // Use numeric comparison for opacity due to floating-point precision
        expect(parseFloat(dockHiddenStyles.opacity)).toBeLessThan(0.01);
        expect(dockHiddenStyles.pointerEvents).toBe('none');
        expect(dockHiddenStyles.hasTransformY).toBe(true);
    });

    test('should hide dock when footer is scrolled into view', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const dock = page.locator('.command-dock');
        const footer = page.locator('.footer');

        // Dock should be visible initially (no dock-hidden class)
        await expect(dock).not.toHaveClass(/dock-hidden/);

        // Scroll to footer
        await footer.scrollIntoViewIfNeeded();
        // Wait for IntersectionObserver to add dock-hidden class
        await page.waitForFunction(() => {
            const dock = document.querySelector('.command-dock');
            return dock && dock.classList.contains('dock-hidden');
        });

        // Dock should now have dock-hidden class
        await expect(dock).toHaveClass(/dock-hidden/);
    });

    test('should show dock when scrolling back up from footer', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const dock = page.locator('.command-dock');
        const footer = page.locator('.footer');
        const hero = page.locator('.hero');

        // Scroll to footer first
        await footer.scrollIntoViewIfNeeded();
        // Wait for IntersectionObserver to add dock-hidden class
        await page.waitForFunction(() => {
            const dock = document.querySelector('.command-dock');
            return dock && dock.classList.contains('dock-hidden');
        });
        await expect(dock).toHaveClass(/dock-hidden/);

        // Scroll back to top
        await hero.scrollIntoViewIfNeeded();
        // Wait for IntersectionObserver to remove dock-hidden class
        await page.waitForFunction(() => {
            const dock = document.querySelector('.command-dock');
            return dock && !dock.classList.contains('dock-hidden');
        });

        // Dock should be visible again
        await expect(dock).not.toHaveClass(/dock-hidden/);
    });
});
