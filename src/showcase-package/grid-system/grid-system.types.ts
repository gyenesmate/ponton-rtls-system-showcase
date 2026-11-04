export const WAREHOUSE_DOCUMENT_VERSION = 1;
export const DEFAULT_SPATIAL_CELL_SIZE = 2;

export const SPATIAL_LAYERS = [
  'obstacle',
  'navigation',
  'zone',
  'infrastructure',
  'reservation'
] as const;

export type SpatialLayer = (typeof SPATIAL_LAYERS)[number];

export interface GridConfigData {
  cellSize: number;
  originX: number;
  originZ: number;
  cols: number;
  rows: number;
  widthM: number;
  depthM: number;
}

export interface FootprintSpec {
  width: number;
  depth: number;
  height?: number;
  yaw?: number;
  clearance?: number;
  layer: SpatialLayer;
  blocksNavigation?: boolean;
}

export type EntityKind = 'machine' | 'shelf' | 'wall' | 'zone' | 'anchor' | 'light' | 'agentTemplate';

export interface EntityBase {
  id: string;
  kind: EntityKind | string;
  x: number;
  z: number;
  y?: number;
  footprint: FootprintSpec;
  catalogId?: string;
  model?: string;
  [key: string]: unknown;
}

export interface WarehouseDocument {
  version: number;
  id: string;
  orientationY?: number;
  grid: GridConfigData;
  warehouse: Record<string, unknown>;
  entities: EntityBase[];
  routes: Record<string, unknown>[];
  intersections?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}

export interface PlacementConflict {
  entityId: string;
  layer: SpatialLayer;
}

export interface PlacementValidationResult {
  ok: boolean;
  reasons: string[];
  conflicts: PlacementConflict[];
}

export interface SpatialDirtySet {
  entityIds: string[];
  cellBounds: {
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
  } | null;
}

export interface SpatialEditResult {
  ok: boolean;
  reasons: string[];
  conflicts: PlacementConflict[];
  entity?: EntityBase;
  dirty?: SpatialDirtySet;
}
