import { cellKey } from './grid-math.ts';
import type { FootprintSpec, GridConfigData } from './types.ts';

export function footprintCorners(
  x: number,
  z: number,
  width: number,
  depth: number,
  yaw = 0
): { x: number; z: number }[] {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const locals: [number, number][] = [[hw, hd], [-hw, hd], [-hw, -hd], [hw, -hd]];
  return locals.map(([lx, lz]) => ({ x: x + lx * c - lz * s, z: z + lx * s + lz * c }));
}

export function aabbIntersectsObb(
  minX: number, maxX: number, minZ: number, maxZ: number,
  ox: number, oz: number, hw: number, hd: number, cos: number, sin: number
): boolean {
  const acx = (minX + maxX) * 0.5;
  const acz = (minZ + maxZ) * 0.5;
  const ahw = (maxX - minX) * 0.5;
  const ahd = (maxZ - minZ) * 0.5;
  const dx = acx - ox;
  const dz = acz - oz;

  if (Math.abs(dx * cos + dz * sin) > hw + ahw * Math.abs(cos) + ahd * Math.abs(sin)) return false;
  if (Math.abs(-dx * sin + dz * cos) > hd + ahw * Math.abs(sin) + ahd * Math.abs(cos)) return false;
  if (Math.abs(dx) > ahw + hw * Math.abs(cos) + hd * Math.abs(sin)) return false;
  if (Math.abs(dz) > ahd + hw * Math.abs(sin) + hd * Math.abs(cos)) return false;
  return true;
}

export function rasterizeFootprint(
  x: number,
  z: number,
  footprint: FootprintSpec,
  grid: GridConfigData
): string[] {
  const clearance = footprint.clearance ?? 0;
  const width = Math.max(0, (footprint.width ?? 0) + clearance * 2);
  const depth = Math.max(0, (footprint.depth ?? 0) + clearance * 2);
  if (width <= 0 || depth <= 0 || grid.cellSize <= 0) return [];

  const yaw = footprint.yaw ?? 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const corners = footprintCorners(x, z, width, depth, yaw);
  const xs = corners.map((point) => point.x);
  const zs = corners.map((point) => point.z);
  const s = grid.cellSize;
  const col0 = Math.max(0, Math.floor((Math.min(...xs) - grid.originX) / s));
  const col1 = Math.min(grid.cols - 1, Math.floor((Math.max(...xs) - grid.originX) / s));
  const row0 = Math.max(0, Math.floor((Math.min(...zs) - grid.originZ) / s));
  const row1 = Math.min(grid.rows - 1, Math.floor((Math.max(...zs) - grid.originZ) / s));
  const cells: string[] = [];

  for (let col = col0; col <= col1; col++) {
    const cMinX = grid.originX + col * s;
    for (let row = row0; row <= row1; row++) {
      const cMinZ = grid.originZ + row * s;
      if (aabbIntersectsObb(cMinX, cMinX + s, cMinZ, cMinZ + s, x, z, hw, hd, cos, sin)) {
        cells.push(cellKey(col, row));
      }
    }
  }
  return cells;
}

export const Footprint = Object.freeze({
  footprintCorners,
  aabbIntersectsObb,
  rasterizeFootprint
});
