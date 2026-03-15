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

test.describe('Accessibility - Hero Semantics', () => {
    test('should expose a semantic page heading with the owner name', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1').first();
        await expect(heading).toContainText(/onitsujj/i);
    });
});

test.describe('Accessibility - Project Visibility', () => {
    test('should keep project links visible without hover', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const projectLink = page.locator('.project-card .project-link').first();
        await expect(projectLink).toBeVisible();

        const styles = await projectLink.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                visibility: computed.visibility,
                opacity: computed.opacity
            };
        });
        const box = await projectLink.boundingBox();

        expect(styles.visibility).not.toBe('hidden');
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
        expect(box).not.toBeNull();
        if (!box) return;
        expect(box.height).toBeGreaterThan(0);
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
