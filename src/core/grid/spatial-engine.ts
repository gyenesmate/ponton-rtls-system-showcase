import { GridConfig } from './grid-config.ts';
import { parseCellKey } from './grid-math.ts';
import { OccupancyIndex } from './occupancy-index.ts';
import { PlacementValidator } from './placement-validator.ts';
import {
  type EntityBase,
  type FootprintSpec,
  type GridConfigData,
  type PlacementConflict,
  type PlacementValidationResult,
  type SpatialDirtySet,
  type SpatialEditResult,
  type WarehouseDocument
} from './types.ts';
import { indexableEntities, isIndexableEntity } from './warehouse-document.ts';

export class SpatialEngine {
  readonly grid: GridConfig;
  readonly debug: boolean;
  document: WarehouseDocument | null;
  occupancy: OccupancyIndex;
  validator: PlacementValidator;
  private readonly dirtyEntityIds = new Set<string>();
  private readonly dirtyCellKeys = new Set<string>();

  constructor(
    grid: GridConfigData | GridConfig,
    {
      entities = [],
      document = null,
      debug = false
    }: { entities?: EntityBase[]; document?: WarehouseDocument | null; debug?: boolean } = {}
  ) {
    this.grid = grid instanceof GridConfig ? grid : new GridConfig(grid);
    this.debug = debug;
    this.document = document;
    this.occupancy = OccupancyIndex.fromEntities(this.grid, entities);
    this.validator = new PlacementValidator(this.occupancy);
  }

  static fromWarehouse(
    warehouse: { width?: number; depth?: number },
    cellSize?: number,
    entities: EntityBase[] = [],
    options: { debug?: boolean; document?: WarehouseDocument | null } = {}
  ): SpatialEngine {
    return new SpatialEngine(GridConfig.fromWarehouse(warehouse, cellSize), { entities, ...options });
  }

  static fromDocument(
    document: WarehouseDocument,
    options: { debug?: boolean } = {}
  ): SpatialEngine {
    if (!document?.grid) throw new Error('SpatialEngine.fromDocument requires document.grid');
    return new SpatialEngine(document.grid, {
      entities: indexableEntities(document.entities || []),
      document,
      ...options
    });
  }

  rebuild(entities: EntityBase[]): void {
    this.occupancy = OccupancyIndex.fromEntities(this.grid, entities);
    this.validator = new PlacementValidator(this.occupancy);
    this.dirtyEntityIds.clear();
    this.dirtyCellKeys.clear();
  }

  validatePlacement(
    x: number,
    z: number,
    footprint: FootprintSpec,
    options: { excludeId?: string } = {}
  ): PlacementValidationResult {
    const result = this.validator.validate(x, z, footprint, options);
    if (this.debug && !result.ok) {
      console.debug('[SpatialEngine] placement rejected', { x, z, footprint, result });
    }
    return result;
  }

  getEntityCells(entityId: string) {
    return this.occupancy.entityCells.get(entityId);
  }

  addEntity(entity: EntityBase): SpatialEditResult {
    const docError = this.requireDocument();
    if (docError) return docError;
    const document = this.document!;
    if (!entity?.id) return this.reject(['missing_id']);
    if (document.entities.some((candidate) => candidate.id === entity.id)) {
      return this.reject(['duplicate_id']);
    }
    const next = clonePlain(entity);
    const validation = this.validateEntityPose(next);
    if (!validation.ok) return this.reject(validation.reasons, validation.conflicts);

    document.entities.push(next);
    const cells = isIndexableEntity(next) ? this.occupancy.addEntity(next) : [];
    this.markDirty(next.id, cells);
    return this.accept(next);
  }

  moveEntity(
    entityId: string,
    patch: {
      x?: number;
      z?: number;
      y?: number;
      yaw?: number;
      footprint?: Partial<FootprintSpec>;
    } = {}
  ): SpatialEditResult {
    const docError = this.requireDocument();
    if (docError) return docError;
    const document = this.document!;
    const index = document.entities.findIndex((entity) => entity.id === entityId);
    if (index < 0) return this.reject(['not_found']);

    const previousCells = this.getEntityCells(entityId)?.cells?.slice() ?? [];
    const next = clonePlain(document.entities[index]);
    if (patch.x != null) next.x = patch.x;
    if (patch.z != null) next.z = patch.z;
    if (patch.y != null) next.y = patch.y;
    if (patch.footprint) next.footprint = { ...next.footprint, ...clonePlain(patch.footprint) };
    else if (patch.yaw != null) next.footprint = { ...next.footprint, yaw: patch.yaw };

    const validation = this.validateEntityPose(next, { excludeId: entityId });
    if (!validation.ok) return this.reject(validation.reasons, validation.conflicts);
    document.entities[index] = next;
    if (isIndexableEntity(next)) {
      this.markDirty(entityId, [...previousCells, ...this.occupancy.addEntity(next)]);
    } else {
      this.occupancy.removeEntity(entityId);
      this.markDirty(entityId, previousCells);
    }
    return this.accept(next);
  }

  removeEntity(entityId: string): SpatialEditResult {
    const docError = this.requireDocument();
    if (docError) return docError;
    const document = this.document!;
    const index = document.entities.findIndex((entity) => entity.id === entityId);
    if (index < 0) return this.reject(['not_found']);
    const [removed] = document.entities.splice(index, 1);
    const previousCells = this.getEntityCells(entityId)?.cells?.slice() ?? [];
    this.occupancy.removeEntity(entityId);
    this.markDirty(entityId, previousCells);
    return this.accept(removed);
  }

  consumeDirty(): SpatialDirtySet {
    const dirty = this.peekDirty();
    this.dirtyEntityIds.clear();
    this.dirtyCellKeys.clear();
    return dirty;
  }

  peekDirty(): SpatialDirtySet {
    return {
      entityIds: [...this.dirtyEntityIds],
      cellBounds: boundsFromKeys(this.dirtyCellKeys)
    };
  }

  private requireDocument(): SpatialEditResult | null {
    if (!this.document) return this.reject(['no_document']);
    if (!Array.isArray(this.document.entities)) this.document.entities = [];
    return null;
  }

  private validateEntityPose(
    entity: EntityBase,
    options: { excludeId?: string } = {}
  ): PlacementValidationResult {
    if (!isIndexableEntity(entity)) return { ok: true, reasons: [], conflicts: [] };
    return this.validatePlacement(entity.x, entity.z, entity.footprint, options);
  }

  private markDirty(entityId: string, cells: Iterable<string>): void {
    this.dirtyEntityIds.add(entityId);
    for (const key of cells) this.dirtyCellKeys.add(key);
  }

  private accept(entity: EntityBase): SpatialEditResult {
    return { ok: true, reasons: [], conflicts: [], entity, dirty: this.peekDirty() };
  }

  private reject(reasons: string[], conflicts: PlacementConflict[] = []): SpatialEditResult {
    if (this.debug) console.debug('[SpatialEngine] edit rejected', { reasons, conflicts });
    return { ok: false, reasons, conflicts };
  }
}

function clonePlain<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value)) as T;
}

function boundsFromKeys(keys: Iterable<string>): SpatialDirtySet['cellBounds'] {
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;
  let any = false;
  for (const key of keys) {
    const { col, row } = parseCellKey(key);
    if (!Number.isFinite(col) || !Number.isFinite(row)) continue;
    any = true;
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
  }
  return any ? { minCol, maxCol, minRow, maxRow } : null;
}
