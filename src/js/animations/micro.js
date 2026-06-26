// Micro-interactions for fine-pointer devices: magnetic pull on the primary
// CTA + brand mark. Skipped on touch and (via matchMedia) on reduced motion.
export function setupMicro({ gsap }) {
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;

  const magnets = document.querySelectorAll(".btn--primary, .brand-mark");
  magnets.forEach((el) => {
    const strength = 0.32;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
  });
}
