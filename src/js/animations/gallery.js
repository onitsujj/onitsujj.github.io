// Talks photo gallery — composes the three pieces of the filmstrip:
//   • lightbox.js      — the full-image viewer (Flip morph, a11y, keyboard).
//   • gallery-strip.js — the draggable/throwable strip (overflow only).
//   • the stagger reveal of the tiles, wired here (it's the only bit unique to
//     the strip-in-page, not to either collaborator).
// Reduced-motion users get plain fades + native scroll: no morph, no inertia,
// no stagger (the lightbox itself still works for everyone).
import gsap from "gsap";
import { createLightbox } from "./lightbox.js";
import { createDraggableStrip } from "./gallery-strip.js";

export function initGallery({ reduced = false } = {}) {
  const gallery = document.querySelector(".row-card__gallery");
  if (!gallery) return;
  const track = gallery.querySelector(".gallery__track") || gallery;
  const thumbs = gsap.utils.toArray(".gallery__thumb", gallery);
  if (!thumbs.length) return;

  const slides = thumbs.map((btn) => {
    const img = btn.querySelector("img");
    return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
  });

  const lightbox = createLightbox({ slides, thumbs, reduced });
  const strip = createDraggableStrip({ gallery, track, reduced });

  // ---------- wire interactions ----------
  thumbs.forEach((btn, i) =>
    btn.addEventListener("click", (e) => {
      if (strip.consumeDrag()) { e.preventDefault(); return; } // it was a flick, not a tap
      lightbox.open(i);
    })
  );

  // ---------- staggered scroll-reveal of the tiles ----------
  if (!reduced) {
    gsap.set(thumbs, { opacity: 0, y: 24 });
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        gsap.to(thumbs, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" });
        obs.disconnect();
      },
      { threshold: 0.2 }
    );
    io.observe(gallery);
  }
}
