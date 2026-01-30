/* ========================================
   BEHAVIOR AWARENESS SYSTEM
   ======================================== */

import { CONFIG } from './config.js';
import { state } from './state.js';

export class BehaviorSystem {
    constructor() {
        this.whisperEl = document.querySelector('.behavior-whisper');
        this.messageTimeout = null;
        this.shownMessages = new Set();
    }

    showWhisper(message, duration = 3000) {
        if (!this.whisperEl) return; // Null check
        if (this.shownMessages.has(message)) return;
        this.shownMessages.add(message);
        // Prevent unbounded growth - clear when limit reached
        if (this.shownMessages.size > 50) {
            this.shownMessages.clear();
        }

        this.whisperEl.textContent = message;
        this.whisperEl.classList.add('visible');

        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            if (this.whisperEl) {
                this.whisperEl.classList.remove('visible');
            }
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
        if (count === CONFIG.cardInterestNotice) this.showWhisper('this one catches your eye...');
        else if (count === CONFIG.cardInterestHigh) this.showWhisper('definitely interested in this one...');
    }

    onReturn() {
        if (state.visitCount === 2) setTimeout(() => this.showWhisper('you came back...'), 3000);
        else if (state.visitCount > 5) setTimeout(() => this.showWhisper('a familiar presence...'), 3000);
    }

    onScrollToBottom() { this.showWhisper('you\'ve seen everything... or have you?'); }
}
