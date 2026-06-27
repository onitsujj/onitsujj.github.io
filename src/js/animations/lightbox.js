// Lightbox overlay for the talks photo strip. Builds the dialog once and owns
// its whole lifecycle: open/close/navigate state, the Flip "expand" morph,
// keyboard control, and the focus trap. Reduced-motion users get plain fades
// (no morph). Exposes a single open(i) — the strip and click wiring live next door.
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

export function createLightbox({ slides, thumbs, reduced = false }) {
  // ---------- build the lightbox overlay once ----------
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Photo viewer");
  lb.hidden = true;
  lb.innerHTML = `
    <div class="lightbox__backdrop"></div>
    <button type="button" class="lightbox__close" aria-label="Close viewer">&#10005;</button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo">&#8249;</button>
    <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next photo">&#8250;</button>
    <figure class="lightbox__stage">
      <img class="lightbox__img" alt="" />
      <figcaption class="lightbox__caption" aria-live="polite"></figcaption>
    </figure>
    <div class="lightbox__counter" aria-hidden="true"></div>`;
  document.body.appendChild(lb);

  const backdrop = lb.querySelector(".lightbox__backdrop");
  const imgEl = lb.querySelector(".lightbox__img");
  const capEl = lb.querySelector(".lightbox__caption");
  const counterEl = lb.querySelector(".lightbox__counter");
  const btnClose = lb.querySelector(".lightbox__close");
  const btnPrev = lb.querySelector(".lightbox__nav--prev");
  const btnNext = lb.querySelector(".lightbox__nav--next");
  const focusables = [btnClose, btnPrev, btnNext];
  const chrome = [btnClose, btnPrev, btnNext, capEl, counterEl];

  let index = 0;
  let isOpen = false;
  let lastFocus = null;

  const paint = () => {
    const s = slides[index];
    imgEl.src = s.src;
    imgEl.alt = s.alt;
    capEl.textContent = s.alt;
    counterEl.textContent = `${index + 1} / ${slides.length}`;
  };

  // wait for the lightbox image so Flip measures its real box (usually instant —
  // it's the same file as the thumbnail, already in cache)
  const whenReady = () =>
    imgEl.complete ? Promise.resolve() : new Promise((r) => (imgEl.onload = r));

  const open = async (i) => {
    index = i;
    lastFocus = document.activeElement;
    paint();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    isOpen = true;
    document.addEventListener("keydown", onKey, true);

    gsap.killTweensOf([imgEl, backdrop, ...chrome]);
    gsap.set(imgEl, { clearProps: "transform" });
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
    gsap.fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.2, ease: "power2.out" });

    await whenReady();
    if (!isOpen) return; // closed before the image resolved

    if (reduced) {
      gsap.fromTo(imgEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    } else {
      // FLIP: sit the big image on the thumbnail, record it, snap back to its
      // natural spot, then animate from the recorded (thumbnail) state.
      const thumbImg = thumbs[index].querySelector("img");
      Flip.fit(imgEl, thumbImg, { scale: true });
      const state = Flip.getState(imgEl);
      gsap.set(imgEl, { clearProps: "transform" });
      Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
        scale: true,
        onComplete: () => gsap.set(imgEl, { clearProps: "transform" }),
      });
    }
    btnClose.focus();
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener("keydown", onKey, true);
    if (lastFocus) lastFocus.focus();

    gsap.killTweensOf([imgEl, backdrop, ...chrome]);
    const done = () => {
      lb.hidden = true;
      document.body.style.overflow = "";
      gsap.set(imgEl, { clearProps: "all" });
    };
    gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(chrome, { opacity: 0, duration: 0.2 });
    if (reduced) {
      gsap.to(imgEl, { opacity: 0, duration: 0.25, onComplete: done });
    } else {
      const thumbImg = thumbs[index].querySelector("img");
      Flip.fit(imgEl, thumbImg, { scale: true, duration: 0.5, ease: "power3.inOut", onComplete: done });
    }
  };

  const go = (dir) => {
    index = (index + dir + slides.length) % slides.length;
    if (reduced) { paint(); return; }
    const shift = dir > 0 ? -36 : 36;
    gsap.killTweensOf(imgEl);
    gsap.to(imgEl, {
      opacity: 0,
      x: shift,
      duration: 0.16,
      ease: "power1.in",
      onComplete: () => {
        paint();
        gsap.fromTo(imgEl, { opacity: 0, x: -shift }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
      },
    });
  };

  const onKey = (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const i = focusables.indexOf(document.activeElement);
      const n = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : (i + 1) % focusables.length;
      focusables[n].focus();
    }
  };

  btnPrev.addEventListener("click", () => go(-1));
  btnNext.addEventListener("click", () => go(1));
  btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  return { open };
}
