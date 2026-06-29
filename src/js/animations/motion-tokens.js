// The site's shared motion tokens — the signature ease and the scroll-progress
// ease — registered once, in one place. They used to live in reveals.js and were
// read by name through GSAP's global ease registry, so every other module that
// used them carried a hidden, load-order-dependent assumption. Importing the
// names from here makes that dependency explicit.
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// A faint S-curve for the scroll-progress bar: softens the very start/end so it
// reads as a designed pacing aid rather than a flat loading bar, while staying
// near-linear (honest about scroll position) through the middle.
CustomEase.create("progress", "M0,0 C0.2,0.08 0.8,0.92 1,1");
// The site's "signature" ease — a confident arrival with a whisper of overshoot
// (~6%). Shared by the loader cascade, the section reveals, the held-breath
// thesis word, and the CTA press release, so every entrance feels like the
// site's own rather than a borrowed default curve. (CSS mirrors it in
// --ease-signature for translate-based hovers.)
CustomEase.create("jg", "M0,0 C0.16,0.84 0.3,1.06 1,1");

export const SIGNATURE_EASE = "jg";
export const PROGRESS_EASE = "progress";
