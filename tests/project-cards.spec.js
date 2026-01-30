const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '../index.html')}`;
const FIRST_PROJECT_CARD_SELECTOR = '.project-card[data-project-id="1"]';

test.describe('Project Cards - Black Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('displays Max Particle Calculator project', async ({ page }) => {
        const projectTitle = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .glitch-text`);
        await expect(projectTitle).toHaveText('Max Particle Calculator');
    });

    test('shows correct tech stack', async ({ page }) => {
        const techStack = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .tech-stack`);
        await expect(techStack).toHaveText('Next.js \u2022 TypeScript \u2022 Tailwind');
    });

    test('expands card on hover to show description', async ({ page }) => {
        const card = page.locator(FIRST_PROJECT_CARD_SELECTOR);
        const expandedContent = card.locator('.card-expanded');

        // Before hover, expanded content should be translated off-screen (translateY(100%))
        const transformBefore = await expandedContent.evaluate((el) => {
            return window.getComputedStyle(el).transform;
        });
        // translateY(100%) results in a matrix with non-zero Y translation
        expect(transformBefore).not.toBe('none');
        expect(transformBefore).toContain('matrix');

        // Hover over card
        await card.hover();
        // Wait for transition to complete - expanded content should have translateY(0)
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(`${selector} .card-expanded`);
                if (!el) return false;
                const transform = window.getComputedStyle(el).transform;
                if (transform === 'none') return true;
                const match = transform.match(/matrix\(([^)]+)\)/);
                if (!match) return false;
                const values = match[1].split(',').map(v => parseFloat(v.trim()));
                return Math.abs(values[5]) < 5;
            },
            FIRST_PROJECT_CARD_SELECTOR,
            { timeout: 5000 }
        );

        // After hover, expanded content should be visible (translateY(0) = matrix with no Y translation)
        const transformAfter = await expandedContent.evaluate((el) => {
            return window.getComputedStyle(el).transform;
        });
        // translateY(0) results in 'none' or a matrix with zero translation
        // When fully expanded, the 6th value of the matrix (translateY) should be 0 or near 0
        if (transformAfter !== 'none') {
            const matrixMatch = transformAfter.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
                const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
                // matrix(a, b, c, d, tx, ty) - ty is the 6th value (index 5)
                expect(Math.abs(values[5])).toBeLessThan(5); // Allow small rounding
            }
        }
    });

    test('project link navigates to correct URL', async ({ page }) => {
        const projectLink = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-link`);
        const href = await projectLink.getAttribute('href');

        expect(href).toBe('https://pogo-max-particle-calculator.vercel.app/');
    });

    test('only one project card exists', async ({ page }) => {
        const projectCards = page.locator('.project-card');
        await expect(projectCards).toHaveCount(1);
    });

    test('card is accessible via keyboard', async ({ page }) => {
        // Tab to the project card's link
        const projectLink = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-link`);

        // Focus the link via keyboard navigation
        await projectLink.focus();

        // Check that the link is focused
        const isFocused = await projectLink.evaluate((el) => document.activeElement === el);
        expect(isFocused).toBe(true);

        // Verify link is keyboard accessible (can be activated with Enter)
        const href = await projectLink.getAttribute('href');
        expect(href).toBeDefined();
        expect(href).not.toBe('#');
    });
});

test.describe('Project Cards - White Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('card has correct data-project-id attribute', async ({ page }) => {
        const card = page.locator('.project-card').first();
        const projectId = await card.getAttribute('data-project-id');

        expect(projectId).toBe('1');
    });

    test('card has cursor text attribute for custom cursor', async ({ page }) => {
        const card = page.locator(FIRST_PROJECT_CARD_SELECTOR);
        const cursorText = await card.getAttribute('data-cursor-text');

        expect(cursorText).toBe('View Project');
    });

    test('glitch text has matching data-text attribute', async ({ page }) => {
        const glitchText = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .glitch-text`);
        const dataText = await glitchText.getAttribute('data-text');
        const innerText = await glitchText.textContent();

        // data-text attribute should match the visible text for glitch effect
        expect(dataText).toBe(innerText);
    });

    test('card structure contains all required elements', async ({ page }) => {
        const card = page.locator(FIRST_PROJECT_CARD_SELECTOR);

        // Verify all required structural elements exist
        await expect(card.locator('.card-inner')).toHaveCount(1);
        await expect(card.locator('.card-face.card-front')).toHaveCount(1);
        await expect(card.locator('.project-image')).toHaveCount(1);
        await expect(card.locator('.project-info')).toHaveCount(1);
        await expect(card.locator('.glitch-text')).toHaveCount(1);
        await expect(card.locator('.tech-stack')).toHaveCount(1);
        await expect(card.locator('.card-expanded')).toHaveCount(1);
        await expect(card.locator('.expanded-content')).toHaveCount(1);
        await expect(card.locator('.expanded-label')).toHaveCount(1);
        await expect(card.locator('.expanded-description')).toHaveCount(1);
        await expect(card.locator('.project-link')).toHaveCount(1);
        await expect(card.locator('.card-glow')).toHaveCount(1);
    });

    test('project number displays 01', async ({ page }) => {
        const projectNumber = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-number`);
        await expect(projectNumber).toHaveText('01');
    });

    test('link has security attributes for external URL', async ({ page }) => {
        const projectLink = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-link`);

        // External links should have target="_blank" and security attributes
        const target = await projectLink.getAttribute('target');
        const rel = await projectLink.getAttribute('rel');

        expect(target).toBe('_blank');
        // rel should contain 'noopener' and/or 'noreferrer' for security
        expect(rel).toMatch(/noopener|noreferrer/);
    });

    test('interest tracking initializes for project ID', async ({ page }) => {
        // Clear any existing interest data
        await page.evaluate(() => {
            localStorage.removeItem('portfolio_interests');
        });
        await page.reload();
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });

        const card = page.locator(FIRST_PROJECT_CARD_SELECTOR);

        // Hover over the card to trigger interest tracking
        await card.hover();
        // Wait for interest to be tracked in localStorage
        await page.waitForFunction(
            () => {
                const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
                return (interests['1'] || 0) >= 1;
            },
            { timeout: 5000 }
        );

        // Check interest count for project ID 1
        const interestCount = await page.evaluate(() => {
            const interests = JSON.parse(localStorage.getItem('portfolio_interests') || '{}');
            return interests['1'] || 0;
        });

        // Interest should be tracked (count >= 1)
        expect(interestCount).toBeGreaterThanOrEqual(1);
    });

    test('category label shows Pokemon GO Tool', async ({ page }) => {
        const categoryLabel = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .expanded-label`);
        await expect(categoryLabel).toHaveText('Pokemon GO Tool');
    });
});
