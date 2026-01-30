/* ========================================
   STATE MANAGEMENT & LOCALSTORAGE HELPERS
   ======================================== */

// ========================================
// SAFE LOCALSTORAGE HELPERS
// ========================================
export function safeGetNumber(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        const value = parseInt(raw, 10);
        return isNaN(value) ? defaultValue : value;
    } catch {
        return defaultValue;
    }
}

export function safeGetJSON(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        const parsed = JSON.parse(raw);
        return parsed !== null ? parsed : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch {
        // localStorage unavailable (private browsing, quota exceeded)
    }
}

// ========================================
// STATE MANAGEMENT
// ========================================
export const state = {
    mouseX: 0,
    mouseY: 0,
    cursorX: 0,
    cursorY: 0,
    isIdle: false,
    idleTimer: null,
    scrollSpeed: 0,
    lastScrollY: 0,
    lastScrollTime: Date.now(),
    visitCount: safeGetNumber('portfolio_visits', 0),
    cardInterests: safeGetJSON('portfolio_interests', {}),
    hasInteracted: false
};

// Increment visit count on module load
state.visitCount++;
safeSetItem('portfolio_visits', state.visitCount);

// Expose for testing
window.safeGetNumber = safeGetNumber;
window.safeGetJSON = safeGetJSON;
