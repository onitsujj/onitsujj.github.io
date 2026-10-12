// Fonts load from css/main.css (so they apply with JS off), not from here.
import { initNav } from "./nav.js";
import { canUse3D, initLanyard } from "./lanyard/index.js";
import { initMotion } from "./animations/motion.js";

initNav();

// Respect reduced motion: skip the perpetual 3D physics sim entirely and keep
// the static badge (the UX-audit guidance for vestibular-sensitive users).
const reduceMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Live 3D lanyard lazy-loads + mounts over the static badge on capable
// browsers. Resolves true once the badge is on screen, false otherwise — the
// load choreography awaits this to fade the right badge in. Mounting it costs
// enough GPU work to hold back the hero copy's first paint (~1.2s of LCP), so
// it starts once the hero cascade has played, or after 3s if motion never runs.
let resolveHeroShown;
const heroShown = new Promise((resolve) => {
  resolveHeroShown = resolve;
  setTimeout(resolve, 3000);
});
const lanyardReady =
  !reduceMotion && canUse3D() ? heroShown.then(() => initLanyard({})) : Promise.resolve(false);

initMotion({ lanyardReady, onHeroShown: resolveHeroShown });

// Talks photo strip: Flip lightbox, stagger reveal, glide nav, draggable strip.
// Its GSAP plugins (Flip/Draggable/Inertia, ~24KB gzip) lazy-load off the
// critical path — the strip sits far below the fold and is only needed once a
// thumbnail is clicked or dragged. Reduced-motion decided once at load.
const loadGallery = () =>
  import("./animations/gallery.js").then((m) => m.initGallery({ reduced: reduceMotion }));
if ("requestIdleCallback" in window) requestIdleCallback(loadGallery);
else setTimeout(loadGallery, 1200);
