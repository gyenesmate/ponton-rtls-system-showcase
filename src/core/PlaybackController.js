/**
 * Shared simulation clock for continuous website embeds and interactive demos.
 * Visibility/off-screen RAF stop stays in WarehouseScene — separate from pause.
 */
export class PlaybackController {
  /**
   * @param {object} [options]
   * @param {'continuous'|'interactive'} [options.mode]
   * @param {boolean} [options.autoplay]
   * @param {boolean} [options.loop]
   * @param {number} [options.speed]
   * @param {boolean} [options.respectReducedMotion]
   */
  constructor(options = {}) {
    this.mode = options.mode === 'interactive' ? 'interactive' : 'continuous';
    this.autoplay = options.autoplay !== false;
    this.loop = options.loop !== false;
    this.speed = Number.isFinite(options.speed) ? Math.max(0, options.speed) : 1;
    this.respectReducedMotion = options.respectReducedMotion !== false;

    this.time = 0;
    this.paused = !this.autoplay;
    /** Bumps when restart/seek should reset agent clocks. */
    this.epoch = 0;

    this._reducedMotion = false;
    if (this.respectReducedMotion && typeof globalThis.matchMedia === 'function') {
      this._reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this._reducedMotion) {
        this.paused = true;
      }
    }
  }

  get reducedMotion() {
    return this._reducedMotion;
  }

  play() {
    if (this._reducedMotion) return;
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  restart() {
    this.time = 0;
    this.epoch += 1;
    if (!this._reducedMotion) {
      this.paused = false;
    }
  }

  setSpeed(speed) {
    this.speed = Math.max(0, Number(speed) || 0);
  }

  seek(time) {
    this.time = Math.max(0, Number(time) || 0);
    this.epoch += 1;
  }

  /**
   * @param {number} wallDelta Seconds of wall-clock time since last frame
   * @returns {number} Simulation delta to feed RouteManager / FX
   */
  tick(wallDelta) {
    if (this.paused || this._reducedMotion) return 0;
    const simDelta = Math.max(0, wallDelta) * this.speed;
    this.time += simDelta;
    return simDelta;
  }
}
