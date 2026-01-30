const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const CSS_PATH = path.resolve(__dirname, '../styles.css');

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
        await page.goto('/');
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
