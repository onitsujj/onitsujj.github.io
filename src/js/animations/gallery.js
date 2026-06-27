// Talks photo gallery — composes the three pieces of the filmstrip:
//   • lightbox.js      — the full-image viewer (Flip morph, a11y, keyboard).
//   • gallery-strip.js — the draggable/throwable strip (overflow only).
//   • the stagger reveal of the tiles, wired here (it's the only bit unique to
//     the strip-in-page, not to either collaborator).
// Reduced-motion users get plain fades + native scroll: no morph, no inertia,
// no stagger (the lightbox itself still works for everyone).
import gsap from "gsap";
import { Flip } from "gsap/Flip";
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

  // ---------- "sticker wall" reveal: tiles settle from a faint tossed state ----
  if (!reduced) {
    gsap.set(thumbs, { opacity: 0 }); // hidden until the strip scrolls into view
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        // scatter + record -> snap back to the clean grid -> Flip from the
        // scattered state, so the photos read as "placed" then locking in.
        gsap.set(thumbs, {
          opacity: 0,
          rotation: () => gsap.utils.random(-4, 4),
          x: () => gsap.utils.random(-26, 26),
          y: () => gsap.utils.random(-10, 22),
        });
        const state = Flip.getState(thumbs, { props: "opacity" });
        gsap.set(thumbs, { clearProps: "all" });
        Flip.from(state, { duration: 0.8, stagger: 0.06, ease: "power3.out" });
      },
      { threshold: 0.2 }
    );
    io.observe(gallery);
  }
}
