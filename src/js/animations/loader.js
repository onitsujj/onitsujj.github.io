// First-load choreography — "lanyard first, then content", decoupled from the
// network. The badge (live 3D, or the static fallback) settles in, then the
// hero copy cascades. Content NEVER waits on the 3D libs: a timeout guarantees
// it appears even if WebGL is slow/absent.
export function buildLoadReveal({ gsap, SplitText, lanyardReady }) {
  // hidden start states (CSS already hid these pre-paint to avoid a flash)
  gsap.set([".hero__eyebrow", ".hero__lead", ".hero__actions"], { opacity: 0, y: 24 });
  gsap.set(".hero__static-badge", { opacity: 0, y: -24 });
  gsap.set("#lanyard-mount", { opacity: 0 });

  const buildAndStart = () => {
    // split the headline into masked lines (the <br>s define the 3 lines)
    const h1 = document.querySelector("[data-reveal-lines]");
    let lines = [];
    if (h1 && SplitText) {
      const split = new SplitText(h1, { type: "lines", mask: "lines", linesClass: "split-line" });
      lines = split.lines;
      gsap.set(h1, { opacity: 1 });
      gsap.set(lines, { yPercent: 115 });
    } else if (h1) {
      gsap.set(h1, { opacity: 0, y: 24 });
    }

    const content = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    content
      .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.6 }, 0);
    if (lines.length) {
      content.to(lines, { yPercent: 0, duration: 0.9, stagger: 0.12, ease: "power4.out" }, 0.05);
    } else if (h1) {
      content.to(h1, { opacity: 1, y: 0, duration: 0.8 }, 0.05);
    }
    content
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
}
