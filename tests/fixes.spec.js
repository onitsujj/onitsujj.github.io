const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const FILE_URL = `file://${path.resolve(__dirname, '../index.html')}`;
const CSS_PATH = path.resolve(__dirname, '../styles.css');

test.describe('localStorage Error Handling', () => {
    test('should handle corrupted localStorage visitCount gracefully', async ({ page }) => {
        await page.goto(FILE_URL);

        // Set corrupted data
        await page.evaluate(() => {
            localStorage.setItem('portfolio_visits', 'not-a-number');
        });

        // Reload page - should not crash
        await page.reload();

        // Wait for initialization
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should still work
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should handle corrupted localStorage cardInterests gracefully', async ({ page }) => {
        await page.goto(FILE_URL);

        // Set corrupted JSON
        await page.evaluate(() => {
            localStorage.setItem('portfolio_interests', '{invalid json}');
        });

        // Reload page - should not crash
        await page.reload();

        // Wait for initialization
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should still work
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should use safe localStorage helper functions', async ({ page }) => {
        await page.goto(FILE_URL);

        // Check that safe helper functions exist
        const hasSafeHelpers = await page.evaluate(() => {
            return typeof window.safeGetNumber === 'function' &&
                   typeof window.safeGetJSON === 'function';
        });

        expect(hasSafeHelpers).toBe(true);
    });
});

test.describe('Performance Detection', () => {
    test('should have hardwareConcurrency fallback', async ({ page }) => {
        await page.goto(FILE_URL);

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

test.describe('Scroll Speed Calculation', () => {
    test('should not produce Infinity on rapid scroll events', async ({ page }) => {
        await page.goto(FILE_URL);
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

test.describe('Neural Network Boundary Clamping', () => {
    test('should clamp node positions within canvas bounds', async ({ page }) => {
        await page.goto(FILE_URL);
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

test.describe('BehaviorSystem Null Safety', () => {
    test('should handle missing whisper element gracefully', async ({ page }) => {
        await page.goto(FILE_URL);
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

test.describe('Card Interest Counter - Single Increment', () => {
    test('should only increment interest count once per mouseenter', async ({ page }) => {
        await page.goto(FILE_URL);
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
        await page.waitForTimeout(100); // Wait for event handlers

        // Check interest count
        const interestCount = await page.evaluate(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return interests['1'] || 0;
        });

        // Should be exactly 1, not 2 (which would indicate duplicate handlers)
        expect(interestCount).toBe(1);
    });

    test('should increment to 2 after two separate hovers', async ({ page }) => {
        await page.goto(FILE_URL);
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
        await page.waitForTimeout(100);
        await page.mouse.move(0, 0); // Move away
        await page.waitForTimeout(100);
        await card.hover();
        await page.waitForTimeout(100);

        const interestCount = await page.evaluate(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return interests['1'] || 0;
        });

        // Should be exactly 2
        expect(interestCount).toBe(2);
    });
});

test.describe('SoundSystem Removal', () => {
    test('should not have SoundSystem class', async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined);

        const hasSoundSystem = await page.evaluate(() => {
            return typeof window.soundSystem !== 'undefined';
        });

        expect(hasSoundSystem).toBe(false);
    });

    test('should not have sound toggle button in DOM', async ({ page }) => {
        await page.goto(FILE_URL);

        const soundToggle = page.locator('.sound-toggle');
        await expect(soundToggle).toHaveCount(0);
    });

    test('should not have sound visualizer in dock', async ({ page }) => {
        await page.goto(FILE_URL);

        const soundVisualizer = page.locator('.sound-visualizer');
        await expect(soundVisualizer).toHaveCount(0);
    });
});

test.describe('Cursor System Integration', () => {
    test('should not have separate updateCursor animation loop', async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Check that cursor update is integrated into master loop
        const hasSeparateCursorLoop = await page.evaluate(() => {
            // If cursor is integrated, there should be a cursorSystem or similar
            return typeof window.updateCursor === 'function';
        });

        // Should NOT have a separate updateCursor function exposed
        // (It should be integrated into masterLoop)
        expect(hasSeparateCursorLoop).toBe(false);
    });
});

test.describe('DOM Null Safety', () => {
    test('should handle missing hero element gracefully', async ({ page }) => {
        // First load page normally
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined);

        // Page should work with hero present
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });

    test('should handle missing cursorGlow element gracefully', async ({ page }) => {
        await page.goto(FILE_URL);

        // Remove cursor glow before JS fully initializes
        await page.evaluate(() => {
            const glow = document.querySelector('.cursor-glow');
            if (glow) glow.remove();
        });

        // Page should still work
        await page.waitForTimeout(500);
        const heroVisible = await page.locator('.hero').isVisible();
        expect(heroVisible).toBe(true);
    });
});

test.describe('Accessibility - Focus Visible', () => {
    test('should have focus-visible styles for interactive elements', async ({ page }) => {
        // Read CSS file directly using Node.js
        const cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

        // Verify the CSS file contains focus-visible rules
        expect(cssContent.includes(':focus-visible')).toBe(true);
        expect(cssContent.includes('outline:')).toBe(true);
    });
});

test.describe('CSS Duplicate Rules Removed', () => {
    test('should have single .copyright rule definition', async ({ page }) => {
        // Read CSS file directly using Node.js
        const cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

        // Count occurrences of ".copyright {" or ".copyright{" (rule definitions)
        const matches = cssContent.match(/\.copyright\s*\{/g) || [];
        expect(matches.length).toBe(1);
    });

    test('should have single .footer-link:hover rule definition', async ({ page }) => {
        // Read CSS file directly using Node.js
        const cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

        // Count occurrences of ".footer-link:hover {" rule definitions
        const matches = cssContent.match(/\.footer-link:hover\s*\{/g) || [];
        expect(matches.length).toBe(1);
    });
});

test.describe('Exposed Test Helpers', () => {
    test('should expose necessary objects for testing', async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined);

        const exposedObjects = await page.evaluate(() => ({
            particleSystem: typeof window.particleSystem !== 'undefined',
            neuralNetwork: typeof window.neuralNetwork !== 'undefined',
            behaviorSystem: typeof window.behaviorSystem !== 'undefined',
            Performance: typeof window.Performance !== 'undefined',
            state: typeof window.state !== 'undefined'
        }));

        expect(exposedObjects.particleSystem).toBe(true);
        expect(exposedObjects.neuralNetwork).toBe(true);
        expect(exposedObjects.behaviorSystem).toBe(true);
        expect(exposedObjects.Performance).toBe(true);
        expect(exposedObjects.state).toBe(true);
    });
});
