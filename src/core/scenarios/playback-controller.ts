import type { PlaybackOptions } from './scenario-types';

/**
 * Shared simulation clock for continuous website embeds and interactive demos.
 * Visibility/off-screen RAF stop stays in WarehouseScene — separate from pause.
 */
export class PlaybackController {
  mode: 'continuous' | 'interactive';
  autoplay: boolean;
  loop: boolean;
  speed: number;
  respectReducedMotion: boolean;
  time = 0;
  paused: boolean;
  /** Bumps when restart/seek should reset agent clocks. */
  epoch = 0;
  private readonly _reducedMotion: boolean;

  constructor(options: PlaybackOptions = {}) {
    this.mode = options.mode === 'interactive' ? 'interactive' : 'continuous';
    this.autoplay = options.autoplay !== false;
    this.loop = options.loop !== false;
    this.speed = Number.isFinite(options.speed) ? Math.max(0, options.speed!) : 1;
    this.respectReducedMotion = options.respectReducedMotion !== false;
    this.paused = !this.autoplay;

    this._reducedMotion =
      this.respectReducedMotion &&
      typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this._reducedMotion) {
      this.paused = true;
    }
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  play(): void {
    if (this._reducedMotion) return;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  restart(): void {
    this.time = 0;
    this.epoch += 1;
    if (!this._reducedMotion) {
      this.paused = false;
    }
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0, Number(speed) || 0);
  }

  seek(time: number): void {
    this.time = Math.max(0, Number(time) || 0);
    this.epoch += 1;
  }

  /**
   * @param wallDelta Seconds of wall-clock time since last frame
   * @returns Simulation delta to feed RouteManager / FX
   */
  tick(wallDelta: number): number {
    if (this.paused || this._reducedMotion) return 0;
    const simDelta = Math.max(0, wallDelta) * this.speed;
    this.time += simDelta;
    return simDelta;
  }
}
