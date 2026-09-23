// The Approach "keynote" scene — the pinned, scroll-scrubbed sequence that
// assembles the thesis, then builds the beliefs in one at a time and ends on
// all four held together as a recap. Built only for desktop + no-preference
// via its own matchMedia, which reverts the scene (the SplitText char-masks +
// the approach-live class) when the breakpoint or motion preference changes.
// setupScroll (reveals.js) creates it before its own triggers, so the
// pin-spacing is in place when the page positions are read.
import { SplitText } from "gsap/SplitText";
import { SIGNATURE_EASE } from "./motion-tokens.js";

// how far a belief rests while a later one has the stage — dimmed enough to
// step back, bright enough to stay legible as "already said" (0.45 keeps the
// dimmed text above 3:1 on the raised stage).
const DIMMED = 0.45;

// The live scene's timeline, so an anchor jump to #approach can land on the
// built thesis instead of the scene's first frame, where every line is still
// hidden and the stage reads as an empty room. Null when the scene is off.
let sceneTl = null;

// Scroll position of the "thesis" label (the frame where "magnifies" has
// landed), or null when the scene isn't running and #approach is a plain block.
export function approachLanding() {
  return sceneTl?.scrollTrigger ? sceneTl.scrollTrigger.labelToScroll("thesis") : null;
}

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
    const lines = gsap.utils.toArray(".approach__thesis .ln");
    const em = document.querySelector(".approach__h2 em");
    const beliefs = gsap.utils.toArray(".approach__track .belief");

    // Char-mask the bold lead clause of each belief so the key phrase "writes
    // itself in" word-by-word as the belief lands (the closing note has no <b>
    // — it just rises). Reverted in the scene cleanup so a breakpoint/motion
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
    gsap.set(lines, { autoAlpha: 0, y: 42 });
    if (em) gsap.set(em, { autoAlpha: 0, yPercent: 20 });
    gsap.set([rail, progress], { autoAlpha: 0 });
    gsap.set(ticks, { scaleY: 0, transformOrigin: "top" });
    beliefWords.forEach((words) => words && gsap.set(words, { yPercent: 110 }));
    // every belief already sits in its recap slot (CSS grid); park each one
    // hidden and a little low, ready to rise into place.
    gsap.set(beliefs, { autoAlpha: 0, y: 48 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".approach",
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * 2.5),
        pin: ".approach__stage",
        anticipatePin: 1,
        // 0.5, not the old 0.8: each belief's beat is now ~0.4 viewport, and a
        // longer catch-up on top of ScrollSmoother's own 0.8 lag trails a beat
        // behind the wheel. fastScrollEnd jumps to the end state on a hard
        // flick instead of rendering every intermediate scrub frame.
        scrub: 0.5,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        // promote the rising beliefs to their own layer only while the scene is
        // active, instead of a standing will-change that holds GPU layers for an
        // off-screen section the whole session.
        onToggle: (self) => {
          const hint = self.isActive ? "transform" : "auto";
          beliefs.forEach((b) => (b.style.willChange = hint));
        },
      },
    });

    // Shape (timeline units; scrub spreads ~12 units over 2.5 viewports):
    //   0 – 3     thesis assembles, "magnifies" holds, thesis lifts away
    //   3 – 10.2  four beliefs, each: 0.5 arrive + 1.3 dwell
    //   10.2 – 12 recap: all four lift to full, then hold before the release
    // Transitions are short against the dwell, so a stopped scroll almost
    // always lands on a settled, readable frame.

    // phase 1 — the thesis assembles
    tl.to(lines, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.4, ease: "power2.out" }, 0);
    // the payoff word lands a half-beat after its line — like a speaker pausing
    // before the word that carries the whole thesis.
    if (em) tl.to(em, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: SIGNATURE_EASE }, ">-0.3");
    // an anchor jump lands here: thesis built, payoff word in place
    tl.addLabel("thesis");
    tl.to({}, { duration: 0.7 }) // hold — let the line land
      .to(thesis, { autoAlpha: 0, y: -70, duration: 0.5, ease: "power2.in" }, ">")
      .to([rail, progress], { autoAlpha: 1, duration: 0.3 }, "<");

    // phase 2 — each belief rises into its slot while the ones before it step
    // back, like a keynote build with "dim previous".
    beliefs.forEach((belief, i) => {
      tl.to(belief, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" });
      if (i > 0) tl.to(beliefs.slice(0, i), { autoAlpha: DIMMED, duration: 0.4, ease: "power2.out" }, "<");
      // the progress rail fills one tick per belief — a "you are N of 4" spine
      if (ticks[i]) tl.to(ticks[i], { scaleY: 1, duration: 0.4, ease: "power2.out" }, "<");
      // the bold clause writes itself in as the belief settles
      if (beliefWords[i]) tl.to(beliefWords[i], { yPercent: 0, duration: 0.4, stagger: 0.03, ease: SIGNATURE_EASE }, "<0.1");
      tl.to({}, { duration: 1.3 }); // dwell
    });

    // phase 3 — the recap: all four at full strength together, held long
    // enough to read as the closing frame before the pin releases to Talks.
    tl.to(beliefs, { autoAlpha: 1, duration: 0.5, ease: "power2.out" })
      .to({}, { duration: 1.3 });

    sceneTl = tl;
    return () => {
      sceneTl = null;
      document.documentElement.classList.remove("approach-live");
      beliefSplits.forEach((s) => s.revert());
    };
  });
  return mm;
}
