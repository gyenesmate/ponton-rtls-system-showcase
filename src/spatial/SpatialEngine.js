/**
 * Facade over grid config, occupancy, placement validation, and incremental edits (Three-free).
 * @module spatial/SpatialEngine
 */

import { GridConfig } from './GridConfig.js';
import { OccupancyIndex } from './OccupancyIndex.js';
import { PlacementValidator } from './PlacementValidator.js';
import { parseCellKey } from './gridMath.js';
import { isIndexableEntity, indexableEntities } from '../domain/warehouseDocument.js';

/**
 * @typedef {Object} SpatialDirtySet
 * @property {string[]} entityIds
 * @property {{ minCol: number, maxCol: number, minRow: number, maxRow: number }|null} cellBounds
 */

/**
 * @typedef {Object} SpatialEditResult
 * @property {boolean} ok
 * @property {string[]} reasons
 * @property {import('../domain/types.js').PlacementConflict[]} conflicts
 * @property {import('../domain/types.js').EntityBase} [entity]
 * @property {SpatialDirtySet} [dirty]
 */

export class SpatialEngine {
  /**
   * @param {import('../domain/types.js').GridConfig|GridConfig} grid
   * @param {{
   *   entities?: import('../domain/types.js').EntityBase[],
   *   document?: import('../domain/types.js').WarehouseDocument|null,
   *   debug?: boolean
   * }} [options]
   */
  constructor(grid, { entities = [], document = null, debug = false } = {}) {
    this.grid = grid instanceof GridConfig ? grid : new GridConfig(grid);
    this.debug = debug;
    /** @type {import('../domain/types.js').WarehouseDocument|null} */
    this.document = document;
    this.occupancy = OccupancyIndex.fromEntities(this.grid, entities);
    this.validator = new PlacementValidator(this.occupancy);
    /** @type {Set<string>} */
    this._dirtyEntityIds = new Set();
    /** @type {Set<string>} */
    this._dirtyCellKeys = new Set();
  }

  /**
   * @param {{ width?: number, depth?: number }} warehouse
   * @param {number} [cellSize]
   * @param {import('../domain/types.js').EntityBase[]} [entities]
   * @param {{ debug?: boolean, document?: import('../domain/types.js').WarehouseDocument|null }} [options]
   */
  static fromWarehouse(warehouse, cellSize, entities = [], options = {}) {
    return new SpatialEngine(GridConfig.fromWarehouse(warehouse, cellSize), {
      entities,
      ...options
    });
  }

  /**
   * Bind a live WarehouseDocument (mutations write through this reference).
   * @param {import('../domain/types.js').WarehouseDocument} document
   * @param {{ debug?: boolean }} [options]
   */
  static fromDocument(document, options = {}) {
    if (!document?.grid) {
      throw new Error('SpatialEngine.fromDocument requires document.grid');
    }
    return new SpatialEngine(document.grid, {
      entities: indexableEntities(document.entities || []),
      document,
      ...options
    });
  }

  /**
   * Rebuild occupancy from a full entity list (document load / cellSize change).
   * @param {import('../domain/types.js').EntityBase[]} entities
   */
  rebuild(entities) {
    this.occupancy = OccupancyIndex.fromEntities(this.grid, entities);
    this.validator = new PlacementValidator(this.occupancy);
    this._dirtyEntityIds.clear();
    this._dirtyCellKeys.clear();
  }

  /**
   * @param {number} x
   * @param {number} z
   * @param {import('../domain/types.js').FootprintSpec} footprint
   * @param {{ excludeId?: string }} [options]
   * @returns {import('../domain/types.js').PlacementValidationResult}
   */
  validatePlacement(x, z, footprint, options = {}) {
    const result = this.validator.validate(x, z, footprint, options);
    if (this.debug && !result.ok) {
      console.debug('[SpatialEngine] placement rejected', { x, z, footprint, result });
    }
    return result;
  }

  /**
   * @param {string} entityId
   * @returns {{ layer: import('../domain/types.js').SpatialLayer, cells: string[] }|undefined}
   */
  getEntityCells(entityId) {
    return this.occupancy.entityCells.get(entityId);
  }

  /**
   * @param {import('../domain/types.js').EntityBase} entity
   * @returns {SpatialEditResult}
   */
  addEntity(entity) {
    const docError = this._requireDocument();
    if (docError) return docError;

    if (!entity?.id) {
      return this._reject(['missing_id']);
    }
    if (this.document.entities.some((e) => e.id === entity.id)) {
      return this._reject(['duplicate_id']);
    }

    const next = cloneEntity(entity);
    const validation = this._validateEntityPose(next);
    if (!validation.ok) {
      return this._reject(validation.reasons, validation.conflicts);
    }

    this.document.entities.push(next);
    if (isIndexableEntity(next)) {
      const cells = this.occupancy.addEntity(next);
      this._markDirty(next.id, cells);
    } else {
      this._markDirty(next.id, []);
    }

    return this._accept(next);
  }

  /**
   * @param {string} entityId
   * @param {{ x?: number, z?: number, y?: number, yaw?: number, footprint?: import('../domain/types.js').FootprintSpec }} patch
   * @returns {SpatialEditResult}
   */
  moveEntity(entityId, patch = {}) {
    const docError = this._requireDocument();
    if (docError) return docError;

    const index = this.document.entities.findIndex((e) => e.id === entityId);
    if (index < 0) {
      return this._reject(['not_found']);
    }

    const current = this.document.entities[index];
    const previousCells = this.getEntityCells(entityId)?.cells?.slice() ?? [];

    const next = cloneEntity(current);
    if (patch.x != null) next.x = patch.x;
    if (patch.z != null) next.z = patch.z;
    if (patch.y != null) next.y = patch.y;
    if (patch.footprint) {
      next.footprint = { ...next.footprint, ...clonePlain(patch.footprint) };
    } else if (patch.yaw != null && next.footprint) {
      next.footprint = { ...next.footprint, yaw: patch.yaw };
    }

    const validation = this._validateEntityPose(next, { excludeId: entityId });
    if (!validation.ok) {
      return this._reject(validation.reasons, validation.conflicts);
    }

    // Commit only after validation succeeds.
    this.document.entities[index] = next;
    if (isIndexableEntity(next)) {
      const cells = this.occupancy.addEntity(next); // remove+readd via OccupancyIndex
      this._markDirty(entityId, [...previousCells, ...cells]);
    } else {
      this.occupancy.removeEntity(entityId);
      this._markDirty(entityId, previousCells);
    }

    return this._accept(next);
  }

  /**
   * @param {string} entityId
   * @returns {SpatialEditResult}
   */
  removeEntity(entityId) {
    const docError = this._requireDocument();
    if (docError) return docError;

    const index = this.document.entities.findIndex((e) => e.id === entityId);
    if (index < 0) {
      return this._reject(['not_found']);
    }

    const [removed] = this.document.entities.splice(index, 1);
    const previousCells = this.getEntityCells(entityId)?.cells?.slice() ?? [];
    this.occupancy.removeEntity(entityId);
    this._markDirty(entityId, previousCells);

    return this._accept(removed);
  }

  /**
   * Return and clear accumulated dirty flags for renderers.
   * @returns {SpatialDirtySet}
   */
  consumeDirty() {
    const entityIds = [...this._dirtyEntityIds];
    const cellBounds = boundsFromKeys(this._dirtyCellKeys);
    this._dirtyEntityIds.clear();
    this._dirtyCellKeys.clear();
    return { entityIds, cellBounds };
  }

  /** @returns {SpatialDirtySet} */
  peekDirty() {
    return {
      entityIds: [...this._dirtyEntityIds],
      cellBounds: boundsFromKeys(this._dirtyCellKeys)
    };
  }

  _requireDocument() {
    if (!this.document) {
      return this._reject(['no_document']);
    }
    if (!Array.isArray(this.document.entities)) {
      this.document.entities = [];
    }
    return null;
  }

  /**
   * @param {import('../domain/types.js').EntityBase} entity
   * @param {{ excludeId?: string }} [options]
   */
  _validateEntityPose(entity, options = {}) {
    if (!isIndexableEntity(entity)) {
      return { ok: true, reasons: [], conflicts: [] };
    }
    return this.validatePlacement(entity.x, entity.z, entity.footprint, options);
  }

  /**
   * @param {string} entityId
   * @param {Iterable<string>} cells
   */
  _markDirty(entityId, cells) {
    this._dirtyEntityIds.add(entityId);
    for (const key of cells) {
      this._dirtyCellKeys.add(key);
    }
  }

  /**
   * @param {import('../domain/types.js').EntityBase} entity
   * @returns {SpatialEditResult}
   */
  _accept(entity) {
    return {
      ok: true,
      reasons: [],
      conflicts: [],
      entity,
      dirty: this.peekDirty()
    };
  }

  /**
   * @param {string[]} reasons
   * @param {import('../domain/types.js').PlacementConflict[]} [conflicts]
   * @returns {SpatialEditResult}
   */
  _reject(reasons, conflicts = []) {
    if (this.debug) {
      console.debug('[SpatialEngine] edit rejected', { reasons, conflicts });
    }
    return { ok: false, reasons, conflicts };
  }
}

function cloneEntity(entity) {
  return clonePlain(entity);
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * @param {Iterable<string>} keys
 * @returns {{ minCol: number, maxCol: number, minRow: number, maxRow: number }|null}
 */
function boundsFromKeys(keys) {
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;
  let any = false;
  for (const key of keys) {
    const { col, row } = parseCellKey(key);
    if (!Number.isFinite(col) || !Number.isFinite(row)) continue;
    any = true;
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  }
  return any ? { minCol, maxCol, minRow, maxRow } : null;
}
