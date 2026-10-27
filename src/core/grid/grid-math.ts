import { DEFAULT_SPATIAL_CELL_SIZE, type GridConfigData } from './types.ts';

export const DEFAULT_CELL_SIZE = DEFAULT_SPATIAL_CELL_SIZE;

export interface WarehouseDimensions {
  width?: number;
  depth?: number;
  wallThickness?: number;
}

export function snapToGrid(value: number, cellSize = DEFAULT_CELL_SIZE): number {
  if (cellSize <= 0) return value;
  return Math.round(value / cellSize) * cellSize;
}

export function groundPose(
  { x = 0, z = 0, y = 0 }: { x?: number; z?: number; y?: number } = {},
  { cellSize = DEFAULT_CELL_SIZE, snap = false }: { cellSize?: number; snap?: boolean } = {}
) {
  return {
    x: snap ? snapToGrid(x, cellSize) : x,
    y,
    z: snap ? snapToGrid(z, cellSize) : z
  };
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function parseCellKey(key: string): { col: number; row: number } {
  const [col, row] = String(key).split(',').map(Number);
  return { col, row };
}

export function worldToCell(x: number, z: number, grid: GridConfigData) {
  const col = Math.floor((x - grid.originX) / grid.cellSize);
  const row = Math.floor((z - grid.originZ) / grid.cellSize);
  return {
    col,
    row,
    inBounds: col >= 0 && row >= 0 && col < grid.cols && row < grid.rows
  };
}

export function cellToWorld(col: number, row: number, grid: GridConfigData) {
  return {
    x: grid.originX + (col + 0.5) * grid.cellSize,
    z: grid.originZ + (row + 0.5) * grid.cellSize
  };
}

export function snapWorldToCellCenter(x: number, z: number, grid: GridConfigData) {
  let { col, row } = worldToCell(x, z, grid);
  col = Math.min(Math.max(col, 0), grid.cols - 1);
  row = Math.min(Math.max(row, 0), grid.rows - 1);
  return cellToWorld(col, row, grid);
}

export function wallYaw(wallId: string): number {
  switch (wallId) {
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

export function wallFrame(wallId: string, warehouse: WarehouseDimensions = {}) {
  const width = warehouse.width ?? 44;
  const depth = warehouse.depth ?? 30;
  const halfT = (warehouse.wallThickness ?? 0.55) / 2;

  switch (wallId) {
    case 'left':
      return {
        wallId: 'left', origin: { x: -width / 2 + halfT, y: 0, z: 0 },
        u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 }, n: { x: 1, y: 0, z: 0 },
        yaw: Math.PI / 2
      };
    case 'front':
      return {
        wallId: 'front', origin: { x: 0, y: 0, z: depth / 2 - halfT },
        u: { x: -1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: -1 },
        yaw: Math.PI
      };
    case 'right':
      return {
        wallId: 'right', origin: { x: width / 2 - halfT, y: 0, z: 0 },
        u: { x: 0, y: 0, z: -1 }, v: { x: 0, y: 1, z: 0 }, n: { x: -1, y: 0, z: 0 },
        yaw: -Math.PI / 2
      };
    default:
      return {
        wallId: 'back', origin: { x: 0, y: 0, z: -depth / 2 + halfT },
        u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 },
        yaw: 0
      };
  }
}

export function wallToWorld(
  wallId: string,
  { u = 0, v = 0, n = 0 }: { u?: number; v?: number; n?: number } = {},
  warehouse: WarehouseDimensions = {}
) {
  const frame = wallFrame(wallId, warehouse);
  return {
    x: frame.origin.x + frame.u.x * u + frame.v.x * v + frame.n.x * n,
    y: frame.origin.y + frame.u.y * u + frame.v.y * v + frame.n.y * n,
    z: frame.origin.z + frame.u.z * u + frame.v.z * v + frame.n.z * n,
    yaw: frame.yaw
  };
}

export function worldToWall(
  wallId: string,
  { x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number } = {},
  warehouse: WarehouseDimensions = {}
) {
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
