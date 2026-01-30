const { test, expect } = require('@playwright/test');

test.describe('Neural Network Boundary Clamping', () => {
    test('should clamp node positions within canvas bounds', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.neuralNetwork !== undefined);

        // Force nodes to edge positions and update
        const allNodesInBounds = await page.evaluate(() => {
            const nn = window.neuralNetwork;
            if (!nn) return false;

            // Force a node beyond bounds
            if (nn.nodes.length > 0) {
                nn.nodes[0].x = -100;
                nn.nodes[0].y = -100;
                nn.nodes[0].vx = -10;
                nn.nodes[0].vy = -10;

                // Update should clamp position
                nn.update(0.016);

                // Check if clamped
                return nn.nodes[0].x >= 0 && nn.nodes[0].y >= 0;
            }
            return true;
        });

        expect(allNodesInBounds).toBe(true);
    });
});
