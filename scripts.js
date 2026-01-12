/* ========================================
   LIVING GRID - LEGENDARY INTELLIGENCE ENGINE
   Delta time + Performance mode + Adaptive quality
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // PERFORMANCE DETECTION & ADAPTIVE QUALITY
    // ========================================
    const Performance = {
        tier: 'high',  // 'high', 'medium', 'low'
        fps: 60,
        frameCount: 0,
        lastFpsUpdate: performance.now(),
        samples: [],

        detect() {
            // Check for low-end device indicators
            const isLowEnd = (
                navigator.hardwareConcurrency <= 2 ||
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth < 768
            );

            const isMedium = (
                navigator.hardwareConcurrency <= 4 ||
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

        applySettings() {
            // Update CONFIG based on tier
            switch (this.tier) {
                case 'low':
                    CONFIG.particleCount = 500;
                    CONFIG.neuralNodes = 20;
                    CONFIG.neuralConnections = 30;
                    CONFIG.trailLength = 10;
                    CONFIG.enableCursorTrail = false;
                    break;
                case 'medium':
                    CONFIG.particleCount = 1000;
                    CONFIG.neuralNodes = 35;
                    CONFIG.neuralConnections = 50;
                    CONFIG.trailLength = 15;
                    CONFIG.enableCursorTrail = true;
                    break;
                case 'high':
                default:
                    CONFIG.particleCount = 2000;
                    CONFIG.neuralNodes = 50;
                    CONFIG.neuralConnections = 80;
                    CONFIG.trailLength = 20;
                    CONFIG.enableCursorTrail = true;
                    break;
            }
        }
    };

    // ========================================
    // CONFIGURATION (Adaptive based on performance)
    // ========================================
    const CONFIG = {
        particleCount: 2000,
        neuralNodes: 50,
        neuralConnections: 80,
        trailLength: 20,
        idleTimeout: 5000,
        fastScrollThreshold: 50,
        targetFps: 60,
        enableCursorTrail: true
    };

    // Detect and apply initial settings
    Performance.detect();
    Performance.applySettings();

    // ========================================
    // DELTA TIME MANAGER
    // ========================================
    const Time = {
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

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    const state = {
        mouseX: 0,
        mouseY: 0,
        cursorX: 0,
        cursorY: 0,
        isIdle: false,
        idleTimer: null,
        scrollSpeed: 0,
        lastScrollY: 0,
        lastScrollTime: Date.now(),
        soundEnabled: false,
        visitCount: parseInt(localStorage.getItem('portfolio_visits') || '0'),
        cardInterests: JSON.parse(localStorage.getItem('portfolio_interests') || '{}'),
        behaviorMessages: [],
        hasInteracted: false
    };

    // Increment visit count
    state.visitCount++;
    localStorage.setItem('portfolio_visits', state.visitCount);

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

    setTimeGreeting();

    // ========================================
    // PARTICLE NAME SYSTEM (Delta Time)
    // ========================================
    class ParticleNameSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: 0, y: 0, radius: 100 };
            this.text = 'Onitsujj';
            this.assembled = false;
            // Check for touch capability to disable repulsion on scroll
            this.isTouch = window.matchMedia('(hover: none)').matches;

            // Physics constants (per second, scaled by delta)
            this.attractionStrength = 1.8;  // Per second
            this.repelStrength = 480;       // Per second
            this.damping = 0.92;

            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => {
                this.isTouch = window.matchMedia('(hover: none)').matches;
                this.resize();
                this.createParticles();
            });
            this.createParticles();
        }

        resize() {
            const hero = document.querySelector('.hero');
            this.canvas.width = hero.offsetWidth;
            this.canvas.height = hero.offsetHeight;
        }

        createParticles() {
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
            const gap = Performance.tier === 'low' ? 6 : Performance.tier === 'medium' ? 5 : 4;

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

                // Repel from mouse (delta-scaled) - ONLY if not on touch device
                if (!this.isTouch && dist < this.mouse.radius) {
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
                const dampingFactor = Math.pow(this.damping, timeScale);
                p.vx *= dampingFactor;
                p.vy *= dampingFactor;

                // Update position
                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;
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
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = x - rect.left;
            this.mouse.y = y - rect.top;
        }
    }

    // ========================================
    // NEURAL NETWORK BACKGROUND (Delta Time)
    // ========================================
    class NeuralNetwork {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.nodes = [];
            this.connections = [];

            // Speed in pixels per second
            this.nodeSpeed = 18;
            this.pulseSpeed = 1.2;

            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.createNetwork();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.nodes.length) this.createNetwork();
        }

        createNetwork() {
            this.nodes = [];
            this.connections = [];

            const nodeCount = CONFIG.neuralNodes;

            for (let i = 0; i < nodeCount; i++) {
                this.nodes.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * this.nodeSpeed,
                    vy: (Math.random() - 0.5) * this.nodeSpeed,
                    radius: Math.random() * 2 + 1,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }

            this.updateConnections();
        }

        updateConnections() {
            this.connections = [];
            const maxDist = 200;

            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const dx = this.nodes[i].x - this.nodes[j].x;
                    const dy = this.nodes[i].y - this.nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist && this.connections.length < CONFIG.neuralConnections) {
                        this.connections.push({ from: i, to: j, maxDist });
                    }
                }
            }
        }

        update(delta) {
            this.nodes.forEach(node => {
                // Move nodes (delta-scaled)
                node.x += node.vx * delta;
                node.y += node.vy * delta;

                // Bounce off edges
                if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

                // Update pulse (delta-scaled)
                node.pulsePhase += this.pulseSpeed * delta;
            });

            // Periodically update connections
            if (Math.random() < delta * 0.6) this.updateConnections();
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw connections
            this.connections.forEach(conn => {
                const from = this.nodes[conn.from];
                const to = this.nodes[conn.to];
                const dx = from.x - to.x;
                const dy = from.y - to.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const alpha = (1 - dist / conn.maxDist) * 0.15;

                this.ctx.beginPath();
                this.ctx.moveTo(from.x, from.y);
                this.ctx.lineTo(to.x, to.y);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            });

            // Draw nodes
            this.nodes.forEach(node => {
                const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7;
                const radius = node.radius * pulse;

                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
                this.ctx.fill();
            });
        }
    }

    // ========================================
    // CURSOR TRAIL SYSTEM (Delta Time)
    // ========================================
    class CursorTrail {
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
            window.addEventListener('resize', () => this.resize());
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
    // SOUND DESIGN SYSTEM
    // ========================================
    class SoundSystem {
        constructor() {
            this.ctx = null;
            this.enabled = false;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        }

        enable() {
            this.init();
            this.enabled = true;
            this.playAmbient();
        }

        disable() {
            this.enabled = false;
        }

        playTone(frequency, duration, volume = 0.1) {
            if (!this.enabled || !this.ctx) return;

            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

            oscillator.start(this.ctx.currentTime);
            oscillator.stop(this.ctx.currentTime + duration);
        }

        playHover() { this.playTone(800, 0.1, 0.05); }
        playClick() {
            this.playTone(600, 0.15, 0.08);
            setTimeout(() => this.playTone(900, 0.1, 0.05), 50);
        }

        playAmbient() {
            if (!this.enabled || !this.ctx) return;

            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            oscillator.frequency.value = 60;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.02;

            oscillator.start();
            this.ambientOsc = oscillator;
            this.ambientGain = gainNode;
        }
    }

    // ========================================
    // BEHAVIOR AWARENESS SYSTEM
    // ========================================
    class BehaviorSystem {
        constructor() {
            this.whisperEl = document.querySelector('.behavior-whisper');
            this.messageTimeout = null;
            this.shownMessages = new Set();
        }

        showWhisper(message, duration = 3000) {
            if (this.shownMessages.has(message)) return;
            this.shownMessages.add(message);

            this.whisperEl.textContent = message;
            this.whisperEl.classList.add('visible');

            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                this.whisperEl.classList.remove('visible');
            }, duration);
        }

        onIdle() {
            const msgs = ['still thinking?', 'take your time...', 'the grid waits patiently...', 'curiosity paused...'];
            this.showWhisper(msgs[Math.floor(Math.random() * msgs.length)]);
        }

        onFastScroll() {
            const msgs = ['eager to explore...', 'slow down, there\'s more to see...', 'the curious ones scroll carefully...'];
            this.showWhisper(msgs[Math.floor(Math.random() * msgs.length)]);
        }

        onCardInterest(projectId, count) {
            if (count === 3) this.showWhisper('this one catches your eye...');
            else if (count === 5) this.showWhisper('definitely interested in this one...');
        }

        onReturn() {
            if (state.visitCount === 2) setTimeout(() => this.showWhisper('you came back...'), 3000);
            else if (state.visitCount > 5) setTimeout(() => this.showWhisper('a familiar presence...'), 3000);
        }

        onScrollToBottom() { this.showWhisper('you\'ve seen everything... or have you?'); }
    }

    // ========================================
    // INITIALIZE SYSTEMS
    // ========================================
    const particleCanvas = document.getElementById('particle-name');
    const neuralCanvas = document.getElementById('neural-bg');
    const trailCanvas = document.getElementById('cursor-trail');

    const particleSystem = new ParticleNameSystem(particleCanvas);
    const neuralNetwork = new NeuralNetwork(neuralCanvas);
    const cursorTrail = new CursorTrail(trailCanvas);
    const soundSystem = new SoundSystem();
    const behaviorSystem = new BehaviorSystem();

    if (state.visitCount > 1) behaviorSystem.onReturn();

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

        // Draw all systems
        particleSystem.draw();
        neuralNetwork.draw();
        cursorTrail.draw();
    }

    // Start the master loop
    requestAnimationFrame(masterLoop);

    // ========================================
    // CURSOR SYSTEM
    // ========================================
    const cursorGlow = document.querySelector('.cursor-glow');
    const cursorWhisper = document.querySelector('.cursor-whisper');
    const lerp = (start, end, factor) => start + (end - start) * factor;

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

    function updateCursor() {
        state.cursorX = lerp(state.cursorX, state.mouseX, 0.15);
        state.cursorY = lerp(state.cursorY, state.mouseY, 0.15);

        cursorGlow.style.left = state.cursorX + 'px';
        cursorGlow.style.top = state.cursorY + 'px';
        cursorWhisper.style.left = state.mouseX + 'px';
        cursorWhisper.style.top = state.mouseY + 'px';

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Cursor whisper on interactive elements
    document.querySelectorAll('[data-cursor-text]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorWhisper.textContent = el.dataset.cursorText;
            cursorWhisper.style.opacity = '1';
            soundSystem.playHover();
        });
        el.addEventListener('mouseleave', () => cursorWhisper.style.opacity = '0');
    });

    // ========================================
    // SOUND TOGGLE
    // ========================================
    const soundToggle = document.querySelector('.sound-toggle');
    soundToggle.addEventListener('click', () => {
        const isOn = soundToggle.dataset.sound === 'on';
        soundToggle.dataset.sound = isOn ? 'off' : 'on';
        isOn ? soundSystem.disable() : (soundSystem.enable(), soundSystem.playClick());
    });

    // ========================================
    // PROJECT CARDS
    // ========================================
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
        const cardInner = card.querySelector('.card-inner');
        const cardGlow = card.querySelector('.card-glow');
        const projectId = card.dataset.projectId;

        if (!state.cardInterests[projectId]) state.cardInterests[projectId] = 0;
        if (state.cardInterests[projectId] >= 3) card.classList.add('interested');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height / 2) / 15;
            const rotateY = (rect.width / 2 - x) / 15;

            cardInner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            cardGlow.style.setProperty('--mouse-x', (x / rect.width) * 100 + '%');
            cardGlow.style.setProperty('--mouse-y', (y / rect.height) * 100 + '%');
        });

        card.addEventListener('mouseenter', () => {
            state.cardInterests[projectId]++;
            localStorage.setItem('portfolio_interests', JSON.stringify(state.cardInterests));
            if (state.cardInterests[projectId] >= 3) card.classList.add('interested');
            behaviorSystem.onCardInterest(projectId, state.cardInterests[projectId]);

            const title = card.querySelector('.glitch-text');
            if (title) {
                title.classList.add('glitching');
                setTimeout(() => title.classList.remove('glitching'), 200);
            }
            soundSystem.playHover();
        });

        card.addEventListener('mouseleave', () => {
            cardInner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
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

    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = window.scrollY / scrollHeight;

        const now = Date.now();
        const dt = now - state.lastScrollTime;
        const dy = Math.abs(window.scrollY - state.lastScrollY);
        state.scrollSpeed = dy / dt * 1000;

        if (state.scrollSpeed > CONFIG.fastScrollThreshold && state.hasInteracted) {
            behaviorSystem.onFastScroll();
        }

        state.lastScrollY = window.scrollY;
        state.lastScrollTime = now;

        narrativeFragments.forEach(fragment => {
            const trigger = parseFloat(fragment.dataset.trigger);
            fragment.classList.toggle('visible', scrollProgress >= trigger && scrollProgress < trigger + 0.15);
        });

        if (scrollProgress > 0.95 && lastScrollProgress <= 0.95) behaviorSystem.onScrollToBottom();
        lastScrollProgress = scrollProgress;

        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const awakeness = 1 - Math.min(Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2), 1);
            const breathing = card.querySelector('.card-breathing');
            if (breathing) breathing.style.opacity = 0.3 + (awakeness * 0.4);
        });
    });

    // ========================================
    // SMOOTH SCROLL
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                soundSystem.playClick();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ========================================
    // MAGNETIC BUTTONS
    // ========================================
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0, 0)');
    });

    // ========================================
    // HERO PARALLAX
    // ========================================
    const heroContent = document.querySelector('.hero-content');
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 15;
        const y = (e.clientY / window.innerHeight - 0.5) * 15;
        heroContent.style.transform = `translate(${x}px, ${y}px)`;
    });

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
                soundSystem.playClick();
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

    function randomGlitch() {
        const text = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
        if (text) {
            text.classList.add('glitching');
            setTimeout(() => text.classList.remove('glitching'), 200);
        }
        setTimeout(randomGlitch, Math.random() * 10000 + 5000);
    }
    setTimeout(randomGlitch, 5000);

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

});
