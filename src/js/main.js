// Fonts load from css/main.css (so they apply with JS off), not from here.
import { initNav } from "./nav.js";
import { initLanyard } from "./lanyard/index.js";
import { initMotion } from "./animations/motion.js";

initNav();

// Respect reduced motion: skip the perpetual 3D physics sim entirely and keep
// the static badge (the UX-audit guidance for vestibular-sensitive users).
const reduceMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Live 3D lanyard lazy-loads + mounts over the static badge on capable
// browsers. Resolves true once the badge is on screen, false otherwise — the
// load choreography awaits this to time "badge first, then content".
const lanyardReady = reduceMotion ? Promise.resolve(false) : initLanyard({});

initMotion({ lanyardReady });

// Talks photo strip: Flip lightbox, stagger reveal, glide nav, draggable strip.
// Its GSAP plugins (Flip/Draggable/Inertia, ~24KB gzip) lazy-load off the
// critical path — the strip sits far below the fold and is only needed once a
// thumbnail is clicked or dragged. Reduced-motion decided once at load.
const loadGallery = () =>
  import("./animations/gallery.js").then((m) => m.initGallery({ reduced: reduceMotion }));
if ("requestIdleCallback" in window) requestIdleCallback(loadGallery);
else setTimeout(loadGallery, 1200);
