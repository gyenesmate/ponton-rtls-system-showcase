/**
 * Versioned warehouse document helpers (Three-free).
 * @module domain/warehouseDocument
 */

import { WAREHOUSE_DOCUMENT_VERSION, DEFAULT_SPATIAL_CELL_SIZE } from './types.js';
import { GridConfig } from '../spatial/GridConfig.js';

/**
 * @param {object} [props]
 * @returns {import('./types.js').WarehouseDocument}
 */
export function createWarehouseDocument({
  id = 'warehouse',
  orientationY = 0,
  warehouse = {},
  cellSize = DEFAULT_SPATIAL_CELL_SIZE,
  grid = null,
  entities = [],
  routes = [],
  intersections = [],
  meta = {}
} = {}) {
  const resolvedGrid = grid
    ? grid instanceof GridConfig
      ? grid.toJSON()
      : { ...grid }
    : GridConfig.fromWarehouse(warehouse, cellSize).toJSON();

  return {
    version: WAREHOUSE_DOCUMENT_VERSION,
    id,
    orientationY,
    grid: resolvedGrid,
    warehouse: { ...warehouse },
    entities: entities.map((e) => clonePlain(e)),
    routes: routes.map((r) => clonePlain(r)),
    intersections: intersections.map((i) => clonePlain(i)),
    meta: clonePlain(meta)
  };
}

/**
 * Deep clone via JSON (documents are plain data only).
 * @param {import('./types.js').WarehouseDocument} doc
 */
export function cloneWarehouseDocument(doc) {
  return clonePlain(doc);
}

/**
 * Migrate older document versions toward current.
 * @param {object} doc
 * @returns {import('./types.js').WarehouseDocument}
 */
export function migrateWarehouseDocument(doc) {
  if (!doc || typeof doc !== 'object') {
    throw new Error('migrateWarehouseDocument: expected document object');
  }

  const next = clonePlain(doc);
  if (next.version == null) next.version = 1;

  if (next.version > WAREHOUSE_DOCUMENT_VERSION) {
    throw new Error(
      `WarehouseDocument version ${next.version} is newer than supported ${WAREHOUSE_DOCUMENT_VERSION}`
    );
  }

  // v1 is current — no field transforms yet.
  next.version = WAREHOUSE_DOCUMENT_VERSION;
  if (!Array.isArray(next.entities)) next.entities = [];
  if (!Array.isArray(next.routes)) next.routes = [];
  if (!Array.isArray(next.intersections)) next.intersections = [];
  if (!next.meta) next.meta = {};
  if (!next.warehouse) next.warehouse = {};
  if (!next.grid) {
    next.grid = GridConfig.fromWarehouse(next.warehouse, DEFAULT_SPATIAL_CELL_SIZE).toJSON();
  }

  return next;
}

/**
 * @param {import('./types.js').EntityBase|object} entity
 */
export function isIndexableEntity(entity) {
  const w = entity?.footprint?.width ?? 0;
  const d = entity?.footprint?.depth ?? 0;
  return w > 0 && d > 0 && Boolean(entity.footprint?.layer);
}

/**
 * Entities that should be indexed by OccupancyIndex / SpatialEngine.
 * @param {import('./types.js').EntityBase[]} entities
 */
export function indexableEntities(entities = []) {
  return entities.filter(isIndexableEntity);
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
