/* ========================================
   NEURAL NETWORK BACKGROUND (Delta Time)
   ======================================== */

import { CONFIG } from './config.js';

export class NeuralNetwork {
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
        this._resizeHandler = () => this.resize();
        window.addEventListener('resize', this._resizeHandler);
        this.createNetwork();
    }

    destroy() {
        window.removeEventListener('resize', this._resizeHandler);
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
        const maxDist = CONFIG.maxConnectionDistance;

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

            // Bounce off edges with position clamping
            if (node.x < 0) {
                node.x = 0;
                node.vx *= -1;
            } else if (node.x > this.canvas.width) {
                node.x = this.canvas.width;
                node.vx *= -1;
            }

            if (node.y < 0) {
                node.y = 0;
                node.vy *= -1;
            } else if (node.y > this.canvas.height) {
                node.y = this.canvas.height;
                node.vy *= -1;
            }

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
