/**
 * Three-free grid / wall math for the spatial engine.
 * @module spatial/gridMath
 */

import { DEFAULT_SPATIAL_CELL_SIZE } from '../domain/types.js';

export const DEFAULT_CELL_SIZE = DEFAULT_SPATIAL_CELL_SIZE;

/**
 * Snap a scalar to a coarse authoring lattice.
 * @param {number} value
 * @param {number} [cellSize]
 */
export function snapToGrid(value, cellSize = DEFAULT_CELL_SIZE) {
  if (cellSize <= 0) return value;
  return Math.round(value / cellSize) * cellSize;
}

/**
 * Ground pose helper. Snap is opt-in.
 * @param {{ x?: number, z?: number, y?: number }} pose
 * @param {{ cellSize?: number, snap?: boolean }} [options]
 */
export function groundPose(
  { x = 0, z = 0, y = 0 } = {},
  { cellSize = DEFAULT_CELL_SIZE, snap = false } = {}
) {
  return {
    x: snap ? snapToGrid(x, cellSize) : x,
    y,
    z: snap ? snapToGrid(z, cellSize) : z
  };
}

/**
 * Pack col/row into a stable string key for sparse maps.
 * @param {number} col
 * @param {number} row
 */
export function cellKey(col, row) {
  return `${col},${row}`;
}

/**
 * @param {string} key
 * @returns {{ col: number, row: number }}
 */
export function parseCellKey(key) {
  const [col, row] = String(key).split(',').map(Number);
  return { col, row };
}

/**
 * World XZ → discrete cell. Out-of-range returns inBounds false.
 *
 * @param {number} x
 * @param {number} z
 * @param {import('../domain/types.js').GridConfig} grid
 * @returns {{ col: number, row: number, inBounds: boolean }}
 */
export function worldToCell(x, z, grid) {
  const col = Math.floor((x - grid.originX) / grid.cellSize);
  const row = Math.floor((z - grid.originZ) / grid.cellSize);
  const inBounds = col >= 0 && row >= 0 && col < grid.cols && row < grid.rows;
  return { col, row, inBounds };
}

/**
 * Cell indices → world position at cell center (floor plane).
 *
 * @param {number} col
 * @param {number} row
 * @param {import('../domain/types.js').GridConfig} grid
 * @returns {{ x: number, z: number }}
 */
export function cellToWorld(col, row, grid) {
  return {
    x: grid.originX + (col + 0.5) * grid.cellSize,
    z: grid.originZ + (row + 0.5) * grid.cellSize
  };
}

/**
 * Snap world XZ to nearest cell center (clamped into bounds when possible).
 *
 * @param {number} x
 * @param {number} z
 * @param {import('../domain/types.js').GridConfig} grid
 */
export function snapWorldToCellCenter(x, z, grid) {
  let { col, row } = worldToCell(x, z, grid);
  col = Math.min(Math.max(col, 0), grid.cols - 1);
  row = Math.min(Math.max(row, 0), grid.rows - 1);
  return cellToWorld(col, row, grid);
}

/**
 * Yaw (radians about +Y) so local +Z faces into the warehouse interior.
 * @param {'back'|'left'|'front'|'right'|string} wallId
 */
export function wallYaw(wallId) {
  switch (wallId) {
    case 'back':
      return 0;
    case 'left':
      return Math.PI / 2;
    case 'front':
      return Math.PI;
    case 'right':
      return -Math.PI / 2;
    default:
      return 0;
  }
}

/**
 * Local wall frame in world space (u along wall, v height, n into room).
 *
 * @param {'back'|'left'|'front'|'right'|string} wallId
 * @param {{ width?: number, depth?: number, wallThickness?: number }} [warehouse]
 */
export function wallFrame(wallId, warehouse = {}) {
  const width = warehouse.width ?? 44;
  const depth = warehouse.depth ?? 30;
  const halfT = (warehouse.wallThickness ?? 0.55) / 2;

  switch (wallId) {
    case 'left':
      return {
        wallId: 'left',
        origin: { x: -width / 2 + halfT, y: 0, z: 0 },
        u: { x: 0, y: 0, z: 1 },
        v: { x: 0, y: 1, z: 0 },
        n: { x: 1, y: 0, z: 0 },
        yaw: Math.PI / 2
      };
    case 'front':
      return {
        wallId: 'front',
        origin: { x: 0, y: 0, z: depth / 2 - halfT },
        u: { x: -1, y: 0, z: 0 },
        v: { x: 0, y: 1, z: 0 },
        n: { x: 0, y: 0, z: -1 },
        yaw: Math.PI
      };
    case 'right':
      return {
        wallId: 'right',
        origin: { x: width / 2 - halfT, y: 0, z: 0 },
        u: { x: 0, y: 0, z: -1 },
        v: { x: 0, y: 1, z: 0 },
        n: { x: -1, y: 0, z: 0 },
        yaw: -Math.PI / 2
      };
    case 'back':
    default:
      return {
        wallId: 'back',
        origin: { x: 0, y: 0, z: -depth / 2 + halfT },
        u: { x: 1, y: 0, z: 0 },
        v: { x: 0, y: 1, z: 0 },
        n: { x: 0, y: 0, z: 1 },
        yaw: 0
      };
  }
}

/**
 * @param {string} wallId
 * @param {{ u?: number, v?: number, n?: number }} local
 * @param {object} [warehouse]
 */
export function wallToWorld(wallId, { u = 0, v = 0, n = 0 } = {}, warehouse = {}) {
  const frame = wallFrame(wallId, warehouse);
  return {
    x: frame.origin.x + frame.u.x * u + frame.v.x * v + frame.n.x * n,
    y: frame.origin.y + frame.u.y * u + frame.v.y * v + frame.n.y * n,
    z: frame.origin.z + frame.u.z * u + frame.v.z * v + frame.n.z * n,
    yaw: frame.yaw
  };
}

/**
 * @param {string} wallId
 * @param {{ x?: number, y?: number, z?: number }} world
 * @param {object} [warehouse]
 */
export function worldToWall(wallId, { x = 0, y = 0, z = 0 } = {}, warehouse = {}) {
  const frame = wallFrame(wallId, warehouse);
  const dx = x - frame.origin.x;
  const dy = y - frame.origin.y;
  const dz = z - frame.origin.z;
  return {
    u: dx * frame.u.x + dy * frame.u.y + dz * frame.u.z,
    v: dx * frame.v.x + dy * frame.v.y + dz * frame.v.z,
    n: dx * frame.n.x + dy * frame.n.y + dz * frame.n.z
  };
}
