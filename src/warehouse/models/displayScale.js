/**
 * Display scale applied by procedural factories (and by GLB hosts).
 * GLB files are exported at scale 1; runtime multiplies by these values.
 */
export const MODEL_DISPLAY_SCALE = Object.freeze({
  forklift: 10,
  worker: 0.85,
  amr: 0.86,
  container: 1
});
