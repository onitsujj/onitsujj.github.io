// Draggable / throwable photo strip: grab-and-flick with inertia, but only when
// the strip actually overflows its viewport (a separate .gallery__track). On
// desktop where the tiles fit, it's inert and native scroll is the fallback.
// Exposes consumeDrag() so the click handler can tell a flick from a tap and
// skip opening the lightbox after a flick.
// Also drives the strip's cue (optional): a hairline meter of how much of the
// strip has been seen, the verb (Drag / Scroll), and the right-edge fade, which
// is dropped once the end is reached.
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import gsap from "gsap";

gsap.registerPlugin(Draggable, InertiaPlugin);

export function createDraggableStrip({ gallery, track, cue = null, reduced = false }) {
  let dragged = false;
  let drag = null;
  const fill = cue?.querySelector(".gallery__meter-fill");

  // offset = how far the strip has moved from its start, in px
  const offset = () => (drag ? -drag.x : gallery.scrollLeft);
  const updateCue = () => {
    const view = gallery.clientWidth;
    const total = Math.max(track.scrollWidth, view);
    const seen = Math.min(1, (view + offset()) / total);
    if (fill) fill.style.setProperty("--seen", seen.toFixed(3));
    if (seen > 0.995) gallery.dataset.edge = "end";
    else delete gallery.dataset.edge;
  };

  if (!reduced && track !== gallery) {
    gallery.classList.add("is-draggable");
    const verb = cue?.querySelector(".gallery__verb");
    if (verb) verb.textContent = "Drag →";
    [drag] = Draggable.create(track, {
      type: "x",
      bounds: gallery,
      inertia: true,
      edgeResistance: 0.8,
      cursor: "grab",
      activeCursor: "grabbing",
      dragClickables: true,
      onPress() { dragged = false; },
      onDrag() {
        if (Math.abs(this.x - this.startX) > 6) dragged = true;
        updateCue();
      },
      onThrowUpdate: updateCue,
    });

    const minX = () => Math.min(0, gallery.clientWidth - track.scrollWidth);
    // Keyboard: bring a focused thumb fully into view by moving the strip
    // (the browser only scrolls a clipped viewport when the thumb is wholly
    // hidden, and even then it would desync Draggable's x).
    gallery.addEventListener("focusin", (e) => {
      const thumb = e.target.closest(".gallery__thumb");
      if (!thumb) return;
      const g = gallery.getBoundingClientRect();
      const t = thumb.getBoundingClientRect();
      const pad = 8; // room for the focus ring
      let dx = 0;
      if (t.right > g.right - pad) dx = g.right - pad - t.right;
      else if (t.left < g.left + pad) dx = g.left + pad - t.left;
      if (!dx) return;
      gsap.to(track, {
        x: gsap.utils.clamp(minX(), 0, drag.x + dx),
        duration: 0.45,
        ease: "power3.out",
        overwrite: true,
        onUpdate() { drag.update(); updateCue(); },
      });
    });
    // any native scroll the browser still does on focus (thumb wholly hidden)
    // is handed back to the transform so Draggable's x stays the truth
    gallery.addEventListener("scroll", () => {
      const s = gallery.scrollLeft;
      if (!s) return;
      gallery.scrollLeft = 0;
      gsap.set(track, { x: gsap.utils.clamp(minX(), 0, drag.x - s) });
      drag.update();
      updateCue();
    });
  } else {
    gallery.addEventListener("scroll", updateCue, { passive: true });
  }

  if (cue) {
    updateCue();
    window.addEventListener("resize", updateCue, { passive: true });
  }

  // read-and-reset: true if the gesture that just ended was a flick, not a tap
  return {
    consumeDrag() {
      if (!dragged) return false;
      dragged = false;
      return true;
    },
  };
}
