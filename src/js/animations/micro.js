// Micro-interactions for fine-pointer devices: a magnetic pull on the primary
// CTA + brand mark, a gentle clamped lean on the photo tiles, and press
// feedback on the CTAs. Skipped on touch and (via matchMedia) on reduced motion.
export function setupMicro({ gsap }) {
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;

  // strong pull on the primary actions; a softer, clamped lean on the photo
  // tiles so they notice the cursor without drifting off their strip.
  magnetize(gsap, ".btn--primary, .brand-mark", { strength: 0.32 });
  magnetize(gsap, ".gallery__thumb", { strength: 0.1, max: 6 });

  // press feedback: the CTA gives when pressed and springs back on the signature
  // ease — tactility on the page's one conversion action.
  document.querySelectorAll(".btn--primary").forEach((el) => {
    const down = () => gsap.to(el, { scale: 0.96, duration: 0.12, ease: "power2.out" });
    const up = () => gsap.to(el, { scale: 1, duration: 0.5, ease: "jg" });
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
  });
}

function magnetize(gsap, selector, { strength, max }) {
  document.querySelectorAll(selector).forEach((el) => {
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      let x = (e.clientX - (r.left + r.width / 2)) * strength;
      let y = (e.clientY - (r.top + r.height / 2)) * strength;
      if (max != null) {
        x = gsap.utils.clamp(-max, max, x);
        y = gsap.utils.clamp(-max, max, y);
      }
      gsap.to(el, { x, y, duration: 0.4, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
  });
}
