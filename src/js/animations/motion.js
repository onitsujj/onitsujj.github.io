// Motion entry — registers GSAP plugins and splits all behaviour by motion
// preference via gsap.matchMedia (which auto-reverts when the query changes).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { buildLoadReveal } from "./loader.js";
import { setupScroll } from "./reveals.js";
import { setupMicro } from "./micro.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initMotion({ lanyardReady } = {}) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      reduce: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      if (ctx.conditions.motion) {
        // GSAP now owns the reveals — cancel the no-JS failsafe so sections
        // stay hidden until they scroll into view.
        clearTimeout(window.__revealFallback);
        buildLoadReveal({ gsap, SplitText, lanyardReady });
        const cleanup = setupScroll({ gsap, ScrollTrigger, reduced: false });
        setupMicro({ gsap });
        return cleanup; // disconnect the IntersectionObserver on context revert
      }
      // reduced motion: content is already visible (the CSS hide is gated to
      // no-preference); wire only passive utilities, no entrance/parallax.
      return setupScroll({ gsap, ScrollTrigger, reduced: true });
    }
  );
}
