import gsap from "gsap";
import { SIGNATURE_EASE, PROGRESS_EASE } from "./motion-tokens.js";
import { buildApproachScene } from "./approach-scene.js";
import { LANYARD_MOUNT, HERO, HERO_STATIC_BADGE } from "../dom.js";

// Scroll-driven choreography. Reveals + counters use an IntersectionObserver
// (fires reliably for elements already in view on load — e.g. landing on a
// shared "/#connect" link — which ScrollTrigger.batch misses). Continuous
// effects (progress, parallax) and range state (scroll-spy, nav) use
// ScrollTrigger. `reduced` keeps passive utilities but drops entrance/parallax.
// The Approach section reads as a normal block on no-JS, reduced-motion, and
// narrow screens. On desktop with motion it becomes a pinned "keynote" scene
// (see approach-scene.js): scrolling assembles the thesis, then the beliefs
// slide in from the right — paced by the scroll wheel so it can be narrated
// live. Its own matchMedia builds (and reverts) it only for desktop +
// no-preference, so crossing the breakpoint or toggling reduced-motion cleans
// up automatically.

export function setupScroll({ gsap, ScrollTrigger, reduced }) {
  let io = null;

  // Pinned Approach scene first: it adds pin-spacing, so it must be created
  // before the triggers below (progress bar, scroll-spy) read page positions.
  // (The fonts.ready refresh is owned by motion.js now, so the scene's pin
  // spacing settles in one ordered pass before any deep-link scroll.)
  const sceneMM = reduced ? null : buildApproachScene({ gsap });

  // ---- scroll-progress bar
  const bar = document.querySelector(".progress-bar");
  if (bar) {
    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: PROGRESS_EASE,
        scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
      }
    );
  }

  // ---- section reveals + stat counters (IntersectionObserver = jump-safe)
  const revealEls = gsap.utils.toArray("[data-reveal]").filter((el) => !el.closest(HERO));
  const closeEls = gsap.utils.toArray("[data-reveal-close]"); // the Connect close
  const counters = gsap.utils.toArray("[data-count]");
  const countTo = (el, delay = 0) => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    // a hairline under each number fills in lockstep with the count — the digits
    // accrue and you can see them accrue, both braking to a stop together.
    const bar = el.closest(".stat")?.querySelector(".stat__bar");
    if (reduced) {
      el.textContent = end + suffix;
      if (bar) gsap.set(bar, { scaleX: 1 });
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.4,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = Math.round(obj.v) + suffix;
        if (bar) gsap.set(bar, { scaleX: obj.v / end });
      },
    });
  };

  if (reduced) {
    gsap.set([...revealEls, ...closeEls], { opacity: 1, y: 0 });
    counters.forEach((el) => countTo(el));
  } else {
    gsap.set(revealEls, { opacity: 0, y: 26 });
    gsap.set(closeEls, { opacity: 0, y: 34 });
    // hold each number at 0 so it doesn't flash its final value during the fade
    counters.forEach((el) => { el.textContent = "0" + (el.dataset.suffix || ""); });
    io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        const reveals = shown.filter((el) => el.hasAttribute("data-reveal"));
        const closes = shown.filter((el) => el.hasAttribute("data-reveal-close"));
        if (reveals.length) {
          gsap.to(reveals, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: SIGNATURE_EASE, overwrite: true });
        }
        if (closes.length) {
          // the closing CTA arrives slower + gentler — a deliberate exhale to end on
          gsap.to(closes, { opacity: 1, y: 0, duration: 1.1, stagger: 0.16, ease: "power2.out", overwrite: true });
        }
        shown.forEach((el) => {
          // counters start AFTER their block has faded in, so "10+ years" lands as
          // earned proof rather than racing the reveal
          if (el.hasAttribute("data-count")) countTo(el, 0.7);
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
    closeEls.forEach((el) => io.observe(el));
    counters.forEach((el) => io.observe(el));
  }

  // ---- badge parallax as the hero scrolls away
  if (!reduced) {
    gsap.utils.toArray([LANYARD_MOUNT, HERO_STATIC_BADGE]).forEach((sel) => {
      const node = typeof sel === "string" ? document.querySelector(sel) : sel;
      if (!node) return;
      gsap.to(node, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 },
      });
    });
  }

  // ---- scroll-spy: highlight the active section in nav + right-edge index.
  // The active right-edge number also "settles": its tracking tightens + it
  // brightens, and (once the small plugin lazy-loads) the digits scramble into
  // place — a precision-instrument read for the wayfinding numerals.
  const indexNums = {};
  gsap.utils
    .toArray(".section-index a")
    .forEach((a) => (indexNums[a.getAttribute("href").slice(1)] = a.textContent.trim()));
  let scrambleReady = false;
  if (!reduced) {
    import("gsap/ScrambleTextPlugin")
      .then((m) => {
        gsap.registerPlugin(m.ScrambleTextPlugin);
        scrambleReady = true;
      })
      .catch(() => {});
  }
  const settleIndex = (id) => {
    const a = document.querySelector(`.section-index a[href="#${id}"]`);
    if (!a) return;
    gsap.fromTo(
      a,
      { letterSpacing: "0.26em", opacity: 0.5 },
      { letterSpacing: "0.04em", opacity: 1, duration: 0.45, ease: "power2.out", overwrite: "auto" }
    );
    if (scrambleReady) {
      gsap.to(a, {
        duration: 0.5,
        ease: "none",
        scrambleText: { text: indexNums[id], chars: "0123456789", speed: 0.6 },
      });
    }
  };

  const setSpy = (id, active) => {
    document
      .querySelectorAll(`.nav__link[href="#${id}"], .section-index a[href="#${id}"]`)
      .forEach((a) =>
        active ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")
      );
    if (active && !reduced) settleIndex(id);
  };
  gsap.utils.toArray("main section[id]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => setSpy(sec.id, self.isActive),
    });
  });

  // ---- nav background solidifies once past the hero
  if (document.querySelector(".nav")) {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "bottom top+=80",
      end: "max",
      toggleClass: { targets: ".nav", className: "nav--solid" },
    });
  }

  return () => {
    if (io) io.disconnect();
    if (sceneMM) sceneMM.revert();
  };
}
