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

// ============================================================================
// TDD RED PHASE: Feature 2 - Fixed 4-Column Grid Layout
// ============================================================================
// These tests are designed to FAIL initially because the feature doesn't exist yet.
// Current state: `.projects-grid` uses `auto-fit, minmax(360px, 1fr)`
// Target state: Fixed `repeat(4, 1fr)` on desktop, 2-col on tablet (<=768px), 1-col on mobile (<=480px)

test.describe('Feature: Fixed 4-Column Grid Layout - Black Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('displays 4 columns on desktop viewport (1200px)', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1200, height: 800 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should have exactly 4 column tracks (4 space-separated values)
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(4);
    });

    test('displays 2 columns on tablet viewport (768px)', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should have exactly 2 column tracks
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
        // Set small mobile viewport (iPhone SE size)
        await page.setViewportSize({ width: 375, height: 667 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should have exactly 1 column track
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(1);
    });
});

test.describe('Feature: Fixed 4-Column Grid Layout - White Box', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('grid uses repeat(4, 1fr) on desktop (>768px)', async ({ page }) => {
        // Set desktop viewport (above tablet breakpoint)
        await page.setViewportSize({ width: 1024, height: 768 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Computed style should show 4 equal-width columns
        // When using repeat(4, 1fr), browser computes actual pixel values like "240px 240px 240px 240px"
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(4);

        // All columns should have equal width (within tolerance for rounding)
        const widths = columnTracks.map(w => parseFloat(w));
        const firstWidth = widths[0];
        widths.forEach(width => {
            expect(Math.abs(width - firstWidth)).toBeLessThan(2); // 2px tolerance
        });
    });

    test('grid uses repeat(2, 1fr) at tablet breakpoint (<=768px)', async ({ page }) => {
        // Set viewport at tablet breakpoint
        await page.setViewportSize({ width: 768, height: 1024 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should show 2 equal-width columns
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(2);

        // Both columns should have equal width
        const widths = columnTracks.map(w => parseFloat(w));
        expect(Math.abs(widths[0] - widths[1])).toBeLessThan(2);
    });

    test('grid uses 1fr (single column) at mobile breakpoint (<=480px)', async ({ page }) => {
        // Set viewport at mobile breakpoint
        await page.setViewportSize({ width: 480, height: 800 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // Should show single column taking full width
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(1);
    });

    test('grid does NOT use auto-fit on desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1200, height: 800 });

        const grid = page.locator('.projects-grid');
        const computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });

        // With fixed columns, the number of columns should always be 4 on desktop
        // regardless of content. auto-fit would vary based on available space.
        const columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');

        // Key assertion: fixed layout means exactly 4 columns, not more or less
        expect(columnTracks.length).toBe(4);
    });

    test('tablet breakpoint triggers at exactly 768px or below', async ({ page }) => {
        // Test at exactly 769px (should be 4 columns - desktop)
        await page.setViewportSize({ width: 769, height: 1024 });
        let grid = page.locator('.projects-grid');
        let computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });
        let columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(4);

        // Test at exactly 768px (should be 2 columns - tablet)
        await page.setViewportSize({ width: 768, height: 1024 });
        grid = page.locator('.projects-grid');
        computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });
        columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(2);
    });

    test('mobile breakpoint triggers at exactly 480px or below', async ({ page }) => {
        // Test at exactly 481px (should be 2 columns - tablet)
        await page.setViewportSize({ width: 481, height: 800 });
        let grid = page.locator('.projects-grid');
        let computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });
        let columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(2);

        // Test at exactly 480px (should be 1 column - mobile)
        await page.setViewportSize({ width: 480, height: 800 });
        grid = page.locator('.projects-grid');
        computedStyle = await grid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });
        columnTracks = computedStyle.split(/\s+/).filter(v => v && v !== '0px');
        expect(columnTracks.length).toBe(1);
    });
});
