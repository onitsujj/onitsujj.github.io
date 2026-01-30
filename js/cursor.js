/* ========================================
   CURSOR TRAIL & CURSOR SYSTEM (Delta Time)
   ======================================== */

import { CONFIG } from './config.js';
import { state } from './state.js';

// ========================================
// CURSOR TRAIL SYSTEM (Delta Time)
// ========================================
export class CursorTrail {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.trail = [];
        this.fadeSpeed = 1.8;  // Per second
        this.shrinkRate = 3;   // Per second
        this.init();
    }

    init() {
        this.resize();
        this._resizeHandler = () => this.resize();
        window.addEventListener('resize', this._resizeHandler);
    }

    destroy() {
        window.removeEventListener('resize', this._resizeHandler);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    addPoint(x, y) {
        if (!CONFIG.enableCursorTrail) return;

        this.trail.push({ x, y, alpha: 1, size: 3 });
        if (this.trail.length > CONFIG.trailLength) {
            this.trail.shift();
        }
    }

    update(delta) {
        if (!CONFIG.enableCursorTrail) {
            this.trail = [];
            return;
        }

        this.trail.forEach(point => {
            point.alpha -= this.fadeSpeed * delta;
            point.size -= this.shrinkRate * delta;
            if (point.size < 0) point.size = 0;
        });
        this.trail = this.trail.filter(p => p.alpha > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.trail.length < 2) return;

        // Draw connecting lines
        this.ctx.beginPath();
        this.ctx.moveTo(this.trail[0].x, this.trail[0].y);

        for (let i = 1; i < this.trail.length; i++) {
            this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw points
        this.trail.forEach(point => {
            if (point.size > 0) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha * 0.3})`;
                this.ctx.fill();
            }
        });
    }
}

// ========================================
// CURSOR SYSTEM (Integrated)
// ========================================
export class CursorSystem {
    constructor() {
        this.cursorGlow = document.querySelector('.cursor-glow');
        this.cursorWhisper = document.querySelector('.cursor-whisper');
        this.lerpFactor = 0.15;
    }

    update(delta) {
        const scaledFactor = 1 - Math.pow(1 - this.lerpFactor, delta * 60);
        state.cursorX = this.lerp(state.cursorX, state.mouseX, scaledFactor);
        state.cursorY = this.lerp(state.cursorY, state.mouseY, scaledFactor);

        if (this.cursorGlow) {
            this.cursorGlow.style.left = state.cursorX + 'px';
            this.cursorGlow.style.top = state.cursorY + 'px';
        }

        if (this.cursorWhisper) {
            this.cursorWhisper.style.left = state.mouseX + 'px';
            this.cursorWhisper.style.top = state.mouseY + 'px';
        }
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}
