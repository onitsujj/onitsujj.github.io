// Motion entry — registers GSAP plugins and splits all behaviour by motion
// preference via gsap.matchMedia (which auto-reverts when the query changes).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { buildLoadReveal } from "./loader.js";
import { setupScroll } from "./reveals.js";
import { setupMicro } from "./micro.js";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

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
        window.__cancelRevealFallback && window.__cancelRevealFallback();
        // Page-wide momentum scroll (gsap.com-style glide). Created before the
        // scene/scroll triggers so ScrollTrigger wires into it automatically.
        // The fixed nav/progress/section-index sit OUTSIDE #smooth-content, and
        // the 3D lanyard keeps its own pointer drag (ScrollSmoother only owns
        // wheel/scroll input, not pointer events).
        const smoother = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 0.8,
          effects: false,
          smoothTouch: false,
        });
        // CSS scroll-behavior:smooth fights ScrollSmoother on anchor clicks —
        // let the smoother own the easing while it's active.
        document.documentElement.style.scrollBehavior = "auto";

        // Route in-page anchor clicks (nav, section index, CTAs, back-to-top)
        // through the smoother. A native #hash jump desyncs ScrollSmoother's
        // internal position and breaks scrolling afterwards; scrollTo glides
        // correctly and keeps the two in sync.
        const onAnchorClick = (e) => {
          const link = e.target.closest('a[href^="#"]');
          if (!link) return;
          const id = link.getAttribute("href");
          if (id.length < 2) return;
          const el = document.querySelector(id);
          if (!el) return;
          e.preventDefault();
          smoother.scrollTo(el, true);
          history.pushState(null, "", id);
        };
        document.addEventListener("click", onAnchorClick);

        buildLoadReveal({ gsap, SplitText, lanyardReady });
        const cleanup = setupScroll({ gsap, ScrollTrigger, reduced: false });
        setupMicro({ gsap });

        // a barely-there drift on the film grain so the obsidian field reads as
        // lit, not flat. Created inside this matchMedia context, so it auto-
        // reverts to the static 0.05 if the user switches to reduced motion.
        gsap.to(document.documentElement, {
          "--grain-o": 0.075,
          duration: 4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // One ordered settle after fonts load: refresh so the scene's pin-spacing
        // is measured, THEN (next frame, once positions are final) restore any
        // deep link. ScrollSmoother resets scroll to 0 on creation, so landing on
        // /#talks needs re-applying — and doing it here, after the single refresh,
        // avoids racing a second refresh in reveals.js.
        const hash = window.location.hash;
        Promise.resolve(document.fonts && document.fonts.ready).then(() => {
          ScrollTrigger.refresh();
          if (hash.length > 1) {
            const el = document.querySelector(hash);
            if (el) smoother.scrollTo(el, false);
          }
        });

        return () => {
          if (cleanup) cleanup(); // disconnect the IntersectionObserver
          document.removeEventListener("click", onAnchorClick);
          smoother.kill();
          document.documentElement.style.scrollBehavior = "";
        };
      }
      // reduced motion: content is already visible (the CSS hide is gated to
      // no-preference); wire only passive utilities, no entrance/parallax.
      return setupScroll({ gsap, ScrollTrigger, reduced: true });
    }
  );
}
