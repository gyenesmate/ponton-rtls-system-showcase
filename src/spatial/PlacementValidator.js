/**
 * Placement validation against layered occupancy (Three-free).
 * @module spatial/PlacementValidator
 */

import { rasterizeFootprint, footprintCorners } from './Footprint.js';

/**
 * Layers that reject overlap when placing onto `layer`.
 * zone / infrastructure coexist with floor obstacles by default.
 *
 * @type {Record<import('../domain/types.js').SpatialLayer, import('../domain/types.js').SpatialLayer[]>}
 */
export const LAYER_CONFLICT_MATRIX = Object.freeze({
  obstacle: Object.freeze(['obstacle']),
  navigation: Object.freeze(['obstacle', 'navigation']),
  zone: Object.freeze([]),
  infrastructure: Object.freeze([]),
  reservation: Object.freeze(['reservation'])
});

/**
 * @param {number} x
 * @param {number} z
 * @param {import('../domain/types.js').FootprintSpec} footprint
 * @param {import('../domain/types.js').GridConfig} grid
 */
export function isFootprintInBounds(x, z, footprint, grid) {
  const clearance = footprint.clearance ?? 0;
  const width = Math.max(0, (footprint.width ?? 0) + clearance * 2);
  const depth = Math.max(0, (footprint.depth ?? 0) + clearance * 2);
  if (width <= 0 || depth <= 0) return false;

  const corners = footprintCorners(x, z, width, depth, footprint.yaw ?? 0);
  const maxX = grid.originX + grid.cols * grid.cellSize;
  const maxZ = grid.originZ + grid.rows * grid.cellSize;
  const eps = 1e-9;

  for (const p of corners) {
    if (p.x < grid.originX - eps || p.x > maxX + eps) return false;
    if (p.z < grid.originZ - eps || p.z > maxZ + eps) return false;
  }
  return true;
}

export class PlacementValidator {
  /**
   * @param {import('./OccupancyIndex.js').OccupancyIndex} occupancy
   * @param {{ conflictMatrix?: typeof LAYER_CONFLICT_MATRIX }} [options]
   */
  constructor(occupancy, { conflictMatrix = LAYER_CONFLICT_MATRIX } = {}) {
    this.occupancy = occupancy;
    this.conflictMatrix = conflictMatrix;
  }

  /**
   * @param {number} x
   * @param {number} z
   * @param {import('../domain/types.js').FootprintSpec} footprint
   * @param {{ excludeId?: string }} [options]
   * @returns {import('../domain/types.js').PlacementValidationResult}
   */
  validate(x, z, footprint, { excludeId } = {}) {
    /** @type {string[]} */
    const reasons = [];
    /** @type {import('../domain/types.js').PlacementConflict[]} */
    const conflicts = [];

    if (!footprint?.layer) {
      return { ok: false, reasons: ['missing_layer'], conflicts };
    }

    const grid = this.occupancy.grid;
    if (!isFootprintInBounds(x, z, footprint, grid)) {
      reasons.push('out_of_bounds');
    }

    const cells = rasterizeFootprint(x, z, footprint, grid);
    if (cells.length === 0) {
      reasons.push('empty_footprint');
    }

    const blockingLayers = this.conflictMatrix[footprint.layer] ?? [footprint.layer];
    /** @type {Map<string, import('../domain/types.js').PlacementConflict>} */
    const byId = new Map();

    for (const layer of blockingLayers) {
      for (const hit of this.occupancy.queryCells(layer, cells, { excludeId })) {
        const key = `${hit.layer}:${hit.entityId}`;
        if (!byId.has(key)) byId.set(key, hit);
      }
    }

    for (const hit of byId.values()) {
      conflicts.push(hit);
    }
    if (conflicts.length > 0) {
      reasons.push('layer_conflict');
    }

    return {
      ok: reasons.length === 0,
      reasons,
      conflicts
    };
  }
}
