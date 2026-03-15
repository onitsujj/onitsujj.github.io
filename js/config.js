/* ========================================
   CONFIGURATION & PERFORMANCE DETECTION
   ======================================== */

// ========================================
// PERFORMANCE DETECTION & ADAPTIVE QUALITY
// ========================================
export const Performance = {
    tier: 'high',  // 'high', 'medium', 'low'
    fps: 60,
    frameCount: 0,
    lastFpsUpdate: performance.now(),
    samples: [],
    listeners: new Set(),

    detect() {
        // Safe hardwareConcurrency fallback (defaults to 4 if undefined)
        const cores = navigator.hardwareConcurrency || 4;

        // Check for low-end device indicators
        const isLowEnd = (
            cores <= 2 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth < 768
        );

        const isMedium = (
            cores <= 4 ||
            window.innerWidth < 1200
        );

        if (isLowEnd) {
            this.tier = 'low';
        } else if (isMedium) {
            this.tier = 'medium';
        } else {
            this.tier = 'high';
        }

        console.log(`%c[Performance] Detected tier: ${this.tier}`, 'color: #888');
        return this.tier;
    },

    updateFps(timestamp) {
        this.frameCount++;
        const elapsed = timestamp - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.samples.push(this.fps);

            // Keep last 5 samples
            if (this.samples.length > 5) this.samples.shift();

            // Auto-downgrade if FPS drops
            const avgFps = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
            if (avgFps < 30 && this.tier !== 'low') {
                this.tier = 'low';
                this.applySettings();
                console.log('%c[Performance] Downgraded to low tier', 'color: #ff8800');
            } else if (avgFps < 45 && this.tier === 'high') {
                this.tier = 'medium';
                this.applySettings();
                console.log('%c[Performance] Downgraded to medium tier', 'color: #ff8800');
            }

            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
    },

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    },

    notify() {
        this.listeners.forEach((listener) => listener(this.tier));
    },

    applySettings() {
        // Update CONFIG based on tier
        switch (this.tier) {
            case 'low':
                CONFIG.particleCount = 500;
                CONFIG.neuralNodes = 20;
                CONFIG.neuralConnections = 30;
                CONFIG.trailLength = 10;
                CONFIG.enableCursorTrail = false;
                CONFIG.enableCursorEffects = false;
                break;
            case 'medium':
                CONFIG.particleCount = 1000;
                CONFIG.neuralNodes = 35;
                CONFIG.neuralConnections = 50;
                CONFIG.trailLength = 15;
                CONFIG.enableCursorTrail = true;
                CONFIG.enableCursorEffects = true;
                break;
            case 'high':
            default:
                CONFIG.particleCount = 5000;
                CONFIG.neuralNodes = 70;
                CONFIG.neuralConnections = 100;
                CONFIG.trailLength = 25;
                CONFIG.enableCursorTrail = true;
                CONFIG.enableCursorEffects = true;
                break;
        }

        this.notify();
    }
};

// ========================================
// CACHED MEDIA QUERY
// ========================================
export const isTouchDevice = window.matchMedia('(hover: none)').matches;

// ========================================
// CONFIGURATION (Adaptive based on performance)
// ========================================
export const CONFIG = {
    particleCount: 2000,
    neuralNodes: 50,
    neuralConnections: 80,
    trailLength: 20,
    idleTimeout: 5000,
    fastScrollThreshold: 50,
    targetFps: 60,
    enableCursorTrail: true,
    enableCursorEffects: true,
    // Behavior thresholds (extracted magic numbers)
    cardInterestNotice: 3,
    cardInterestHigh: 5,
    maxConnectionDistance: 200
};

// Detect and apply initial settings
Performance.detect();
Performance.applySettings();
