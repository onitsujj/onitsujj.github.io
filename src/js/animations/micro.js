// Micro-interactions for fine-pointer devices: a magnetic pull on the primary
// CTA + brand mark, a gentle clamped lean on the photo tiles, and press
// feedback on the CTAs. Skipped on touch and (via matchMedia) on reduced motion.
// Returns a cleanup that removes every listener and clears the transforms, so a
// mid-session switch to reduced motion (which reverts the matchMedia context in
// motion.js) also stops these pointer-driven tweens.
import { GALLERY_THUMB } from "../dom.js";
import { SIGNATURE_EASE } from "./motion-tokens.js";

export function setupMicro({ gsap }) {
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return () => {};

  const off = []; // [el, type, fn] triples to unbind on teardown
  const targets = []; // elements whose tweens we kill on teardown
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    off.push([el, type, fn]);
  };

  // strong pull on the primary actions; a softer, clamped lean on the photo
  // tiles so they notice the cursor without drifting off their strip.
  magnetize(gsap, ".btn--primary, .brand-mark", { strength: 0.32 }, on, targets);
  magnetize(gsap, GALLERY_THUMB, { strength: 0.1, max: 6 }, on, targets);

  // press feedback: the CTA gives when pressed and springs back on the signature
  // ease — tactility on the page's one conversion action.
  document.querySelectorAll(".btn--primary").forEach((el) => {
    const down = () => gsap.to(el, { scale: 0.96, duration: 0.12, ease: "power2.out" });
    const up = () => gsap.to(el, { scale: 1, duration: 0.5, ease: SIGNATURE_EASE });
    on(el, "pointerdown", down);
    on(el, "pointerup", up);
    on(el, "pointerleave", up);
    targets.push(el);
  });

  return () => {
    off.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
    gsap.killTweensOf(targets);
    gsap.set(targets, { clearProps: "transform" });
  };
}

function magnetize(gsap, selector, { strength, max }, on, targets) {
  document.querySelectorAll(selector).forEach((el) => {
    // one reusable tween per axis instead of a fresh gsap.to() on every move,
    // and the resting centre is measured on enter (not per move) so pointermove
    // never reads layout — both avoid per-event allocation and forced reflow.
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    let cx, cy;
    const measure = () => {
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    };
    const onMove = (e) => {
      if (cx === undefined) measure();
      let x = (e.clientX - cx) * strength;
      let y = (e.clientY - cy) * strength;
      if (max != null) {
        x = gsap.utils.clamp(-max, max, x);
        y = gsap.utils.clamp(-max, max, y);
      }
      xTo(x);
      yTo(y);
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    on(el, "pointerenter", measure);
    on(el, "pointermove", onMove);
    on(el, "pointerleave", onLeave);
    targets.push(el);
  });
}
