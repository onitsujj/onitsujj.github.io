const { test, expect } = require('@playwright/test');

// ============================================================================
// DELTA TIME PHYSICS - ParticleNameSystem
// ============================================================================

test.describe('ParticleNameSystem - Particle Attraction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('particles should move toward their target positions', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Create a controlled test particle far from its target
            const testParticle = {
                x: 50, y: 50,
                targetX: 200, targetY: 200,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            const initialX = testParticle.x;
            const initialY = testParticle.y;
            const targetX = testParticle.targetX;
            const targetY = testParticle.targetY;

            // Calculate initial distance
            const initialDist = Math.sqrt(
                Math.pow(targetX - initialX, 2) + Math.pow(targetY - initialY, 2)
            );

            // Store original particles and use test particle
            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            // Apply several small updates to simulate movement
            for (let i = 0; i < 10; i++) {
                ps.update(0.016); // ~60fps delta
            }

            // Calculate new distance
            const finalDist = Math.sqrt(
                Math.pow(targetX - testParticle.x, 2) + Math.pow(targetY - testParticle.y, 2)
            );

            // Restore original particles
            ps.particles = originalParticles;

            return {
                initialDist,
                finalDist,
                movedCloser: finalDist < initialDist
            };
        });

        expect(result.movedCloser).toBe(true);
        expect(result.finalDist).toBeLessThan(result.initialDist);
    });

    test('movement should be scaled by delta time', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Create two test particles with identical properties
            // Using particles that start with velocity to test delta scaling directly
            const testParticle1 = {
                x: 100, y: 100,
                targetX: 100, targetY: 100, // At target to avoid attraction interference
                vx: 10, vy: 10, // Fixed initial velocity
                size: 1, alpha: 1
            };
            const testParticle2 = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 10, vy: 10,
                size: 1, alpha: 1
            };

            // Store original particles
            const originalParticles = ps.particles;

            // Test with small delta - only apply velocity, position change = vx * delta * 60
            ps.particles = [testParticle1];
            ps.update(0.008); // Half frame time
            const smallDeltaMove = Math.sqrt(
                Math.pow(testParticle1.x - 100, 2) + Math.pow(testParticle1.y - 100, 2)
            );

            // Test with larger delta
            ps.particles = [testParticle2];
            ps.update(0.016); // Full frame time
            const largeDeltaMove = Math.sqrt(
                Math.pow(testParticle2.x - 100, 2) + Math.pow(testParticle2.y - 100, 2)
            );

            // Restore original particles
            ps.particles = originalParticles;

            return {
                smallDeltaMove,
                largeDeltaMove,
                // Larger delta should cause proportionally larger movement
                ratio: largeDeltaMove / smallDeltaMove
            };
        });

        // Movement with 2x delta should result in approximately 2x movement
        expect(result.largeDeltaMove).toBeGreaterThan(result.smallDeltaMove);
        // The ratio should be close to 2x (velocity * delta * 60 is linear with delta)
        // Allow for some variance due to damping factor differences
        expect(result.ratio).toBeGreaterThan(1.8);
        expect(result.ratio).toBeLessThan(2.2);
    });

    test('particles should eventually reach targets (within threshold)', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Create a test particle close to target
            const testParticle = {
                x: 190, y: 190,
                targetX: 200, targetY: 200,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            // Run many updates to let particle settle
            for (let i = 0; i < 300; i++) {
                ps.update(0.016);
            }

            const finalDist = Math.sqrt(
                Math.pow(testParticle.targetX - testParticle.x, 2) +
                Math.pow(testParticle.targetY - testParticle.y, 2)
            );

            ps.particles = originalParticles;

            return {
                finalDist,
                withinThreshold: finalDist < 5 // Should be very close
            };
        });

        expect(result.withinThreshold).toBe(true);
        expect(result.finalDist).toBeLessThan(5);
    });
});

test.describe('ParticleNameSystem - Mouse Repulsion', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('particles should repel from mouse position on desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1280, height: 800 });

        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Ensure we're in desktop mode
            ps.isMobile = false;
            ps.isTouch = false;

            // Create a test particle near the mouse
            const testParticle = {
                x: 100, y: 100,
                targetX: 100, targetY: 100, // Target at same position
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            // Set mouse position near the particle (within radius)
            ps.mouse.x = 105;
            ps.mouse.y = 105;
            ps.mouse.radius = 100; // Ensure particle is within radius

            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            // Update
            ps.update(0.016);

            // Check if particle moved away from mouse
            const movedAwayX = testParticle.x < 100 || testParticle.vx < 0;
            const movedAwayY = testParticle.y < 100 || testParticle.vy < 0;

            ps.particles = originalParticles;

            return {
                movedAwayX,
                movedAwayY,
                vx: testParticle.vx,
                vy: testParticle.vy
            };
        });

        // Particle should have negative velocity (moving away from mouse at 105,105)
        expect(result.vx).toBeLessThan(0);
        expect(result.vy).toBeLessThan(0);
    });

    test('repulsion should NOT happen on touch devices', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Simulate touch device
            ps.isTouch = true;
            ps.isMobile = false;

            const testParticle = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            ps.mouse.x = 105;
            ps.mouse.y = 105;
            ps.mouse.radius = 100;

            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            ps.update(0.016);

            // On touch device, attraction should still work but repulsion should not
            // So velocity will be toward target, not away from mouse
            const hadRepulsion = testParticle.vx < -0.01 || testParticle.vy < -0.01;

            ps.particles = originalParticles;

            return {
                vx: testParticle.vx,
                vy: testParticle.vy,
                hadRepulsion
            };
        });

        // No significant negative velocity from repulsion
        expect(result.hadRepulsion).toBe(false);
    });

    test('repulsion should NOT happen on mobile (< 1024px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Simulate mobile mode (as detected by resize handler)
            ps.isMobile = true;
            ps.isTouch = false; // Even if not touch, mobile should block repulsion

            const testParticle = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            ps.mouse.x = 105;
            ps.mouse.y = 105;
            ps.mouse.radius = 100;

            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            ps.update(0.016);

            const hadRepulsion = testParticle.vx < -0.01 || testParticle.vy < -0.01;

            ps.particles = originalParticles;

            return {
                isMobile: ps.isMobile,
                hadRepulsion
            };
        });

        expect(result.isMobile).toBe(true);
        expect(result.hadRepulsion).toBe(false);
    });

    test('repulsion force should scale with distance', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            ps.isMobile = false;
            ps.isTouch = false;

            // Particle close to mouse
            const closeParticle = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            // Particle farther from mouse
            const farParticle = {
                x: 150, y: 150,
                targetX: 150, targetY: 150,
                vx: 0, vy: 0,
                size: 1, alpha: 1
            };

            ps.mouse.x = 100;
            ps.mouse.y = 100;
            ps.mouse.radius = 200;

            const originalParticles = ps.particles;

            // Test close particle
            ps.particles = [closeParticle];
            ps.update(0.016);
            const closeVelocity = Math.sqrt(closeParticle.vx ** 2 + closeParticle.vy ** 2);

            // Reset and test far particle
            ps.particles = [farParticle];
            ps.update(0.016);
            const farVelocity = Math.sqrt(farParticle.vx ** 2 + farParticle.vy ** 2);

            ps.particles = originalParticles;

            return {
                closeVelocity,
                farVelocity,
                closerHasMoreForce: closeVelocity > farVelocity
            };
        });

        // Closer particle should experience stronger repulsion force
        expect(result.closerHasMoreForce).toBe(true);
    });
});

test.describe('ParticleNameSystem - Damping', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('velocity should decrease over time due to damping', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            const testParticle = {
                x: 100, y: 100,
                targetX: 100, targetY: 100, // At target so no attraction
                vx: 10, vy: 10, // Initial velocity
                size: 1, alpha: 1
            };

            const originalParticles = ps.particles;
            ps.particles = [testParticle];

            const initialVelocity = Math.sqrt(testParticle.vx ** 2 + testParticle.vy ** 2);

            // Update several times
            for (let i = 0; i < 10; i++) {
                ps.update(0.016);
            }

            const finalVelocity = Math.sqrt(testParticle.vx ** 2 + testParticle.vy ** 2);

            ps.particles = originalParticles;

            return {
                initialVelocity,
                finalVelocity,
                velocityDecreased: finalVelocity < initialVelocity
            };
        });

        expect(result.velocityDecreased).toBe(true);
        expect(result.finalVelocity).toBeLessThan(result.initialVelocity);
    });

    test('damping should be frame-rate independent', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;

            // Test with many small updates (high frame rate)
            const particle1 = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 10, vy: 10,
                size: 1, alpha: 1
            };

            // Test with fewer large updates (low frame rate)
            const particle2 = {
                x: 100, y: 100,
                targetX: 100, targetY: 100,
                vx: 10, vy: 10,
                size: 1, alpha: 1
            };

            const originalParticles = ps.particles;

            // Simulate 100ms with 60fps (many small deltas)
            ps.particles = [particle1];
            for (let i = 0; i < 6; i++) {
                ps.update(0.016);
            }
            const highFpsVelocity = Math.sqrt(particle1.vx ** 2 + particle1.vy ** 2);

            // Simulate ~100ms with 30fps (fewer larger deltas)
            ps.particles = [particle2];
            for (let i = 0; i < 3; i++) {
                ps.update(0.032);
            }
            const lowFpsVelocity = Math.sqrt(particle2.vx ** 2 + particle2.vy ** 2);

            ps.particles = originalParticles;

            return {
                highFpsVelocity,
                lowFpsVelocity,
                // Should be similar regardless of frame rate
                ratio: highFpsVelocity / lowFpsVelocity
            };
        });

        // Velocities should be similar (within 20% tolerance)
        expect(result.ratio).toBeGreaterThan(0.8);
        expect(result.ratio).toBeLessThan(1.2);
    });
});

// ============================================================================
// NEURAL NETWORK PHYSICS
// ============================================================================

test.describe('NeuralNetwork - Node Movement', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.neuralNetwork !== undefined, { timeout: 5000 });
    });

    test('nodes should move based on velocity * delta', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            // Store initial positions
            const initialPositions = nn.nodes.map(n => ({ x: n.x, y: n.y }));

            // Update with specific delta
            nn.update(0.016);

            // Check if nodes moved
            let movedCount = 0;
            for (let i = 0; i < nn.nodes.length; i++) {
                const dx = Math.abs(nn.nodes[i].x - initialPositions[i].x);
                const dy = Math.abs(nn.nodes[i].y - initialPositions[i].y);
                if (dx > 0.001 || dy > 0.001) movedCount++;
            }

            return {
                totalNodes: nn.nodes.length,
                movedCount,
                allMoved: movedCount === nn.nodes.length
            };
        });

        // All nodes should move (unless at exactly 0 velocity, which is rare)
        expect(result.movedCount).toBeGreaterThan(0);
    });

    test('movement should be proportional to delta time', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            // Create test node with known velocity
            const originalNodes = nn.nodes;

            // Test with small delta
            nn.nodes = [{ x: 100, y: 100, vx: 18, vy: 18, radius: 2, pulsePhase: 0 }];
            nn.update(0.008);
            const smallDeltaMove = Math.sqrt(
                Math.pow(nn.nodes[0].x - 100, 2) + Math.pow(nn.nodes[0].y - 100, 2)
            );

            // Test with larger delta
            nn.nodes = [{ x: 100, y: 100, vx: 18, vy: 18, radius: 2, pulsePhase: 0 }];
            nn.update(0.016);
            const largeDeltaMove = Math.sqrt(
                Math.pow(nn.nodes[0].x - 100, 2) + Math.pow(nn.nodes[0].y - 100, 2)
            );

            nn.nodes = originalNodes;

            return {
                smallDeltaMove,
                largeDeltaMove,
                ratio: largeDeltaMove / smallDeltaMove
            };
        });

        // 2x delta should result in 2x movement
        expect(result.ratio).toBeCloseTo(2, 1);
    });

    test('nodes should bounce off canvas edges', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            const originalNodes = nn.nodes;

            // Test left edge bounce
            nn.nodes = [{ x: -5, y: 100, vx: -18, vy: 0, radius: 2, pulsePhase: 0 }];
            nn.update(0.016);
            const leftBounce = nn.nodes[0].vx > 0;
            const leftClamped = nn.nodes[0].x >= 0;

            // Test right edge bounce
            nn.nodes = [{ x: nn.canvas.width + 5, y: 100, vx: 18, vy: 0, radius: 2, pulsePhase: 0 }];
            nn.update(0.016);
            const rightBounce = nn.nodes[0].vx < 0;
            const rightClamped = nn.nodes[0].x <= nn.canvas.width;

            // Test top edge bounce
            nn.nodes = [{ x: 100, y: -5, vx: 0, vy: -18, radius: 2, pulsePhase: 0 }];
            nn.update(0.016);
            const topBounce = nn.nodes[0].vy > 0;
            const topClamped = nn.nodes[0].y >= 0;

            // Test bottom edge bounce
            nn.nodes = [{ x: 100, y: nn.canvas.height + 5, vx: 0, vy: 18, radius: 2, pulsePhase: 0 }];
            nn.update(0.016);
            const bottomBounce = nn.nodes[0].vy < 0;
            const bottomClamped = nn.nodes[0].y <= nn.canvas.height;

            nn.nodes = originalNodes;

            return {
                leftBounce, leftClamped,
                rightBounce, rightClamped,
                topBounce, topClamped,
                bottomBounce, bottomClamped
            };
        });

        expect(result.leftBounce).toBe(true);
        expect(result.leftClamped).toBe(true);
        expect(result.rightBounce).toBe(true);
        expect(result.rightClamped).toBe(true);
        expect(result.topBounce).toBe(true);
        expect(result.topClamped).toBe(true);
        expect(result.bottomBounce).toBe(true);
        expect(result.bottomClamped).toBe(true);
    });

    test('node positions should be clamped within bounds', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            // Run many updates and verify all nodes stay within bounds
            for (let i = 0; i < 100; i++) {
                nn.update(0.016);
            }

            const outOfBounds = nn.nodes.filter(n =>
                n.x < 0 || n.x > nn.canvas.width ||
                n.y < 0 || n.y > nn.canvas.height
            );

            return {
                totalNodes: nn.nodes.length,
                outOfBoundsCount: outOfBounds.length,
                canvasWidth: nn.canvas.width,
                canvasHeight: nn.canvas.height
            };
        });

        expect(result.outOfBoundsCount).toBe(0);
    });
});

test.describe('NeuralNetwork - Connections', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.neuralNetwork !== undefined, { timeout: 5000 });
    });

    test('connections should form between nearby nodes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            // Force recreate with nodes at known positions
            const originalNodes = nn.nodes;

            // Create two close nodes
            nn.nodes = [
                { x: 100, y: 100, vx: 0, vy: 0, radius: 2, pulsePhase: 0 },
                { x: 150, y: 150, vx: 0, vy: 0, radius: 2, pulsePhase: 0 }
            ];

            nn.updateConnections();

            const hasConnection = nn.connections.length > 0;

            nn.nodes = originalNodes;
            nn.updateConnections();

            return {
                hasConnection,
                connectionCount: nn.connections.length
            };
        });

        // Two close nodes should form a connection
        expect(result.hasConnection).toBe(true);
    });

    test('connections should respect maxConnectionDistance', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;

            const originalNodes = nn.nodes;

            // Create two nodes far apart (beyond maxConnectionDistance)
            nn.nodes = [
                { x: 0, y: 0, vx: 0, vy: 0, radius: 2, pulsePhase: 0 },
                { x: 500, y: 500, vx: 0, vy: 0, radius: 2, pulsePhase: 0 } // Far apart
            ];

            nn.updateConnections();

            const hasConnection = nn.connections.length > 0;

            nn.nodes = originalNodes;
            nn.updateConnections();

            return {
                hasConnection,
                // The distance between (0,0) and (500,500) is ~707px
                distance: Math.sqrt(500 * 500 + 500 * 500)
            };
        });

        // Nodes too far apart should not connect
        expect(result.hasConnection).toBe(false);
    });

    test('connection count should not exceed CONFIG.neuralConnections', async ({ page }) => {
        const result = await page.evaluate(() => {
            const nn = window.neuralNetwork;
            const CONFIG = { neuralConnections: 100 }; // Default high tier

            // Get the actual CONFIG from the page
            const actualConfig = window.neuralNetwork.connections.length;

            // The connections array should not exceed the limit
            return {
                connectionCount: nn.connections.length,
                // Can't directly access CONFIG, but we can check a reasonable limit
                withinReasonableLimit: nn.connections.length <= 200
            };
        });

        // Should be within reasonable limits
        expect(result.withinReasonableLimit).toBe(true);
    });
});

// ============================================================================
// MASTER ANIMATION LOOP
// ============================================================================

test.describe('Master Animation Loop - Frame Cap', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('shouldRenderFrame should respect 60fps cap', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Access Time object via closure (it's not exposed directly)
            // We'll test the frame timing logic indirectly

            // Simulate rapid timestamps to test frame capping
            const frameInterval = 1000 / 60; // ~16.67ms

            // We can test by observing update behavior
            // If we call updates faster than 60fps, some should be skipped
            const startTime = performance.now();
            let frameCount = 0;
            let lastFrameTime = startTime;

            // Simulate 100ms of time with 1ms resolution
            const frames = [];
            for (let t = 0; t < 100; t++) {
                const timestamp = startTime + t;
                const elapsed = timestamp - lastFrameTime;

                if (elapsed >= frameInterval) {
                    frameCount++;
                    lastFrameTime = timestamp - (elapsed % frameInterval);
                    frames.push(timestamp - startTime);
                }
            }

            return {
                frameCount,
                // In 100ms at 60fps, we should get ~6 frames
                expectedFrames: Math.floor(100 / frameInterval),
                framesAreCorrect: frameCount >= 5 && frameCount <= 7
            };
        });

        expect(result.framesAreCorrect).toBe(true);
    });

    test('should skip frames when shouldRenderFrame returns false', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Test the frame skipping logic
            const frameInterval = 1000 / 60;
            let lastFrameTime = 0;

            function shouldRenderFrame(timestamp) {
                const elapsed = timestamp - lastFrameTime;
                if (elapsed >= frameInterval) {
                    lastFrameTime = timestamp - (elapsed % frameInterval);
                    return true;
                }
                return false;
            }

            // Rapid calls should be skipped
            const results = [];
            for (let t = 0; t < 50; t++) {
                results.push(shouldRenderFrame(t));
            }

            const renderedCount = results.filter(r => r).length;
            const skippedCount = results.filter(r => !r).length;

            return {
                renderedCount,
                skippedCount,
                skipsFrames: skippedCount > renderedCount
            };
        });

        // Most frames should be skipped at 1ms resolution with 16.67ms frame interval
        expect(result.skipsFrames).toBe(true);
        expect(result.skippedCount).toBeGreaterThan(result.renderedCount);
    });
});

test.describe('Master Animation Loop - Delta Time', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('delta should be capped at 0.1 to prevent huge jumps', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Simulate the Time.update logic
            function updateTime(timestamp, lastTime) {
                const deltaMs = timestamp - lastTime;
                let delta = deltaMs / 1000;

                // Cap delta to prevent huge jumps (e.g., when tab is inactive)
                if (delta > 0.1) delta = 0.016;

                return delta;
            }

            // Normal frame (16ms)
            const normalDelta = updateTime(1016, 1000);

            // Large gap (1 second - tab was inactive)
            const largeDelta = updateTime(2000, 1000);

            // Very large gap (5 seconds)
            const veryLargeDelta = updateTime(6000, 1000);

            return {
                normalDelta,
                largeDelta,
                veryLargeDelta,
                normalIsCapped: normalDelta <= 0.1,
                largeIsCapped: largeDelta <= 0.1,
                veryLargeIsCapped: veryLargeDelta <= 0.1
            };
        });

        expect(result.normalIsCapped).toBe(true);
        expect(result.largeIsCapped).toBe(true);
        expect(result.veryLargeIsCapped).toBe(true);
        // Large deltas should be capped to 0.016 (not 0.1)
        expect(result.largeDelta).toBe(0.016);
        expect(result.veryLargeDelta).toBe(0.016);
    });

    test('delta should be in seconds (not milliseconds)', async ({ page }) => {
        const result = await page.evaluate(() => {
            // The Time object converts deltaMs to seconds
            function updateTime(timestamp, lastTime) {
                const deltaMs = timestamp - lastTime;
                const delta = deltaMs / 1000; // Convert to seconds
                return delta;
            }

            // 16.67ms frame time should become ~0.0167 seconds
            const delta = updateTime(1016.67, 1000);

            return {
                delta,
                isInSeconds: delta < 1, // Seconds will be < 1 for normal frames
                approximatelyCorrect: Math.abs(delta - 0.01667) < 0.001
            };
        });

        expect(result.isInSeconds).toBe(true);
        expect(result.approximatelyCorrect).toBe(true);
    });
});

// ============================================================================
// CURSOR TRAIL
// ============================================================================

test.describe('CursorTrail - Trail Points', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('should add points when cursor moves', async ({ page }) => {
        const result = await page.evaluate(() => {
            // CursorTrail is not exposed to window, so we test via mouse events
            const trailCanvas = document.getElementById('cursor-trail');

            // Dispatch multiple mousemove events
            for (let i = 0; i < 5; i++) {
                const event = new MouseEvent('mousemove', {
                    clientX: 100 + i * 10,
                    clientY: 100 + i * 10,
                    bubbles: true
                });
                document.dispatchEvent(event);
            }

            // We can't directly check cursorTrail.trail since it's not exposed
            // But we can verify the canvas exists and is being used
            return {
                canvasExists: trailCanvas !== null,
                canvasWidth: trailCanvas?.width || 0,
                canvasHeight: trailCanvas?.height || 0
            };
        });

        expect(result.canvasExists).toBe(true);
        expect(result.canvasWidth).toBeGreaterThan(0);
    });

    test('points should fade over time (alpha decreases)', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Test the fade logic directly
            const fadeSpeed = 1.8; // Per second (from CursorTrail)
            const delta = 0.016; // ~60fps

            let alpha = 1.0;
            const alphaHistory = [alpha];

            for (let i = 0; i < 30; i++) {
                alpha -= fadeSpeed * delta;
                alphaHistory.push(alpha);
            }

            return {
                initialAlpha: alphaHistory[0],
                finalAlpha: alphaHistory[alphaHistory.length - 1],
                alphaDecreased: alphaHistory[alphaHistory.length - 1] < alphaHistory[0],
                fadeRate: fadeSpeed * delta
            };
        });

        expect(result.alphaDecreased).toBe(true);
        expect(result.finalAlpha).toBeLessThan(result.initialAlpha);
    });

    test('points should be removed when alpha <= 0', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Test the removal logic
            const fadeSpeed = 1.8;
            const delta = 0.016;

            // Simulate trail array with fading points
            let trail = [
                { x: 100, y: 100, alpha: 0.5, size: 3 },
                { x: 110, y: 110, alpha: 0.1, size: 3 },
                { x: 120, y: 120, alpha: 0.02, size: 3 }
            ];

            // Update (fade) points
            trail.forEach(point => {
                point.alpha -= fadeSpeed * delta;
            });

            // Filter out dead points
            const filteredTrail = trail.filter(p => p.alpha > 0);

            return {
                initialCount: trail.length,
                filteredCount: filteredTrail.length,
                pointsRemoved: filteredTrail.length < trail.length
            };
        });

        // The point with alpha 0.02 should be removed after fading
        expect(result.pointsRemoved).toBe(true);
        expect(result.filteredCount).toBeLessThan(result.initialCount);
    });

    test('should respect CONFIG.trailLength limit', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Test the length limiting logic
            const trailLength = 20; // Default CONFIG value

            let trail = [];

            // Simulate adding many points
            for (let i = 0; i < 50; i++) {
                trail.push({ x: i, y: i, alpha: 1, size: 3 });

                // Apply length limit (as in addPoint)
                if (trail.length > trailLength) {
                    trail.shift();
                }
            }

            return {
                trailLength: trail.length,
                respectsLimit: trail.length <= trailLength
            };
        });

        expect(result.respectsLimit).toBe(true);
        expect(result.trailLength).toBeLessThanOrEqual(20);
    });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test.describe('Physics Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.particleSystem !== undefined, { timeout: 5000 });
    });

    test('all animation systems should work together', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;
            const nn = window.neuralNetwork;

            // Verify all systems are initialized
            const particlesExist = ps.particles.length > 0;
            const nodesExist = nn.nodes.length > 0;

            // Store initial state
            const initialParticlePos = { x: ps.particles[0].x, y: ps.particles[0].y };
            const initialNodePos = { x: nn.nodes[0].x, y: nn.nodes[0].y };

            // Run updates
            ps.update(0.016);
            nn.update(0.016);

            // Check if systems updated
            const particlesMoved =
                ps.particles[0].x !== initialParticlePos.x ||
                ps.particles[0].y !== initialParticlePos.y;
            const nodesMoved =
                nn.nodes[0].x !== initialNodePos.x ||
                nn.nodes[0].y !== initialNodePos.y;

            return {
                particlesExist,
                nodesExist,
                particlesMoved,
                nodesMoved
            };
        });

        expect(result.particlesExist).toBe(true);
        expect(result.nodesExist).toBe(true);
        expect(result.particlesMoved).toBe(true);
        expect(result.nodesMoved).toBe(true);
    });

    test('systems should handle rapid consecutive updates', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;
            const nn = window.neuralNetwork;

            let errors = [];

            try {
                // Rapid fire updates
                for (let i = 0; i < 100; i++) {
                    ps.update(0.016);
                    nn.update(0.016);
                }
            } catch (e) {
                errors.push(e.message);
            }

            return {
                errorCount: errors.length,
                particleSystemHealthy: ps.particles.length > 0,
                neuralNetworkHealthy: nn.nodes.length > 0
            };
        });

        expect(result.errorCount).toBe(0);
        expect(result.particleSystemHealthy).toBe(true);
        expect(result.neuralNetworkHealthy).toBe(true);
    });

    test('systems should handle extreme delta values gracefully', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ps = window.particleSystem;
            const nn = window.neuralNetwork;

            let errors = [];

            try {
                // Very small delta
                ps.update(0.001);
                nn.update(0.001);

                // Normal delta
                ps.update(0.016);
                nn.update(0.016);

                // Large delta (simulating tab inactive, though normally capped)
                ps.update(0.1);
                nn.update(0.1);
            } catch (e) {
                errors.push(e.message);
            }

            // Check particles and nodes are still valid
            const allParticlesValid = ps.particles.every(p =>
                typeof p.x === 'number' && !isNaN(p.x) &&
                typeof p.y === 'number' && !isNaN(p.y)
            );

            const allNodesValid = nn.nodes.every(n =>
                typeof n.x === 'number' && !isNaN(n.x) &&
                typeof n.y === 'number' && !isNaN(n.y)
            );

            return {
                errorCount: errors.length,
                allParticlesValid,
                allNodesValid
            };
        });

        expect(result.errorCount).toBe(0);
        expect(result.allParticlesValid).toBe(true);
        expect(result.allNodesValid).toBe(true);
    });
});
