/**
 * Sparse multi-layer occupancy index (Three-free).
 * @module spatial/OccupancyIndex
 */

import { SPATIAL_LAYERS } from '../domain/types.js';
import { rasterizeFootprint } from './Footprint.js';

/**
 * @typedef {{ layer: import('../domain/types.js').SpatialLayer, cells: string[] }} EntityCellRecord
 */

export class OccupancyIndex {
  /**
   * @param {import('../domain/types.js').GridConfig} grid
   */
  constructor(grid) {
    this.grid = grid;
    /** @type {Record<string, Map<string, Set<string>>>} */
    this.layers = Object.fromEntries(SPATIAL_LAYERS.map((layer) => [layer, new Map()]));
    /** @type {Map<string, EntityCellRecord>} */
    this.entityCells = new Map();
  }

  clear() {
    for (const layer of SPATIAL_LAYERS) {
      this.layers[layer].clear();
    }
    this.entityCells.clear();
  }

  /**
   * @param {import('../domain/types.js').EntityBase} entity
   * @returns {string[]}
   */
  addEntity(entity) {
    if (!entity?.id || !entity.footprint?.layer) {
      throw new Error('OccupancyIndex.addEntity requires id and footprint.layer');
    }
    this.removeEntity(entity.id);

    const layer = entity.footprint.layer;
    const cells = rasterizeFootprint(entity.x, entity.z, entity.footprint, this.grid);
    const layerMap = this.layers[layer];
    if (!layerMap) {
      throw new Error(`Unknown spatial layer: ${layer}`);
    }

    for (const key of cells) {
      let set = layerMap.get(key);
      if (!set) {
        set = new Set();
        layerMap.set(key, set);
      }
      set.add(entity.id);
    }

    this.entityCells.set(entity.id, { layer, cells: cells.slice() });
    return cells;
  }

  /**
   * @param {string} entityId
   * @returns {boolean} true if the entity was indexed
   */
  removeEntity(entityId) {
    const record = this.entityCells.get(entityId);
    if (!record) return false;

    const layerMap = this.layers[record.layer];
    for (const key of record.cells) {
      const set = layerMap.get(key);
      if (!set) continue;
      set.delete(entityId);
      if (set.size === 0) layerMap.delete(key);
    }
    this.entityCells.delete(entityId);
    return true;
  }

  /**
   * @param {import('../domain/types.js').SpatialLayer} layer
   * @param {string} cellKey
   * @returns {Set<string>}
   */
  getCell(layer, cellKey) {
    return this.layers[layer]?.get(cellKey) ?? new Set();
  }

  /**
   * Entities on `layer` that occupy any of `cells`.
   *
   * @param {import('../domain/types.js').SpatialLayer} layer
   * @param {Iterable<string>} cells
   * @param {{ excludeId?: string }} [options]
   * @returns {{ entityId: string, layer: import('../domain/types.js').SpatialLayer }[]}
   */
  queryCells(layer, cells, { excludeId } = {}) {
    const layerMap = this.layers[layer];
    if (!layerMap) return [];

    /** @type {Map<string, { entityId: string, layer: import('../domain/types.js').SpatialLayer }>} */
    const found = new Map();
    for (const key of cells) {
      const set = layerMap.get(key);
      if (!set) continue;
      for (const id of set) {
        if (excludeId && id === excludeId) continue;
        if (!found.has(id)) found.set(id, { entityId: id, layer });
      }
    }
    return [...found.values()];
  }

  /**
   * Same-layer conflicts for a candidate pose (does not mutate the index).
   *
   * @param {number} x
   * @param {number} z
   * @param {import('../domain/types.js').FootprintSpec} footprint
   * @param {{ excludeId?: string }} [options]
   */
  findConflicts(x, z, footprint, { excludeId } = {}) {
    const cells = rasterizeFootprint(x, z, footprint, this.grid);
    return this.queryCells(footprint.layer, cells, { excludeId });
  }

  /**
   * @param {import('../domain/types.js').GridConfig} grid
   * @param {import('../domain/types.js').EntityBase[]} entities
   */
  static fromEntities(grid, entities) {
    const index = new OccupancyIndex(grid);
    for (const entity of entities) {
      index.addEntity(entity);
    }
    return index;
  }
}
