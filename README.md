# Living Grid Portfolio

A high-performance, interactive portfolio website featuring an immersive "Living Grid" interface with adaptive particle systems, neural network visualizations, and behavior-aware interactions.

## Features

### Visual Systems
- **Particle Name System** - Interactive particles that form text with mouse repulsion physics
- **Neural Network Background** - Animated canvas with nodes and dynamic connections
- **Cursor Trail & Glow** - Custom cursor visualization with smooth interpolation
- **Glassmorphism Cards** - Modern project cards with holographic effects
- **Aurora Ambient Lighting** - Subtle background lighting with scanline overlays

### Interactive Elements
- **Behavior Awareness** - Contextual whisper messages based on user actions (idle, fast scroll, return visits)
- **Command Dock** - Floating navigation with smart visibility
- **Time-Aware Greetings** - Dynamic messages based on time of day
- **Card Interest Tracking** - Remembers which projects catch your eye

### Performance
- **Adaptive Quality** - Auto-detects hardware and scales animations
- **Delta Time Physics** - Frame-independent calculations for consistent 60fps
- **Mobile Optimized** - Touch-aware with disabled repulsion on mobile devices

## Tech Stack

- **HTML5** - Semantic markup with accessibility features
- **CSS3** - Glassmorphism, animations, canvas integration
- **JavaScript (Vanilla)** - Zero-dependency animation engine
- **Canvas API** - Particle systems and neural network rendering
- **Playwright** - Browser automation testing

## Getting Started

### Prerequisites
- Node.js (for running tests)
- A modern web browser

### Installation

```bash
# Clone the repository
git clone git@github.com:onitsujj/onitsujj.github.io.git
cd git-public-profile

# Install dev dependencies (optional, for testing)
npm install
```

### Running Locally

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Use a local server (recommended)
npx http-server
# or
python -m http.server 8000
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# View test report
npx playwright show-report
```

## Configuration

Performance tiers are auto-detected based on device capabilities:

| Tier | Particles | Neural Nodes | Cursor Trail |
|------|-----------|--------------|--------------|
| Low | 500 | 20 | Disabled |
| Medium | 1,000 | 35 | Enabled |
| High | 5,000 | 70 | Enabled |

## Project Structure

```
.
├── index.html          # Main page
├── scripts.js          # Animation & interaction engine
├── styles.css          # Styling & animations
├── package.json        # Project metadata
└── tests/
    ├── fixes.spec.js   # Comprehensive test suite
    └── mobile-particle.spec.js
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (touch-optimized)

## License

MIT
