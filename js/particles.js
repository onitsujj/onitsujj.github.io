/* ========================================
   PARTICLE NAME SYSTEM (Delta Time)
   ======================================== */

import { CONFIG, Performance, isTouchDevice } from './config.js';

export class ParticleNameSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0, radius: 100 };
        this.text = 'ONITSUJJ';
        // Use cached touch detection from config (avoid duplicate matchMedia call)
        this.isTouch = isTouchDevice;
        this.isMobile = false;
        this.heroElement = null;
        this.resizeTimeout = null;
        this.canvasRect = null;

        // Physics constants (per second, scaled by delta)
        this.attractionStrength = 1.8;  // Per second
        this.repelStrength = 480;       // Per second
        this.damping = 0.92;

        this.init();
    }

    init() {
        // Cache DOM element to avoid repeated queries
        this.heroElement = document.querySelector('.hero');

        // Defer initialization if hero not ready or has zero dimensions
        if (!this.heroElement || this.heroElement.offsetWidth === 0) {
            requestAnimationFrame(() => this.init());
            return;
        }

        this.resize();

        // robust touch detection
        const setTouch = () => {
            this.isTouch = true;
            // Remove listener once detected to save resources
            window.removeEventListener('touchstart', setTouch);
        };
        window.addEventListener('touchstart', setTouch, { passive: true });

        // Debounced resize handler to avoid excessive recalculations
        this._resizeHandler = () => {
            // Keep the matchMedia check as a backup/initial state
            if (!this.isTouch) {
                this.isTouch = window.matchMedia('(hover: none)').matches;
            }
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resize();
                this.createParticles();
            }, 150);
        };
        window.addEventListener('resize', this._resizeHandler);

        // Wait for font to load before creating particles
        // Font must be loaded for canvas text measurement to work correctly
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.createParticles());
        } else {
            // Fallback for browsers without FontFaceSet API
            this.createParticles();
        }
    }

    updateViewportState() {
        this.isMobile = window.innerWidth <= 1024;
    }

    resize() {
        // Update viewport state first (must run even if hero element is missing)
        this.updateViewportState();

        if (!this.heroElement) {
            this.heroElement = document.querySelector('.hero');
        }
        if (!this.heroElement) return;

        const width = this.heroElement.offsetWidth;
        const height = this.heroElement.offsetHeight;

        // Skip if dimensions are invalid
        if (width === 0 || height === 0) return;

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    createParticles() {
        // Guard against invalid canvas dimensions
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            return;
        }

        const offscreen = document.createElement('canvas');
        const offCtx = offscreen.getContext('2d');

        const fontSize = Math.min(this.canvas.width * 0.15, 150);
        offscreen.width = this.canvas.width;
        offscreen.height = this.canvas.height;

        // Calculate position of the spacer relative to the canvas
        const spacer = document.querySelector('.name-spacer');
        const hero = document.querySelector('.hero');

        let textX = offscreen.width / 2;
        let textY = offscreen.height / 2;

        if (spacer && hero) {
            const spacerRect = spacer.getBoundingClientRect();
            const heroRect = hero.getBoundingClientRect();

            // Calculate center relative to hero container
            textX = (spacerRect.left - heroRect.left) + (spacerRect.width / 2);
            textY = (spacerRect.top - heroRect.top) + (spacerRect.height / 2);
        }

        offCtx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
        offCtx.fillStyle = 'white';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(this.text, textX, textY);

        const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imageData.data;
        const gap = Performance.tier === 'low' ? 6 : Performance.tier === 'medium' ? 5 : 3;

        this.particles = [];

        for (let y = 0; y < offscreen.height; y += gap) {
            for (let x = 0; x < offscreen.width; x += gap) {
                const index = (y * offscreen.width + x) * 4;
                if (data[index + 3] > 128) {
                    this.particles.push({
                        targetX: x,
                        targetY: y,
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: 0,
                        vy: 0,
                        size: Math.random() * 1.5 + 0.5,
                        alpha: Math.random() * 0.5 + 0.5
                    });
                }
            }
        }

        // Limit particles based on performance tier
        if (this.particles.length > CONFIG.particleCount) {
            this.particles = this.particles
                .sort(() => Math.random() - 0.5)
                .slice(0, CONFIG.particleCount);
        }
    }

    update(delta) {
        // Scale physics by delta time (60fps baseline)
        const timeScale = delta * 60;

        this.particles.forEach(p => {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Repel from mouse (delta-scaled) - ONLY if not on touch device AND not on mobile
            // We strictly disable repulsion on mobile/tablets (< 1024px) to ensure readability while scrolling
            if (!this.isTouch && !this.isMobile && dist < this.mouse.radius) {
                const force = (this.mouse.radius - dist) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                p.vx -= Math.cos(angle) * force * this.repelStrength * delta;
                p.vy -= Math.sin(angle) * force * this.repelStrength * delta;
            }

            // Attract to target (delta-scaled)
            const attractX = p.targetX - p.x;
            const attractY = p.targetY - p.y;
            p.vx += attractX * this.attractionStrength * delta;
            p.vy += attractY * this.attractionStrength * delta;

            // Apply damping (frame-rate independent)
            // Fixed: Apply velocity before damping for correct physics
            p.x += p.vx * delta * 60;
            p.y += p.vy * delta * 60;

            // Then apply damping
            const dampingFactor = Math.pow(this.damping, timeScale);
            p.vx *= dampingFactor;
            p.vy *= dampingFactor;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            this.ctx.fill();
        });
    }

    setMouse(x, y) {
        if (!this.canvasRect) return;
        this.mouse.x = x - this.canvasRect.left;
        this.mouse.y = y - this.canvasRect.top;
    }

    destroy() {
        clearTimeout(this.resizeTimeout);
        window.removeEventListener('resize', this._resizeHandler);
    }
}
