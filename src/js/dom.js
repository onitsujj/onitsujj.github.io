// Shared DOM hooks — the handful of selectors that more than one module depends
// on. Single-use selectors stay local to the module that owns them; only the
// genuinely shared contract lives here, so renaming one of these is a single
// edit instead of a hunt across files. (Breakpoints stay local on purpose: the
// 3D gate and the keynote-scene gate encode different intents, not one shared
// threshold.)
export const LANYARD_MOUNT = "#lanyard-mount";
export const HERO = ".hero";
export const HERO_STATIC_BADGE = ".hero__static-badge";
export const GALLERY_THUMB = ".gallery__thumb";
