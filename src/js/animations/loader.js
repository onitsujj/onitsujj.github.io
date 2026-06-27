// First-load choreography — "lanyard first, then content", decoupled from the
// network. The badge (live 3D, or the static fallback) settles in, then the
// hero copy cascades. Content NEVER waits on the 3D libs: a timeout guarantees
// it appears even if WebGL is slow/absent.
export function buildLoadReveal({ gsap, SplitText, lanyardReady }) {
  // the headline line-split, kept so a mid-session reduced-motion switch can
  // revert it (restoring the plain <h1>) instead of leaking the split DOM.
  let splitInstance = null;
  // hidden start states (CSS already hid these pre-paint to avoid a flash)
  gsap.set([".hero__eyebrow", ".hero__sub", ".hero__lead", ".hero__actions"], { opacity: 0, y: 24 });
  gsap.set(".hero__static-badge", { opacity: 0, y: -24 });
  gsap.set("#lanyard-mount", { opacity: 0 });
  gsap.set(".hero__title .accent", { filter: "blur(3px)" });

  const buildAndStart = () => {
    // split the headline into masked lines (the <br>s define the 3 lines)
    const h1 = document.querySelector("[data-reveal-lines]");
    let lines = [];
    if (h1 && SplitText) {
      splitInstance = new SplitText(h1, { type: "lines", mask: "lines", linesClass: "split-line" });
      lines = splitInstance.lines;
      gsap.set(h1, { opacity: 1 });
      // start each line risen + slightly loose, so it resolves INTO its final
      // tracking as it rises — type "settling into confidence", not just sliding.
      gsap.set(lines, { yPercent: 115, letterSpacing: "0.04em" });
    } else if (h1) {
      gsap.set(h1, { opacity: 0, y: 24 });
    }

    const content = gsap.timeline({ paused: true, defaults: { ease: "jg" } });
    content
      .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.6 }, 0);
    if (lines.length) {
      content.to(lines, {
        yPercent: 0,
        letterSpacing: "-0.035em",
        duration: 0.9,
        stagger: 0.12,
        ease: "jg",
        // promote the lines only for this one-shot entrance, then release the
        // layer (replaces a standing will-change in CSS that held it all session).
        onStart: () => gsap.set(lines, { willChange: "transform" }),
        onComplete: () => gsap.set(lines, { willChange: "auto" }),
      }, 0.05);
    } else if (h1) {
      content.to(h1, { opacity: 1, y: 0, duration: 0.8 }, 0.05);
    }
    // the cyan signal phrase resolves from a soft blur into focus as the
    // headline sets — a quiet focus-pull on the words that carry the line.
    content.to(".hero__title .accent", { filter: "blur(0px)", duration: 0.9, ease: "power2.out" }, 0.25);
    content
      .to(".hero__sub", { opacity: 1, y: 0, duration: 0.6 }, 0.32)
      .to(".hero__lead", { opacity: 1, y: 0, duration: 0.7 }, 0.45)
      .to(".hero__actions", { opacity: 1, y: 0, duration: 0.7 }, 0.6);

    let started = false;
    const go = () => { if (!started) { started = true; content.play(); } };
    const fallback = setTimeout(go, 1700);

    Promise.resolve(lanyardReady).then((used) => {
      clearTimeout(fallback);
      if (used) {
        // the live 3D badge is the star — fade the canvas in, keep static hidden
        gsap.to("#lanyard-mount", { opacity: 1, duration: 0.8, ease: "power2.out" });
      } else {
        // no 3D — drop the static badge in first
        gsap.to(".hero__static-badge", { opacity: 1, y: 0, duration: 1, ease: "power2.out" });
      }
      gsap.delayedCall(used ? 0.2 : 0.45, go);
    });
  };

  // wait briefly for fonts so the line split measures correctly, then go
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(buildAndStart);
  } else {
    buildAndStart();
  }

  return () => {
    if (splitInstance) splitInstance.revert();
  };
}
