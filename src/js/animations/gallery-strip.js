// Draggable / throwable photo strip: grab-and-flick with inertia, but only when
// the strip actually overflows its viewport (a separate .gallery__track). On
// desktop where the tiles fit, it's inert and native scroll is the fallback.
// Exposes consumeDrag() so the click handler can tell a flick from a tap and
// skip opening the lightbox after a flick.
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import gsap from "gsap";

gsap.registerPlugin(Draggable, InertiaPlugin);

export function createDraggableStrip({ gallery, track, reduced = false }) {
  let dragged = false;

  if (!reduced && track !== gallery) {
    gallery.classList.add("is-draggable");
    Draggable.create(track, {
      type: "x",
      bounds: gallery,
      inertia: true,
      edgeResistance: 0.8,
      cursor: "grab",
      activeCursor: "grabbing",
      dragClickables: true,
      onPress() { dragged = false; },
      onDrag() { if (Math.abs(this.x - this.startX) > 6) dragged = true; },
    });
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
