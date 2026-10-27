import { GridConfig } from './grid-config.ts';
import {
  DEFAULT_SPATIAL_CELL_SIZE,
  WAREHOUSE_DOCUMENT_VERSION,
  type EntityBase,
  type GridConfigData,
  type WarehouseDocument
} from './types.ts';

interface CreateDocumentProps {
  id?: string;
  orientationY?: number;
  warehouse?: Record<string, unknown>;
  cellSize?: number;
  grid?: GridConfigData | GridConfig | null;
  entities?: EntityBase[];
  routes?: Record<string, unknown>[];
  intersections?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}

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
}: CreateDocumentProps = {}): WarehouseDocument {
  const resolvedGrid = grid
    ? grid instanceof GridConfig
      ? grid.toJSON()
      : { ...grid }
    : GridConfig.fromWarehouse(warehouse as { width?: number; depth?: number }, cellSize).toJSON();

  return {
    version: WAREHOUSE_DOCUMENT_VERSION,
    id,
    orientationY,
    grid: resolvedGrid,
    warehouse: { ...warehouse },
    entities: entities.map(clonePlain),
    routes: routes.map(clonePlain),
    intersections: intersections.map(clonePlain),
    meta: clonePlain(meta)
  };
}

export function cloneWarehouseDocument(doc: WarehouseDocument): WarehouseDocument {
  return clonePlain(doc);
}

export function migrateWarehouseDocument(doc: Partial<WarehouseDocument>): WarehouseDocument {
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
  next.version = WAREHOUSE_DOCUMENT_VERSION;
  if (!Array.isArray(next.entities)) next.entities = [];
  if (!Array.isArray(next.routes)) next.routes = [];
  if (!Array.isArray(next.intersections)) next.intersections = [];
  if (!next.meta) next.meta = {};
  if (!next.warehouse) next.warehouse = {};
  if (!next.grid) {
    next.grid = GridConfig.fromWarehouse(
      next.warehouse as { width?: number; depth?: number },
      DEFAULT_SPATIAL_CELL_SIZE
    ).toJSON();
  }
  return next as WarehouseDocument;
}

export function isIndexableEntity(entity: Partial<EntityBase> | null | undefined): entity is EntityBase {
  const width = entity?.footprint?.width ?? 0;
  const depth = entity?.footprint?.depth ?? 0;
  return width > 0 && depth > 0 && Boolean(entity?.footprint?.layer);
}

export function indexableEntities(entities: EntityBase[] = []): EntityBase[] {
  return entities.filter(isIndexableEntity);
}

function clonePlain<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value)) as T;
}
