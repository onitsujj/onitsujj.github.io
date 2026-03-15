const { test, expect } = require('@playwright/test');

const FIRST_PROJECT_CARD_SELECTOR = '.project-card[data-project-id="1"]';

test.describe('Project Cards - Black Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
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

    test('shows project summary and live link without hover', async ({ page }) => {
        const card = page.locator(FIRST_PROJECT_CARD_SELECTOR);
        const description = card.locator('.expanded-description');
        const projectLink = card.locator('.project-link');

        await expect(description).toBeVisible();
        await expect(projectLink).toBeVisible();
    });

    test('project link navigates to correct URL', async ({ page }) => {
        const projectLink = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-link`);
        const href = await projectLink.getAttribute('href');

        expect(href).toBe('https://pogo-max-particle-calculator.vercel.app/');
    });

    test('two project cards exist', async ({ page }) => {
        const projectCards = page.locator('.project-card');
        await expect(projectCards).toHaveCount(2);
    });

    test('card link is accessible via keyboard without revealing hidden content', async ({ page }) => {
        const projectLink = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-link`);

        await projectLink.focus();

        const isFocused = await projectLink.evaluate((el) => document.activeElement === el);
        expect(isFocused).toBe(true);

        const href = await projectLink.getAttribute('href');
        expect(href).toBeDefined();
        expect(href).not.toBe('#');

        const styles = await projectLink.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                visibility: computed.visibility,
                opacity: computed.opacity
            };
        });

        expect(styles.visibility).not.toBe('hidden');
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    });
});

test.describe('Project Cards - White Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
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

// ============================================================================
// TDD RED PHASE: Feature 1 - Project Card Screenshot Image
// ============================================================================
// These tests are designed to FAIL initially because the feature doesn't exist yet.
// Current state: Card has `.placeholder-visual` with project number
// Target state: Card will have `<img class="project-image-src" src="assets/projects/max-particle-calculator.png" alt="..." loading="lazy">`

test.describe('Feature: Project Card Screenshot Image - Black Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('project image loads successfully and is visible', async ({ page }) => {
        const projectImage = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image-src`);

        // Image element should exist and be visible
        await expect(projectImage).toBeVisible();

        // Image should have loaded successfully (naturalWidth > 0 indicates loaded)
        const isLoaded = await projectImage.evaluate((img) => {
            return img.complete && img.naturalWidth > 0;
        });
        expect(isLoaded).toBe(true);
    });

    test('project image displays correctly within card bounds', async ({ page }) => {
        const projectImage = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image-src`);
        const imageContainer = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image`);

        // Get bounding boxes
        const imageBounds = await projectImage.boundingBox();
        const containerBounds = await imageContainer.boundingBox();

        // Image should be contained within its parent
        expect(imageBounds).not.toBeNull();
        expect(containerBounds).not.toBeNull();
        expect(imageBounds.x).toBeGreaterThanOrEqual(containerBounds.x);
        expect(imageBounds.y).toBeGreaterThanOrEqual(containerBounds.y);
    });
});

test.describe('Feature: Project Card Screenshot Image - White Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('.project-image-src element exists with correct src attribute', async ({ page }) => {
        const projectImage = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image-src`);

        // Element should exist
        await expect(projectImage).toHaveCount(1);

        // Should have correct src attribute pointing to project screenshot
        const src = await projectImage.getAttribute('src');
        expect(src).toBe('assets/projects/max-particle-calculator.png');
    });

    test('.project-image-src has alt attribute for accessibility', async ({ page }) => {
        const projectImage = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image-src`);

        // Should have alt attribute (required for accessibility)
        const alt = await projectImage.getAttribute('alt');
        expect(alt).toBeDefined();
        expect(alt).not.toBe('');
        // Alt text should be descriptive (at minimum contain project name)
        expect(alt.toLowerCase()).toContain('max particle calculator');
    });

    test('.project-image-src has loading="lazy" for performance', async ({ page }) => {
        const projectImage = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image-src`);

        // Should have lazy loading attribute for performance
        const loading = await projectImage.getAttribute('loading');
        expect(loading).toBe('lazy');
    });

    test('.placeholder-visual should NOT exist after implementation', async ({ page }) => {
        const placeholderVisual = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .placeholder-visual`);

        // The placeholder visual should be removed once real image is implemented
        await expect(placeholderVisual).toHaveCount(0);
    });

    test('image is inside .project-image container', async ({ page }) => {
        const imageInContainer = page.locator(`${FIRST_PROJECT_CARD_SELECTOR} .project-image .project-image-src`);

        // Image should be a child of .project-image container
        await expect(imageInContainer).toHaveCount(1);
    });
});

test.describe('Feature: Adaptive Grid Layout For Two Projects', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('displays 2 columns on desktop viewport (1200px)', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(2);
    });

    test('displays 2 columns on tablet viewport (768px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(2);
    });

    test('displays 1 column on mobile viewport (480px)', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 480, height: 800 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should have exactly 1 column track
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(1);
    });

    test('displays 1 column on small mobile viewport (375px)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should have exactly 1 column track
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(1);
    });

    test('desktop layout does not create more columns than cards', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });

        const grid = page.locator('.projects-grid');
        const result = await grid.evaluate((el) => {
            const computedStyle = window.getComputedStyle(el).gridTemplateColumns;
            const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
            const cards = el.querySelectorAll('.project-card').length;
            return {
                columnCount: columnTracks.length,
                cardCount: cards
            };
        });

        expect(result.cardCount).toBe(2);
        expect(result.columnCount).toBeLessThanOrEqual(result.cardCount);
    });
});

// ============================================================================
// Christoppers Project Card Tests
// ============================================================================

const CHRISTOPPERS_CARD_SELECTOR = '.project-card[data-project-id="2"]';

test.describe('Christoppers Project Card - Black Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('displays Christoppers project title', async ({ page }) => {
        const projectTitle = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .glitch-text`);
        await expect(projectTitle).toHaveText('Christoppers');
    });

    test('shows correct tech stack', async ({ page }) => {
        const techStack = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .tech-stack`);
        await expect(techStack).toHaveText('Next.js • React • Supabase');
    });

    test('project link navigates to correct URL', async ({ page }) => {
        const projectLink = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-link`);
        const href = await projectLink.getAttribute('href');

        expect(href).toBe('https://christoppers.com/');
    });

    test('category label shows Portfolio Gallery', async ({ page }) => {
        const categoryLabel = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .expanded-label`);
        await expect(categoryLabel).toHaveText('Portfolio Gallery');
    });

    test('project image loads successfully and is visible', async ({ page }) => {
        const projectImage = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-image-src`);

        // Image element should exist and be visible
        await expect(projectImage).toBeVisible();

        // Image should have loaded successfully (naturalWidth > 0 indicates loaded)
        const isLoaded = await projectImage.evaluate((img) => {
            return img.complete && img.naturalWidth > 0;
        });
        expect(isLoaded).toBe(true);
    });
});

test.describe('Christoppers Project Card - White Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('card has correct data-project-id attribute', async ({ page }) => {
        const card = page.locator(CHRISTOPPERS_CARD_SELECTOR);
        const projectId = await card.getAttribute('data-project-id');

        expect(projectId).toBe('2');
    });

    test('glitch text has matching data-text attribute', async ({ page }) => {
        const glitchText = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .glitch-text`);
        const dataText = await glitchText.getAttribute('data-text');
        const innerText = await glitchText.textContent();

        expect(dataText).toBe(innerText);
    });

    test('.project-image-src element exists with correct src attribute', async ({ page }) => {
        const projectImage = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-image-src`);

        await expect(projectImage).toHaveCount(1);

        const src = await projectImage.getAttribute('src');
        expect(src).toBe('assets/projects/christoppers.webp');
    });

    test('.project-image-src has alt attribute for accessibility', async ({ page }) => {
        const projectImage = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-image-src`);

        const alt = await projectImage.getAttribute('alt');
        expect(alt).toBeDefined();
        expect(alt).not.toBe('');
        expect(alt.toLowerCase()).toContain('christoppers');
    });

    test('.project-image-src has loading="lazy" for performance', async ({ page }) => {
        const projectImage = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-image-src`);

        const loading = await projectImage.getAttribute('loading');
        expect(loading).toBe('lazy');
    });

    test('link has security attributes for external URL', async ({ page }) => {
        const projectLink = page.locator(`${CHRISTOPPERS_CARD_SELECTOR} .project-link`);

        const target = await projectLink.getAttribute('target');
        const rel = await projectLink.getAttribute('rel');

        expect(target).toBe('_blank');
        expect(rel).toMatch(/noopener|noreferrer/);
    });

    test('card structure contains all required elements', async ({ page }) => {
        const card = page.locator(CHRISTOPPERS_CARD_SELECTOR);

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
});
