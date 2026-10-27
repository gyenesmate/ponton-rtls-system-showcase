import { DEFAULT_SPATIAL_CELL_SIZE, type EntityBase, type WarehouseDocument } from './types.ts';
import { createWarehouseDocument, migrateWarehouseDocument } from './warehouse-document.ts';

type LegacyRecord = Record<string, any>;

export const DEFAULT_INTERIOR_WALL_THICKNESS = 0.2;
const ANCHOR_FOOTPRINT_M = 0.3;

export function toDocument(
  site: LegacyRecord,
  { id = 'site', wallThickness = DEFAULT_INTERIOR_WALL_THICKNESS }: {
    id?: string;
    wallThickness?: number;
  } = {}
): WarehouseDocument {
  if (!site || typeof site !== 'object') {
    throw new Error('siteAdapter.toDocument requires a site object');
  }

  const cellSize = site.grid?.cellSize ?? DEFAULT_SPATIAL_CELL_SIZE;
  const entities: EntityBase[] = [];
  (site.machines || []).forEach((machine: LegacyRecord, index: number) => {
    entities.push({
      id: machine.id || `machine-${index}`,
      kind: 'machine',
      x: machine.x,
      z: machine.z,
      y: 0,
      model: machine.model,
      footprint: {
        width: machine.sx,
        depth: machine.sz,
        height: machine.sy,
        yaw: machine.yaw ?? 0,
        layer: 'obstacle',
        blocksNavigation: true
      }
    });
  });
  (site.interiorWalls || []).forEach((segment: LegacyRecord, index: number) => {
    entities.push(wallEntityFromSegment(segment, index, wallThickness));
  });
  (site.zones || []).forEach((zone: LegacyRecord, index: number) => {
    entities.push({
      id: zone.id || `zone-${index}`,
      kind: 'zone',
      x: zone.x,
      z: zone.z,
      y: 0,
      footprint: {
        width: zone.width ?? (zone.radius != null ? zone.radius * 2 : 6),
        depth: zone.depth ?? (zone.radius != null ? zone.radius * 2 : 6),
        yaw: zone.yaw ?? 0,
        layer: 'zone',
        blocksNavigation: zone.restricted === true || zone.blocksNavigation === true
      },
      zone: { ...zone }
    });
  });
  (site.infrastructure?.anchors || []).forEach((anchor: LegacyRecord, index: number) => {
    entities.push({
      id: anchor.id || `anchor-${index}`,
      kind: 'anchor',
      x: anchor.x,
      z: anchor.z,
      y: anchor.y,
      footprint: {
        width: ANCHOR_FOOTPRINT_M,
        depth: ANCHOR_FOOTPRINT_M,
        height: 0.2,
        layer: 'infrastructure'
      },
      wall: anchor.wall,
      anchor: { ...anchor }
    });
  });
  (site.objects || []).forEach((object: LegacyRecord, index: number) => {
    entities.push({
      id: object.id || `agent-${index}`,
      kind: 'agentTemplate',
      x: 0,
      z: 0,
      y: 0,
      model: object.model,
      footprint: { width: 0, depth: 0, layer: 'reservation' },
      agent: { ...object }
    });
  });

  return createWarehouseDocument({
    id,
    orientationY: site.orientationY ?? 0,
    warehouse: site.warehouse || {},
    cellSize,
    entities,
    routes: site.routes || [],
    intersections: site.intersections || [],
    meta: {
      siteGrid: { ...(site.grid || {}) },
      infrastructure: {
        controlUnderAnchorId: site.infrastructure?.controlUnderAnchorId ?? null
      }
    }
  });
}

export function toSite(document: WarehouseDocument | Partial<WarehouseDocument>): LegacyRecord {
  const doc = migrateWarehouseDocument(document);
  const machines: LegacyRecord[] = [];
  const interiorWalls: LegacyRecord[] = [];
  const zones: LegacyRecord[] = [];
  const anchors: LegacyRecord[] = [];
  const objects: LegacyRecord[] = [];

  for (const entity of doc.entities) {
    switch (entity.kind) {
      case 'machine':
        machines.push({
          ...(entity.model ? { model: entity.model } : {}),
          x: entity.x,
          z: entity.z,
          sx: entity.footprint?.width,
          sy: entity.footprint?.height ?? 2.3,
          sz: entity.footprint?.depth,
          ...(entity.footprint?.yaw ? { yaw: entity.footprint.yaw } : {})
        });
        break;
      case 'wall':
        if (entity.segment) interiorWalls.push({ ...(entity.segment as LegacyRecord) });
        break;
      case 'zone':
        zones.push(entity.zone ? { ...(entity.zone as LegacyRecord) } : zoneFromEntity(entity));
        break;
      case 'anchor':
        anchors.push(entity.anchor
          ? { ...(entity.anchor as LegacyRecord) }
          : { id: entity.id, x: entity.x, y: entity.y, z: entity.z, wall: entity.wall });
        break;
      case 'agentTemplate':
        objects.push(entity.agent
          ? { ...(entity.agent as LegacyRecord) }
          : { id: entity.id, model: entity.model });
        break;
    }
  }

  const meta = doc.meta as LegacyRecord | undefined;
  const siteGrid = { ...(meta?.siteGrid || {}) };
  if (siteGrid.cellSize == null) siteGrid.cellSize = doc.grid.cellSize;
  return {
    orientationY: doc.orientationY ?? 0,
    warehouse: { ...doc.warehouse },
    grid: siteGrid,
    interiorWalls,
    machines,
    zones,
    infrastructure: {
      controlUnderAnchorId: meta?.infrastructure?.controlUnderAnchorId ?? null,
      anchors
    },
    routes: doc.routes.map((route: LegacyRecord) => ({
      ...route,
      points: (route.points || []).map((point: unknown[]) => [...point])
    })),
    intersections: (doc.intersections || []).map((intersection: LegacyRecord) => ({
      ...intersection,
      routeIds: intersection.routeIds ? [...intersection.routeIds] : intersection.routeIds
    })),
    objects
  };
}

export function wallEntityFromSegment(
  segment: LegacyRecord,
  index: number,
  thickness = DEFAULT_INTERIOR_WALL_THICKNESS
): EntityBase {
  const dx = segment.x2 - segment.x1;
  const dz = segment.z2 - segment.z1;
  return {
    id: `wall-${index}`,
    kind: 'wall',
    x: (segment.x1 + segment.x2) * 0.5,
    z: (segment.z1 + segment.z2) * 0.5,
    y: 0,
    footprint: {
      width: Math.hypot(dx, dz) || thickness,
      depth: thickness,
      height: 3,
      yaw: Math.atan2(dz, dx),
      layer: 'obstacle',
      blocksNavigation: true
    },
    segment: {
      x1: segment.x1,
      z1: segment.z1,
      x2: segment.x2,
      z2: segment.z2
    }
  };
}

function zoneFromEntity(entity: EntityBase): LegacyRecord {
  return {
    id: entity.id,
    x: entity.x,
    z: entity.z,
    width: entity.footprint?.width,
    depth: entity.footprint?.depth
  };
}
