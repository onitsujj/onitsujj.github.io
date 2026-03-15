/* ========================================
   LIVING GRID - LEGENDARY INTELLIGENCE ENGINE
   Delta time + Performance mode + Adaptive quality
   Main Entry Point (ES6 Modules)
   ======================================== */

// Import all modules
import { CONFIG, Performance, isTouchDevice } from './config.js';
import { Time } from './time.js';
import { state, safeSetItem } from './state.js';
import { ParticleNameSystem } from './particles.js';
import { NeuralNetwork } from './neural.js';
import { CursorTrail, CursorSystem } from './cursor.js';
import { BehaviorSystem } from './behavior.js';

// ========================================
// TIME OF DAY GREETINGS
// ========================================
function setTimeGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.querySelector('.greeting-text');
    const body = document.body;

    let greeting, period;

    if (hour >= 5 && hour < 12) {
        period = 'morning';
        greeting = state.visitCount > 1 ? 'good morning, curious one...' : 'the morning light reveals...';
    } else if (hour >= 12 && hour < 17) {
        period = 'afternoon';
        greeting = state.visitCount > 1 ? 'you returned...' : 'something is waking up...';
    } else if (hour >= 17 && hour < 21) {
        period = 'evening';
        greeting = state.visitCount > 1 ? 'welcome back to the grid...' : 'the evening brings visitors...';
    } else {
        period = 'night';
        greeting = state.visitCount > 1 ? 'the night owl returns...' : 'late night explorations...';
    }

    body.setAttribute('data-time-period', period);
    if (greetingEl) greetingEl.textContent = greeting;
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set time greeting
    setTimeGreeting();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = motionQuery.matches;
    document.body.dataset.motion = prefersReducedMotion ? 'reduced' : 'full';
    document.body.dataset.performanceTier = Performance.tier;

    // ========================================
    // INITIALIZE SYSTEMS
    // ========================================
    const particleCanvas = document.getElementById('particle-name');
    const neuralCanvas = document.getElementById('neural-bg');
    const trailCanvas = document.getElementById('cursor-trail');

    const particleSystem = new ParticleNameSystem(particleCanvas);
    const neuralNetwork = new NeuralNetwork(neuralCanvas);
    const cursorTrail = new CursorTrail(trailCanvas);
    const behaviorSystem = new BehaviorSystem();
    const cursorSystem = new CursorSystem();

    // Expose for testing
    window.particleSystem = particleSystem;
    window.neuralNetwork = neuralNetwork;
    window.behaviorSystem = behaviorSystem;
    window.Performance = Performance;
    window.state = state;
    window.motionSettings = {
        prefersReducedMotion
    };

    if (state.visitCount > 1) behaviorSystem.onReturn();

    const applyPerformanceTier = () => {
        document.body.dataset.performanceTier = Performance.tier;
        particleSystem.createParticles();
        neuralNetwork.createNetwork();
    };
    const unsubscribePerformance = Performance.subscribe(applyPerformanceTier);
    applyPerformanceTier();

    // ========================================
    // MASTER ANIMATION LOOP (Delta Time + Frame Cap)
    // ========================================
    function masterLoop(timestamp) {
        // Always request next frame first for smooth timing
        requestAnimationFrame(masterLoop);

        // Check if we should render this frame (60fps cap)
        if (!Time.shouldRenderFrame(timestamp)) return;

        // Update delta time
        const delta = Time.update(timestamp);

        // Update FPS counter and auto-adjust quality
        Performance.updateFps(timestamp);

        // Update all systems with delta time
        particleSystem.update(delta);
        neuralNetwork.update(delta);
        cursorTrail.update(delta);
        cursorSystem.update(delta); // Integrated cursor update

        // Draw all systems
        particleSystem.draw();
        neuralNetwork.draw();
        cursorTrail.draw();
    }

    // Start the master loop
    if (!prefersReducedMotion) {
        requestAnimationFrame(masterLoop);
    }

    // ========================================
    // MOUSE MOVEMENT HANDLER
    // ========================================
    if (!prefersReducedMotion) {
        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
            state.hasInteracted = true;

            particleSystem.setMouse(e.clientX, e.clientY);
            cursorTrail.addPoint(e.clientX, e.clientY);

            clearTimeout(state.idleTimer);
            state.isIdle = false;
            state.idleTimer = setTimeout(() => {
                state.isIdle = true;
                behaviorSystem.onIdle();
            }, CONFIG.idleTimeout);
        });
    }

    // Cursor whisper on interactive elements
    document.querySelectorAll('[data-cursor-text]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cursorSystem.cursorWhisper) {
                cursorSystem.cursorWhisper.textContent = el.dataset.cursorText;
                cursorSystem.cursorWhisper.style.opacity = '1';
            }
        });
        el.addEventListener('mouseleave', () => {
            if (cursorSystem.cursorWhisper) {
                cursorSystem.cursorWhisper.style.opacity = '0';
            }
        });
    });

    // ========================================
    // PROJECT CARDS (Single mouseenter handler)
    // ========================================
    const cards = document.querySelectorAll('.project-card');

    // Cache breathing elements to avoid DOM queries in scroll handler
    const cardBreathingMap = new Map();
    cards.forEach(card => {
        const breathing = card.querySelector('.card-breathing');
        if (breathing) cardBreathingMap.set(card, breathing);
    });

    cards.forEach((card) => {
        const cardGlow = card.querySelector('.card-glow');
        const projectId = card.dataset.projectId;

        if (!state.cardInterests[projectId]) state.cardInterests[projectId] = 0;

        // SINGLE mouseenter handler (fixed duplicate issue)
        card.addEventListener('mouseenter', () => {
            card.classList.add('visible');

            // Increment interest count ONCE
            state.cardInterests[projectId]++;
            safeSetItem('portfolio_interests', state.cardInterests);

            // Trigger behavior system
            behaviorSystem.onCardInterest(projectId, state.cardInterests[projectId]);

            if (state.cardInterests[projectId] >= CONFIG.cardInterestNotice) {
                card.classList.add('interested');
            }

            // Glitch effect
            const title = card.querySelector('.glitch-text');
            if (title) {
                title.classList.add('glitching');
                setTimeout(() => title.classList.remove('glitching'), 200);
            }
        });

        if (state.cardInterests[projectId] >= CONFIG.cardInterestNotice) {
            card.classList.add('interested');
        }

        // Apply glow tracking on devices with hover capability
        if (!isTouchDevice && cardGlow) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                cardGlow.style.setProperty('--mouse-x', (x / rect.width) * 100 + '%');
                cardGlow.style.setProperty('--mouse-y', (y / rect.height) * 100 + '%');
            });
        }
    });

    // ========================================
    // SCROLL REVEAL & NARRATIVES
    // ========================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const index = [...document.querySelectorAll('.project-card')].indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), index * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => revealObserver.observe(card));

    const narrativeFragments = document.querySelectorAll('.narrative-fragment');
    let lastScrollProgress = 0;
    let scrollRAFPending = false;

    // Unified scroll handler with RAF batching to prevent layout thrashing
    window.addEventListener('scroll', () => {
        // Capture scroll position immediately (cheap read)
        const scrollY = window.scrollY;
        const now = Date.now();

        // Update scroll speed tracking (no layout reads needed)
        const dt = now - state.lastScrollTime;
        const dy = Math.abs(scrollY - state.lastScrollY);
        state.scrollSpeed = dt > 0 ? (dy / dt) * 1000 : 0;

        if (state.scrollSpeed > CONFIG.fastScrollThreshold && state.hasInteracted) {
            behaviorSystem.onFastScroll();
        }

        state.lastScrollY = scrollY;
        state.lastScrollTime = now;

        // Batch layout-triggering operations in RAF
        if (!scrollRAFPending) {
            scrollRAFPending = true;
            requestAnimationFrame(() => {
                scrollRAFPending = false;

                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

                if (!prefersReducedMotion) {
                    // Update narrative fragments
                    narrativeFragments.forEach(fragment => {
                        const trigger = parseFloat(fragment.dataset.trigger);
                        fragment.classList.toggle('visible', scrollProgress >= trigger && scrollProgress < trigger + 0.15);
                    });
                }

                if (scrollProgress > 0.95 && lastScrollProgress <= 0.95) behaviorSystem.onScrollToBottom();
                lastScrollProgress = scrollProgress;

                // Batch read phase: collect all card positions
                const cardData = [];
                const viewportCenter = window.innerHeight / 2;
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const cardCenter = rect.top + rect.height / 2;
                    const awakeness = 1 - Math.min(Math.abs(cardCenter - viewportCenter) / viewportCenter, 1);
                    cardData.push({ card, awakeness });
                });

                // Batch write phase: apply all style changes
                cardData.forEach(({ card, awakeness }) => {
                    const breathing = cardBreathingMap.get(card);
                    if (breathing) {
                        breathing.style.opacity = prefersReducedMotion ? '0.3' : 0.3 + (awakeness * 0.4);
                    }
                });

            });
        }
    }, { passive: true });

    // ========================================
    // SMOOTH SCROLL
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const href = anchor.getAttribute('href');
            if (!href) return;
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
            }
        });
    });

    // ========================================
    // MAGNETIC BUTTONS
    // ========================================
    if (!prefersReducedMotion) {
        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });
            btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0, 0)');
        });
    }

    // ========================================
    // HERO PARALLAX
    // ========================================
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && !prefersReducedMotion) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 15;
            const y = (e.clientY / window.innerHeight - 0.5) * 15;
            heroContent.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // ========================================
    // EASTER EGG - KONAMI CODE
    // ========================================
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                document.body.style.setProperty('--glitch-1', '#ff0080');
                document.body.style.setProperty('--glitch-2', '#00ff80');
                document.body.style.setProperty('--accent-pulse', 'rgba(255, 0, 128, 0.1)');
                behaviorSystem.showWhisper('▲▲▼▼◄►◄►BA... legendary mode unlocked', 5000);
                particleSystem.mouse.radius = 300;
                setTimeout(() => particleSystem.mouse.radius = 100, 2000);
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // ========================================
    // GLITCH TEXT ON RANDOM INTERVALS
    // ========================================
    const glitchTexts = document.querySelectorAll('.glitch-text');
    let glitchTimerId = null;

    function randomGlitch() {
        if (glitchTexts.length === 0) return;
        const text = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
        if (text) {
            text.classList.add('glitching');
            setTimeout(() => text.classList.remove('glitching'), 200);
        }
        glitchTimerId = setTimeout(randomGlitch, Math.random() * 10000 + 5000);
    }
    if (!prefersReducedMotion) {
        glitchTimerId = setTimeout(randomGlitch, 5000);
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribePerformance();
        if (glitchTimerId) clearTimeout(glitchTimerId);
        if (state.idleTimer) clearTimeout(state.idleTimer);
    });

    // ========================================
    // CONSOLE MESSAGE
    // ========================================
    console.log(`
    %c◉ LIVING GRID PORTFOLIO - LEGENDARY EDITION ◉

    Performance Tier: ${Performance.tier.toUpperCase()}
    Particles: ${CONFIG.particleCount}
    Neural Nodes: ${CONFIG.neuralNodes}
    Cursor Trail: ${CONFIG.enableCursorTrail ? 'ON' : 'OFF'}

    ✦ Delta Time: ENABLED (frame-rate independent)
    ✦ Adaptive Quality: ENABLED (auto-adjusts based on FPS)
    ✦ Frame Cap: ${Time.frameCap ? '60fps' : 'UNCAPPED'}
    ✦ Target FPS: ${CONFIG.targetFps}

    Visits: ${state.visitCount}

    Easter egg: ↑↑↓↓←→←→BA

    → hello@onitsujj.com

    `, 'color: #00ffff; font-family: monospace; font-size: 11px;');


    // ========================================
    // COMMAND DOCK FADE ON FOOTER VISIBILITY
    // ========================================
    const commandDock = document.querySelector('.command-dock');
    const footer = document.querySelector('.footer');

    if (commandDock && footer) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // Hide dock when any part of footer enters viewport
                commandDock.classList.toggle('dock-hidden', entry.isIntersecting);
            });
        }, {
            threshold: 0,
            rootMargin: '0px 0px 0px 0px'
        });

        footerObserver.observe(footer);
    }

    // ========================================
    // COMMAND DOCK LOGIC
    // ========================================
    const dockItems = document.querySelectorAll('.dock-item');

    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active class from all
            dockItems.forEach(i => i.classList.remove('active'));
            // Add to clicked (unless it's an external link)
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                item.classList.add('active');
                state.hasInteracted = true;
            }
        });
    });

    // Update active state on scroll (lightweight - no layout reads needed)
    let lastDockLabel = null;
    window.addEventListener('scroll', () => {
        // window.scrollY and window.innerHeight are cheap reads (no layout trigger)
        const newLabel = window.scrollY < window.innerHeight * 0.5 ? 'Home' : 'Projects';
        // Only update DOM if state changed
        if (newLabel !== lastDockLabel) {
            lastDockLabel = newLabel;
            updateActiveDock(newLabel);
        }
    }, { passive: true });

    function updateActiveDock(label) {
        dockItems.forEach(item => {
            const ariaLabel = item.getAttribute('aria-label');
            const href = item.getAttribute('href');
            if (ariaLabel === label) {
                item.classList.add('active');
            } else if (href && href.startsWith('#')) {
                item.classList.remove('active');
            }
        });
    }

});
