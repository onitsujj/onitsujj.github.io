const { test, expect } = require('@playwright/test');

test.describe('BehaviorSystem Null Safety', () => {
    test('should handle missing whisper element gracefully', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.behaviorSystem !== undefined);

        // Remove the whisper element
        await page.evaluate(() => {
            const whisper = document.querySelector('.behavior-whisper');
            if (whisper) whisper.remove();
        });

        // Try to show a whisper - should not crash
        const noError = await page.evaluate(() => {
            try {
                window.behaviorSystem.showWhisper('test message');
                return true;
            } catch (e) {
                return false;
            }
        });

        expect(noError).toBe(true);
    });
});
