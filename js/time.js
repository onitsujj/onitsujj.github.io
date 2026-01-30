/* ========================================
   DELTA TIME MANAGER
   ======================================== */

import { CONFIG } from './config.js';

export const Time = {
    now: performance.now(),
    last: performance.now(),
    delta: 0,           // Delta in seconds
    deltaMs: 0,         // Delta in milliseconds
    elapsed: 0,         // Total elapsed time
    frameInterval: 1000 / CONFIG.targetFps,
    lastFrameTime: 0,
    frameCap: true,     // Enable 60fps cap for consistency

    update(timestamp) {
        this.now = timestamp;
        this.deltaMs = this.now - this.last;
        this.delta = this.deltaMs / 1000;  // Convert to seconds
        this.elapsed += this.delta;
        this.last = this.now;

        // Cap delta to prevent huge jumps (e.g., when tab is inactive)
        if (this.delta > 0.1) this.delta = 0.016;

        return this.delta;
    },

    shouldRenderFrame(timestamp) {
        if (!this.frameCap) return true;

        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
            return true;
        }
        return false;
    }
};
