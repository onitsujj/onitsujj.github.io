// ---- self-hosted fonts (vendored via @fontsource, no Google request) ----
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/libre-franklin/400.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";

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
