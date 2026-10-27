/**
 * Oriented footprint specs → sparse cell cover (Three-free).
 * @module spatial/Footprint
 */

import { cellKey } from './gridMath.js';

/**
 * World-space corners of an oriented rectangle (XZ), counterclockwise from local (+w/2,+d/2).
 *
 * @param {number} x
 * @param {number} z
 * @param {number} width
 * @param {number} depth
 * @param {number} [yaw]
 * @returns {{ x: number, z: number }[]}
 */
export function footprintCorners(x, z, width, depth, yaw = 0) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const locals = [
    [hw, hd],
    [-hw, hd],
    [-hw, -hd],
    [hw, -hd]
  ];
  return locals.map(([lx, lz]) => ({
    x: x + lx * c - lz * s,
    z: z + lx * s + lz * c
  }));
}

/**
 * Axis-aligned cell square vs oriented footprint (2D SAT).
 *
 * @param {number} minX
 * @param {number} maxX
 * @param {number} minZ
 * @param {number} maxZ
 * @param {number} ox
 * @param {number} oz
 * @param {number} hw
 * @param {number} hd
 * @param {number} cos
 * @param {number} sin
 */
export function aabbIntersectsObb(minX, maxX, minZ, maxZ, ox, oz, hw, hd, cos, sin) {
  const acx = (minX + maxX) * 0.5;
  const acz = (minZ + maxZ) * 0.5;
  const ahw = (maxX - minX) * 0.5;
  const ahd = (maxZ - minZ) * 0.5;
  const dx = acx - ox;
  const dz = acz - oz;

  if (Math.abs(dx * cos + dz * sin) > hw + ahw * Math.abs(cos) + ahd * Math.abs(sin)) {
    return false;
  }
  if (Math.abs(-dx * sin + dz * cos) > hd + ahw * Math.abs(sin) + ahd * Math.abs(cos)) {
    return false;
  }
  if (Math.abs(dx) > ahw + hw * Math.abs(cos) + hd * Math.abs(sin)) {
    return false;
  }
  if (Math.abs(dz) > ahd + hw * Math.abs(sin) + hd * Math.abs(cos)) {
    return false;
  }
  return true;
}

/**
 * Rasterize a footprint at world (x,z) onto grid cells (conservative OBB cover).
 *
 * @param {number} x
 * @param {number} z
 * @param {import('../domain/types.js').FootprintSpec} footprint
 * @param {import('../domain/types.js').GridConfig} grid
 * @returns {string[]} cell keys
 */
export function rasterizeFootprint(x, z, footprint, grid) {
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
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of corners) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const s = grid.cellSize;
  const col0 = Math.max(0, Math.floor((minX - grid.originX) / s));
  const col1 = Math.min(grid.cols - 1, Math.floor((maxX - grid.originX) / s));
  const row0 = Math.max(0, Math.floor((minZ - grid.originZ) / s));
  const row1 = Math.min(grid.rows - 1, Math.floor((maxZ - grid.originZ) / s));

  /** @type {string[]} */
  const cells = [];
  for (let col = col0; col <= col1; col++) {
    const cMinX = grid.originX + col * s;
    const cMaxX = cMinX + s;
    for (let row = row0; row <= row1; row++) {
      const cMinZ = grid.originZ + row * s;
      const cMaxZ = cMinZ + s;
      if (aabbIntersectsObb(cMinX, cMaxX, cMinZ, cMaxZ, x, z, hw, hd, cos, sin)) {
        cells.push(cellKey(col, row));
      }
    }
  }
  return cells;
}
