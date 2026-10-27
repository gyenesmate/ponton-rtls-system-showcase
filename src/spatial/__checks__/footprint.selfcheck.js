/**
 * Phase 2 footprint raster self-check.
 * Run via: npm run check:spatial
 */
import { GridConfig } from '../GridConfig.js';
import { worldToCell, cellKey } from '../gridMath.js';
import { footprintCorners, rasterizeFootprint } from '../Footprint.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const grid = GridConfig.fromWarehouse({ width: 44, depth: 30 }, 2);

// Axis-aligned 1×1 m box at origin → covers the cell(s) around origin
const cells1 = rasterizeFootprint(
  0,
  0,
  { width: 1, depth: 1, layer: 'obstacle' },
  grid
);
assert(cells1.length >= 1, `1×1 at origin should cover ≥1 cell, got ${cells1.length}`);
assert(cells1.includes(cellKey(10, 7)) || cells1.includes(cellKey(11, 7)), 'expected origin neighborhood cell');

// Continuous machine footprint: 12×5 at origin
const big = rasterizeFootprint(
  0,
  0,
  { width: 12, depth: 5, layer: 'obstacle' },
  grid
);
const west = worldToCell(-6 + 1e-6, 0, grid);
const east = worldToCell(6 - 1e-6, 0, grid);
assert(big.includes(cellKey(west.col, west.row)), '12×5 covers west edge');
assert(big.includes(cellKey(east.col, east.row)), '12×5 covers east edge');
assert(big.length > 10, `12×5 should cover many cells, got ${big.length}`);

// 90° yaw swaps extents
const yaw0 = new Set(
  rasterizeFootprint(0, 0, { width: 2, depth: 10, yaw: 0, layer: 'obstacle' }, grid)
);
const yaw90 = new Set(
  rasterizeFootprint(0, 0, { width: 2, depth: 10, yaw: Math.PI / 2, layer: 'obstacle' }, grid)
);
assert(yaw0.size !== yaw90.size || ![...yaw0].every((k) => yaw90.has(k)), 'yaw changes cover');

const corners = footprintCorners(1, 2, 4, 2, 0);
assert(corners.length === 4, 'four corners');
assert(Math.abs(corners[0].x - 3) < 1e-9 && Math.abs(corners[0].z - 3) < 1e-9, 'corner +/+');

// Clearance inflates cover
const bare = rasterizeFootprint(5, 5, { width: 1, depth: 1, layer: 'obstacle' }, grid);
const padded = rasterizeFootprint(
  5,
  5,
  { width: 1, depth: 1, clearance: 1, layer: 'obstacle' },
  grid
);
assert(padded.length >= bare.length, 'clearance does not shrink cover');

// Out-of-warehouse footprint clips to in-bounds cells only
const edge = rasterizeFootprint(
  -21,
  0,
  { width: 4, depth: 2, layer: 'obstacle' },
  grid
);
for (const key of edge) {
  const [col, row] = key.split(',').map(Number);
  assert(col >= 0 && col < grid.cols && row >= 0 && row < grid.rows, `in-bounds ${key}`);
}

if (!process.exitCode) {
  console.log('footprint.selfcheck: ok');
}
