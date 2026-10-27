/**
 * Shared animation helpers. Expand as scenarios need timed transitions.
 */
export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
