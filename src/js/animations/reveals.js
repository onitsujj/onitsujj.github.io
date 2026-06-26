// Scroll-driven choreography. Reveals + counters use an IntersectionObserver
// (fires reliably for elements already in view on load — e.g. landing on a
// shared "/#connect" link — which ScrollTrigger.batch misses). Continuous
// effects (progress, parallax) and range state (scroll-spy, nav) use
// ScrollTrigger. `reduced` keeps passive utilities but drops entrance/parallax.
export function setupScroll({ gsap, ScrollTrigger, reduced }) {
  let io = null;

  // ---- scroll-progress bar
  const bar = document.querySelector(".progress-bar");
  if (bar) {
    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
      }
    );
  }

  // ---- section reveals + stat counters (IntersectionObserver = jump-safe)
  const revealEls = gsap.utils.toArray("[data-reveal]").filter((el) => !el.closest(".hero"));
  const counters = gsap.utils.toArray("[data-count]");
  const countTo = (el) => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = end + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, { v: end, duration: 1.4, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; } });
  };

  if (reduced) {
    gsap.set(revealEls, { opacity: 1, y: 0 });
    counters.forEach(countTo);
  } else {
    gsap.set(revealEls, { opacity: 0, y: 26 });
    io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        const reveals = shown.filter((el) => el.hasAttribute("data-reveal"));
        if (reveals.length) {
          gsap.to(reveals, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "power3.out", overwrite: true });
        }
        shown.forEach((el) => {
          if (el.hasAttribute("data-count")) countTo(el);
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
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

  // ---- scroll-spy: highlight the active section in nav + right-edge index
  const setSpy = (id, active) => {
    document
      .querySelectorAll(`.nav__link[href="#${id}"], .section-index a[href="#${id}"]`)
      .forEach((a) => a.setAttribute("aria-current", active));
  };
  gsap.utils.toArray("main section[id]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => setSpy(sec.id, self.isActive ? "true" : "false"),
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

  return () => { if (io) io.disconnect(); };
}
