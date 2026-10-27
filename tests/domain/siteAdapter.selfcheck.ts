import {
  SpatialEngine,
  cloneWarehouseDocument,
  indexableEntities,
  migrateWarehouseDocument,
  toDocument,
  toSite
} from '../../src/core/grid';
import { defaultWarehouseSite } from '../../src/data/scenarios/sites/default-warehouse-site';
import { developerScenario } from '../../src/data/scenarios/developer';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function nearly(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

const site = defaultWarehouseSite;
const doc = toDocument(site, { id: 'default' });
const back = toSite(doc);

assert(doc.version === 1, 'document version 1');
assert(doc.grid.cols === 22 && doc.grid.rows === 15, 'grid dims');
assert(doc.entities.filter((entity) => entity.kind === 'machine').length === site.machines.length, 'machines → entities');
assert(doc.entities.filter((entity) => entity.kind === 'wall').length === site.interiorWalls.length, 'walls → entities');
assert(doc.entities.filter((entity) => entity.kind === 'anchor').length === site.infrastructure.anchors.length, 'anchors');
assert(doc.entities.filter((entity) => entity.kind === 'agentTemplate').length === site.objects.length, 'objects');

assert(back.machines.length === site.machines.length, 'round-trip machine count');
(site.machines as Array<Record<string, number>>).forEach((machine, index) => {
  const roundTrip = back.machines[index];
  assert(nearly(roundTrip.x, machine.x) && nearly(roundTrip.z, machine.z), `machine ${index} pose`);
  assert(nearly(roundTrip.sx, machine.sx) && nearly(roundTrip.sz, machine.sz) && nearly(roundTrip.sy, machine.sy), `machine ${index} size`);
});

assert(back.interiorWalls.length === site.interiorWalls.length, 'round-trip walls');
(site.interiorWalls as Array<Record<string, number>>).forEach((wall, index) => {
  const roundTrip = back.interiorWalls[index];
  assert(
    nearly(roundTrip.x1, wall.x1) &&
      nearly(roundTrip.z1, wall.z1) &&
      nearly(roundTrip.x2, wall.x2) &&
      nearly(roundTrip.z2, wall.z2),
    `wall ${index} segment`
  );
});

assert(back.infrastructure.anchors.length === site.infrastructure.anchors.length, 'round-trip anchors');
assert(back.infrastructure.controlUnderAnchorId === site.infrastructure.controlUnderAnchorId, 'controlUnderAnchorId');
(site.infrastructure.anchors as Array<Record<string, any>>).forEach((anchor, index) => {
  const roundTrip = back.infrastructure.anchors[index];
  assert(
    roundTrip.id === anchor.id &&
      nearly(roundTrip.x, anchor.x) &&
      nearly(roundTrip.z, anchor.z) &&
      roundTrip.wall === anchor.wall,
    `anchor ${index}`
  );
});

assert(back.routes.length === site.routes.length, 'routes');
assert(back.routes.every((route: any, index: number) => route.id === site.routes[index].id), 'route ids');
assert(back.objects.length === site.objects.length, 'objects');
assert(back.objects.every((object: any, index: number) => object.id === site.objects[index].id), 'object ids');
assert(back.intersections.length === site.intersections.length, 'intersections');

const engine = SpatialEngine.fromWarehouse(doc.warehouse, doc.grid.cellSize, indexableEntities(doc.entities));
const machineCount = doc.entities.filter((entity) => entity.kind === 'machine').length;
assert(
  [...engine.occupancy.entityCells.keys()].filter((id) => id.startsWith('machine-')).length === machineCount,
  'engine indexes machines'
);

const cloned = cloneWarehouseDocument(doc);
cloned.id = 'cloned';
assert(cloned.id === 'cloned' && doc.id === 'default', 'clone is independent');

const migrated = migrateWarehouseDocument({ warehouse: { width: 10, depth: 10 }, entities: [] });
assert(migrated.version === 1 && migrated.grid.cols > 0, 'migrate fills grid');

const developerSite = developerScenario.site as Record<string, any>;
const emptyDoc = toDocument(developerSite, { id: 'developer' });
const emptySite = toSite(emptyDoc);
assert(emptySite.machines.length === developerSite.machines.length, 'developer machines round-trip');
assert(emptySite.interiorWalls.length === 0, 'developer walls empty');
assert(emptySite.objects.length === 0, 'developer objects empty');

if (!process.exitCode) console.log('siteAdapter.selfcheck: ok');
