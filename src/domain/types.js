/**
 * JSDoc contracts for the warehouse document + spatial engine.
 * Runtime: this module exports nothing of substance — types are documentation for IDEs/agents.
 * See docs/plans/rtls-showcase-spatial-grid.md
 *
 * @module domain/types
 */

/**
 * @typedef {Object} GridConfig
 * @property {number} cellSize   Meters per cell (default 2)
 * @property {number} originX    World X of cell (0,0) southwest corner (−width/2)
 * @property {number} originZ    World Z of cell (0,0) southwest corner (−depth/2)
 * @property {number} cols
 * @property {number} rows
 * @property {number} widthM     Warehouse width meters
 * @property {number} depthM     Warehouse depth meters
 */

/**
 * @typedef {'obstacle'|'navigation'|'zone'|'infrastructure'|'reservation'} SpatialLayer
 */

/**
 * @typedef {Object} FootprintSpec
 * @property {number} width
 * @property {number} depth
 * @property {number} [height]
 * @property {number} [yaw]           Radians about +Y
 * @property {number} [clearance]     Extra meters inflated for placement
 * @property {SpatialLayer} layer
 * @property {boolean} [blocksNavigation]
 */

/**
 * @typedef {'machine'|'shelf'|'wall'|'zone'|'anchor'|'light'|'agentTemplate'} EntityKind
 */

/**
 * @typedef {Object} EntityBase
 * @property {string} id
 * @property {EntityKind|string} kind
 * @property {number} x
 * @property {number} z
 * @property {number} [y]
 * @property {FootprintSpec} footprint
 * @property {string} [catalogId]
 * @property {string} [model]         GLB registry key (renderer only)
 */

/**
 * @typedef {Object} WarehouseDocument
 * @property {number} version
 * @property {string} id
 * @property {number} [orientationY]
 * @property {GridConfig} grid
 * @property {object} warehouse
 * @property {EntityBase[]} entities
 * @property {object[]} routes
 * @property {object[]} [intersections]
 * @property {object} [meta]
 */

/**
 * @typedef {Object} PlacementConflict
 * @property {string} entityId
 * @property {SpatialLayer} layer
 */

/**
 * @typedef {Object} PlacementValidationResult
 * @property {boolean} ok
 * @property {string[]} reasons
 * @property {PlacementConflict[]} conflicts
 */

/** Document format version for future migrations. */
export const WAREHOUSE_DOCUMENT_VERSION = 1;

/** Default cell size in meters (matches route snap / DEFAULT_CELL_SIZE). */
export const DEFAULT_SPATIAL_CELL_SIZE = 2;

/** Spatial layer ids used by OccupancyIndex. */
export const SPATIAL_LAYERS = Object.freeze([
  'obstacle',
  'navigation',
  'zone',
  'infrastructure',
  'reservation'
]);
