// The Approach "keynote" scene — the pinned, scroll-scrubbed sequence that
// assembles the thesis, then slides the beliefs in one per page so each can be
// narrated live. Built only for desktop + no-preference via its own matchMedia,
// which reverts the scene (the SplitText char-masks + the approach-live class)
// when the breakpoint or motion preference changes. setupScroll (reveals.js)
// creates it before its own triggers, so the pin-spacing is in place when the
// page positions are read.
import { SplitText } from "gsap/SplitText";
import { SIGNATURE_EASE } from "./motion-tokens.js";

export function buildApproachScene({ gsap }) {
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
    if (em) tl.to(em, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: SIGNATURE_EASE }, ">-0.3");
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
      if (beliefWords[i]) tl.to(beliefWords[i], { yPercent: 0, duration: 0.5, stagger: 0.04, ease: SIGNATURE_EASE }, "<0.15");
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
