export const PALETTE = Object.freeze({
  color1: 0xffffff,
  color2: 0xf5f6f8,
  color3: 0xd7d9dd,
  color4: 0xffa400,
  color5: 0xa2a5af,
  color6: 0x62687b,
  color7: 0x303442,
  color8: 0x222530
});

export const RTLS_VISUALIZATION = Object.freeze({
  cycleDuration: 4.8,
  linkDuration: 0.58,
  pulseDuration: 0.5,
  anchorsPerFix: 3
});

export const QUALITY_PRESETS = Object.freeze({
  high: {
    maxPixelRatio: 2,
    targetFps: 60,
    shadows: true,
    shadowMapSize: 2048,
    antialias: true
  },
  medium: {
    maxPixelRatio: 1.5,
    targetFps: 45,
    shadows: true,
    shadowMapSize: 1024,
    antialias: true
  },
  low: {
    maxPixelRatio: 1,
    targetFps: 30,
    shadows: false,
    shadowMapSize: 512,
    antialias: false
  }
});

export function getQualityPreset(name: string | undefined) {
  return QUALITY_PRESETS[name as keyof typeof QUALITY_PRESETS] ?? QUALITY_PRESETS.medium;
}

/** Soft budgets for imported models and instancing (marketing embeds). */
export const ASSET_BUDGETS = Object.freeze({
  loadTimeoutMs: 8000,
  /** Use InstancedMesh when this many machines share the same size. */
  instanceMinCount: 3,
  maxTrianglesHero: 80000,
  maxTrianglesSecondary: 50000,
  maxModelPayloadBytes: 12 * 1024 * 1024
});
