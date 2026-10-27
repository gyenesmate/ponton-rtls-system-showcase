import { rasterizeFootprint } from './footprint.ts';
import {
  SPATIAL_LAYERS,
  type EntityBase,
  type FootprintSpec,
  type GridConfigData,
  type PlacementConflict,
  type SpatialLayer
} from './types.ts';

interface EntityCellRecord {
  layer: SpatialLayer;
  cells: string[];
}

export class OccupancyIndex {
  readonly grid: GridConfigData;
  readonly layers: Record<SpatialLayer, Map<string, Set<string>>>;
  readonly entityCells = new Map<string, EntityCellRecord>();

  constructor(grid: GridConfigData) {
    this.grid = grid;
    this.layers = Object.fromEntries(
      SPATIAL_LAYERS.map((layer) => [layer, new Map<string, Set<string>>()])
    ) as Record<SpatialLayer, Map<string, Set<string>>>;
  }

  clear(): void {
    for (const layer of SPATIAL_LAYERS) this.layers[layer].clear();
    this.entityCells.clear();
  }

  addEntity(entity: EntityBase): string[] {
    if (!entity?.id || !entity.footprint?.layer) {
      throw new Error('OccupancyIndex.addEntity requires id and footprint.layer');
    }
    this.removeEntity(entity.id);
    const layer = entity.footprint.layer;
    const cells = rasterizeFootprint(entity.x, entity.z, entity.footprint, this.grid);
    const layerMap = this.layers[layer];
    if (!layerMap) throw new Error(`Unknown spatial layer: ${layer}`);

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

  removeEntity(entityId: string): boolean {
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

  getCell(layer: SpatialLayer, key: string): Set<string> {
    return this.layers[layer]?.get(key) ?? new Set();
  }

  queryCells(
    layer: SpatialLayer,
    cells: Iterable<string>,
    { excludeId }: { excludeId?: string } = {}
  ): PlacementConflict[] {
    const layerMap = this.layers[layer];
    if (!layerMap) return [];
    const found = new Map<string, PlacementConflict>();
    for (const key of cells) {
      for (const id of layerMap.get(key) ?? []) {
        if (id !== excludeId && !found.has(id)) found.set(id, { entityId: id, layer });
      }
    }
    return [...found.values()];
  }

  findConflicts(
    x: number,
    z: number,
    footprint: FootprintSpec,
    options: { excludeId?: string } = {}
  ): PlacementConflict[] {
    return this.queryCells(
      footprint.layer,
      rasterizeFootprint(x, z, footprint, this.grid),
      options
    );
  }

  static fromEntities(grid: GridConfigData, entities: EntityBase[]): OccupancyIndex {
    const index = new OccupancyIndex(grid);
    for (const entity of entities) index.addEntity(entity);
    return index;
  }
}
