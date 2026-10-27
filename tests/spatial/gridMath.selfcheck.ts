import {
  GridConfig,
  worldToCell,
  cellToWorld,
  snapWorldToCellCenter,
  wallToWorld,
  worldToWall,
  wallYaw,
  cellKey,
  parseCellKey
} from '../../src/core/grid';

const eps = 1e-9;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function nearlyEqual(a: number, b: number, label: string): void {
  assert(Math.abs(a - b) < eps, `${label}: expected ${b}, got ${a}`);
}

const grid = GridConfig.fromWarehouse({ width: 44, depth: 30 }, 2);
nearlyEqual(grid.cols, 22, 'cols');
nearlyEqual(grid.rows, 15, 'rows');
nearlyEqual(grid.originX, -22, 'originX');
nearlyEqual(grid.originZ, -15, 'originZ');

const originCell = worldToCell(0, 0, grid);
assert(originCell.inBounds, 'origin in bounds');
nearlyEqual(originCell.col, 11, 'origin col');
nearlyEqual(originCell.row, 7, 'origin row');

const center = cellToWorld(originCell.col, originCell.row, grid);
nearlyEqual(center.x, 1, 'cell center x');
nearlyEqual(center.z, 0, 'cell center z');

const roundTrip = worldToCell(center.x, center.z, grid);
nearlyEqual(roundTrip.col, originCell.col, 'round-trip col');
nearlyEqual(roundTrip.row, originCell.row, 'round-trip row');

const snapped = snapWorldToCellCenter(0.1, -0.1, grid);
assert(worldToCell(snapped.x, snapped.z, grid).inBounds, 'snapped in bounds');
assert(!worldToCell(-100, 0, grid).inBounds, 'far west out of bounds');

const parsed = parseCellKey(cellKey(3, 7));
nearlyEqual(parsed.col, 3, 'cellKey col');
nearlyEqual(parsed.row, 7, 'cellKey row');

const warehouse = { width: 44, depth: 30, wallThickness: 0.55 };
nearlyEqual(wallYaw('back'), 0, 'back yaw');
nearlyEqual(wallYaw('left'), Math.PI / 2, 'left yaw');

const samples = [
  { wall: 'back' as const, u: -18, v: 7.1, n: 0.045 },
  { wall: 'left' as const, u: -10, v: 7.1, n: 0.045 },
  { wall: 'front' as const, u: 3, v: 2, n: 0.1 },
  { wall: 'right' as const, u: 5, v: 4, n: 0.2 }
];

for (const sample of samples) {
  const world = wallToWorld(sample.wall, sample, warehouse);
  const local = worldToWall(sample.wall, world, warehouse);
  nearlyEqual(local.u, sample.u, `${sample.wall} u`);
  nearlyEqual(local.v, sample.v, `${sample.wall} v`);
  nearlyEqual(local.n, sample.n, `${sample.wall} n`);
  nearlyEqual(world.yaw, wallYaw(sample.wall), `${sample.wall} yaw`);
}

if (!process.exitCode) console.log('gridMath.selfcheck: ok');
