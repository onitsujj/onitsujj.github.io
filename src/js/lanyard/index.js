import profileUrl from "../../assets/profile.jpg?url";

// Whether to mount the live WebGL badge. Phones / narrow / no-WebGL get the
// static card instead. (Vendoring the libs locally means Brave desktop now
// passes this — the old esm.sh block is gone.)
export function canUse3D() {
  if (typeof window === "undefined") return false;
  if (
    window.matchMedia &&
    (window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 900px)").matches)
  ) {
    return false;
  }
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

// Lazy-load + mount the 3D badge over the static one. Resolves true once the
// live badge is on screen, false if 3D isn't used or fails — the load
// choreography (M3) awaits this with its own timeout race.
export function initLanyard({ onReady } = {}) {
  const mountEl = document.getElementById("lanyard-mount");
  const hero = document.querySelector(".hero");
  if (!mountEl || !canUse3D()) return Promise.resolve(false);

  return import("./LanyardBadge.js")
    .then(({ mount }) => {
      return new Promise((resolve) => {
        mount(mountEl, {
          image: profileUrl,
          cardColor: "#1a1a1e",
          clipColor: "#8a8a82",
          strapColor: "#1cbdd4",
          onReady: () => {
            if (hero) hero.classList.add("is-3d");
            onReady && onReady();
            resolve(true);
          },
        });
      });
    })
    .catch((err) => {
      console.warn("lanyard 3D unavailable, keeping static badge:", err);
      return false;
    });
}
