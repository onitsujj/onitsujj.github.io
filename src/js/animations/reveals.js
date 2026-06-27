import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

// A faint S-curve for the scroll-progress bar: softens the very start/end so it
// reads as a designed pacing aid rather than a flat loading bar, while staying
// near-linear (honest about scroll position) through the middle.
gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("progress", "M0,0 C0.2,0.08 0.8,0.92 1,1");
// The site's "signature" ease — a confident arrival with a whisper of overshoot
// (~6%). Shared by the loader cascade, the section reveals, the held-breath
// thesis word, and the CTA press release, so every entrance feels like the
// site's own rather than a borrowed default curve. (CSS mirrors it in
// --ease-signature for translate-based hovers.)
CustomEase.create("jg", "M0,0 C0.16,0.84 0.3,1.06 1,1");

// Scroll-driven choreography. Reveals + counters use an IntersectionObserver
// (fires reliably for elements already in view on load — e.g. landing on a
// shared "/#connect" link — which ScrollTrigger.batch misses). Continuous
// effects (progress, parallax) and range state (scroll-spy, nav) use
// ScrollTrigger. `reduced` keeps passive utilities but drops entrance/parallax.
// The Approach section reads as a normal block on no-JS, reduced-motion, and
// narrow screens. On desktop with motion it becomes a pinned "keynote" scene:
// scrolling assembles the thesis, then the beliefs slide in from the right —
// paced by the scroll wheel so it can be narrated live. Its own matchMedia
// builds (and reverts) it only for desktop + no-preference, so crossing the
// breakpoint or toggling reduced-motion cleans up automatically.
function buildApproachScene({ gsap }) {
  const mm = gsap.matchMedia();
  mm.add("(min-width: 821px) and (prefers-reduced-motion: no-preference)", () => {
    const stage = document.querySelector(".approach__stage");
    const track = document.querySelector(".approach__track");
    if (!stage || !track) return;

    const thesis = document.querySelector(".approach__thesis");
    const rail = document.querySelector(".approach__rail");
    const progress = document.querySelector(".approach__progress");
    const ticks = gsap.utils.toArray(".approach__tick i");
    const eyebrow = document.querySelector(".approach__eyebrow");
    const lines = gsap.utils.toArray(".approach__thesis .ln");
    const em = document.querySelector(".approach__h2 em");
    const beliefs = gsap.utils.toArray(".approach__track .belief");

    // Char-mask the bold lead clause of each belief so the key phrase "writes
    // itself in" word-by-word as the card lands (the closing note has no <b> —
    // it just slides). Reverted in the scene cleanup so a breakpoint/motion
    // toggle restores the plain markup.
    const beliefSplits = [];
    const beliefWords = beliefs.map((b) => {
      const bold = b.querySelector(".belief__text b");
      if (!bold) return null;
      const s = new SplitText(bold, { type: "words", mask: "words" });
      beliefSplits.push(s);
      return s.words;
    });

    // switch on the pinned layout (CSS keys off this class), then hide the
    // pieces the timeline will bring in.
    document.documentElement.classList.add("approach-live");
    gsap.set([eyebrow, ...lines], { autoAlpha: 0, y: 42 });
    if (em) gsap.set(em, { autoAlpha: 0, yPercent: 20 });
    gsap.set([rail, progress], { autoAlpha: 0 });
    gsap.set(ticks, { scaleY: 0, transformOrigin: "top" });
    beliefWords.forEach((words) => words && gsap.set(words, { yPercent: 110 }));
    // beliefs are stacked + centred by CSS; park each one hidden, off to the
    // right, ready to slide through the centre one at a time.
    gsap.set(beliefs, {
      autoAlpha: 0,
      xPercent: -50,
      yPercent: -50,
      x: () => stage.clientWidth * 0.5,
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".approach",
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * 4.5),
        pin: ".approach__stage",
        anticipatePin: 1,
        // 0.8 keeps the catch-up close to ScrollSmoother's own 0.8 lag so the two
        // don't compound into a long render tail; fastScrollEnd jumps to the end
        // state on a hard flick (above narration speed) instead of rendering every
        // intermediate scrub frame.
        scrub: 0.8,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        // promote the sliding beliefs to their own layer only while the scene is
        // active, instead of a standing will-change that holds GPU layers for an
        // off-screen section the whole session.
        onToggle: (self) => {
          const hint = self.isActive ? "transform" : "auto";
          beliefs.forEach((b) => (b.style.willChange = hint));
        },
      },
    });

    // phase 1 — the thesis assembles
    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0)
      .to(lines, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.5, ease: "power2.out" }, 0.2);
    // the payoff word lands a half-beat after its line — like a speaker pausing
    // before the word that carries the whole thesis.
    if (em) tl.to(em, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: "jg" }, ">-0.3");
    tl.to({}, { duration: 0.9 }) // hold — room to land the line live
      // phase 2 — the thesis lifts away, then each belief slides in from the
      // right, dwells centre-stage on its own, and slides off left before the
      // next arrives. One belief per "page" of scroll so each point can be
      // narrated on its own beat.
      .to(thesis, { autoAlpha: 0, y: -70, duration: 0.8, ease: "power2.in" }, ">")
      .to([rail, progress], { autoAlpha: 1, duration: 0.3 }, "<");

    beliefs.forEach((belief, i) => {
      tl.to(belief, { autoAlpha: 1, x: 0, duration: 1, ease: "power3.out" });
      // the progress rail fills one tick per belief — a "you are N of 4" spine
      // so the deliberate one-per-page pacing reads as structure, not length.
      if (ticks[i]) tl.to(ticks[i], { scaleY: 1, duration: 0.4, ease: "power2.out" }, "<");
      // the bold clause writes itself in as the card settles
      if (beliefWords[i]) tl.to(beliefWords[i], { yPercent: 0, duration: 0.5, stagger: 0.04, ease: "jg" }, "<0.15");
      tl.to({}, { duration: 1.1 }); // dwell centre-stage
      if (i < beliefs.length - 1) {
        tl.to(belief, { autoAlpha: 0, x: () => -stage.clientWidth * 0.5, duration: 0.9, ease: "power2.in" });
      }
    });

    // dwell on the closing "not all magic" note before the pin releases, so the
    // section doesn't snap to Talks the instant it appears
    tl.to({}, { duration: 1.2 });

    return () => {
      document.documentElement.classList.remove("approach-live");
      beliefSplits.forEach((s) => s.revert());
    };
  });
  return mm;
}

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
        ease: "progress",
        scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
      }
    );
  }

  // ---- section reveals + stat counters (IntersectionObserver = jump-safe)
  const revealEls = gsap.utils.toArray("[data-reveal]").filter((el) => !el.closest(".hero"));
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
          gsap.to(reveals, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "jg", overwrite: true });
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
    gsap.utils.toArray(["#lanyard-mount", ".hero__static-badge"]).forEach((sel) => {
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
