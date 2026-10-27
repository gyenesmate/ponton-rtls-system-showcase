import { footprintCorners, rasterizeFootprint } from './footprint.ts';
import { OccupancyIndex } from './occupancy-index.ts';
import type {
  FootprintSpec,
  GridConfigData,
  PlacementConflict,
  PlacementValidationResult,
  SpatialLayer
} from './types.ts';

export type LayerConflictMatrix = Readonly<Record<SpatialLayer, readonly SpatialLayer[]>>;

export const LAYER_CONFLICT_MATRIX = Object.freeze({
  obstacle: Object.freeze(['obstacle'] as const),
  navigation: Object.freeze(['obstacle', 'navigation'] as const),
  zone: Object.freeze([] as const),
  infrastructure: Object.freeze([] as const),
  reservation: Object.freeze(['reservation'] as const)
}) satisfies LayerConflictMatrix;

export function isFootprintInBounds(
  x: number,
  z: number,
  footprint: FootprintSpec,
  grid: GridConfigData
): boolean {
  const clearance = footprint.clearance ?? 0;
  const width = Math.max(0, (footprint.width ?? 0) + clearance * 2);
  const depth = Math.max(0, (footprint.depth ?? 0) + clearance * 2);
  if (width <= 0 || depth <= 0) return false;
  const maxX = grid.originX + grid.cols * grid.cellSize;
  const maxZ = grid.originZ + grid.rows * grid.cellSize;
  const eps = 1e-9;
  return footprintCorners(x, z, width, depth, footprint.yaw ?? 0).every(
    (point) =>
      point.x >= grid.originX - eps &&
      point.x <= maxX + eps &&
      point.z >= grid.originZ - eps &&
      point.z <= maxZ + eps
  );
}

export class PlacementValidator {
  readonly occupancy: OccupancyIndex;
  readonly conflictMatrix: LayerConflictMatrix;

  constructor(
    occupancy: OccupancyIndex,
    { conflictMatrix = LAYER_CONFLICT_MATRIX }: { conflictMatrix?: LayerConflictMatrix } = {}
  ) {
    this.occupancy = occupancy;
    this.conflictMatrix = conflictMatrix;
  }

  validate(
    x: number,
    z: number,
    footprint: FootprintSpec,
    { excludeId }: { excludeId?: string } = {}
  ): PlacementValidationResult {
    const reasons: string[] = [];
    const conflicts: PlacementConflict[] = [];
    if (!footprint?.layer) return { ok: false, reasons: ['missing_layer'], conflicts };

    const grid = this.occupancy.grid;
    if (!isFootprintInBounds(x, z, footprint, grid)) reasons.push('out_of_bounds');
    const cells = rasterizeFootprint(x, z, footprint, grid);
    if (cells.length === 0) reasons.push('empty_footprint');

    const byId = new Map<string, PlacementConflict>();
    for (const layer of this.conflictMatrix[footprint.layer] ?? [footprint.layer]) {
      for (const hit of this.occupancy.queryCells(layer, cells, { excludeId })) {
        const key = `${hit.layer}:${hit.entityId}`;
        if (!byId.has(key)) byId.set(key, hit);
      }
    }
    conflicts.push(...byId.values());
    if (conflicts.length > 0) reasons.push('layer_conflict');
    return { ok: reasons.length === 0, reasons, conflicts };
  }
}
