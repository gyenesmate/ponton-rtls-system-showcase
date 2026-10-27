/**
 * Phase 4 site ↔ document round-trip self-check.
 * Run via: npm run check:spatial
 */
import { toDocument, toSite } from '../siteAdapter.js';
import { cloneWarehouseDocument, migrateWarehouseDocument, indexableEntities } from '../warehouseDocument.js';
import { SpatialEngine } from '../../spatial/SpatialEngine.js';
import { defaultWarehouseSite } from '../../scenarios/sites/defaultWarehouseSite.js';
import { developerScenario } from '../../scenarios/developer.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function nearly(a, b, eps = 1e-9) {
  return Math.abs(a - b) < eps;
}

const site = defaultWarehouseSite;
const doc = toDocument(site, { id: 'default' });
const back = toSite(doc);

assert(doc.version === 1, 'document version 1');
assert(doc.grid.cols === 22 && doc.grid.rows === 15, 'grid dims');
assert(doc.entities.filter((e) => e.kind === 'machine').length === site.machines.length, 'machines → entities');
assert(doc.entities.filter((e) => e.kind === 'wall').length === site.interiorWalls.length, 'walls → entities');
assert(doc.entities.filter((e) => e.kind === 'anchor').length === site.infrastructure.anchors.length, 'anchors');
assert(doc.entities.filter((e) => e.kind === 'agentTemplate').length === site.objects.length, 'objects');

assert(back.machines.length === site.machines.length, 'round-trip machine count');
site.machines.forEach((m, i) => {
  const b = back.machines[i];
  assert(nearly(b.x, m.x) && nearly(b.z, m.z), `machine ${i} pose`);
  assert(nearly(b.sx, m.sx) && nearly(b.sz, m.sz) && nearly(b.sy, m.sy), `machine ${i} size`);
});

assert(back.interiorWalls.length === site.interiorWalls.length, 'round-trip walls');
site.interiorWalls.forEach((w, i) => {
  const b = back.interiorWalls[i];
  assert(
    nearly(b.x1, w.x1) && nearly(b.z1, w.z1) && nearly(b.x2, w.x2) && nearly(b.z2, w.z2),
    `wall ${i} segment`
  );
});

assert(back.infrastructure.anchors.length === site.infrastructure.anchors.length, 'round-trip anchors');
assert(
  back.infrastructure.controlUnderAnchorId === site.infrastructure.controlUnderAnchorId,
  'controlUnderAnchorId'
);
site.infrastructure.anchors.forEach((a, i) => {
  const b = back.infrastructure.anchors[i];
  assert(b.id === a.id && nearly(b.x, a.x) && nearly(b.z, a.z) && b.wall === a.wall, `anchor ${i}`);
});

assert(back.routes.length === site.routes.length, 'routes');
assert(back.routes.every((r, i) => r.id === site.routes[i].id), 'route ids');
assert(back.objects.length === site.objects.length, 'objects');
assert(back.objects.every((o, i) => o.id === site.objects[i].id), 'object ids');
assert(back.intersections.length === site.intersections.length, 'intersections');

const engine = SpatialEngine.fromWarehouse(
  doc.warehouse,
  doc.grid.cellSize,
  indexableEntities(doc.entities)
);
const machineCount = doc.entities.filter((e) => e.kind === 'machine').length;
assert(
  [...engine.occupancy.entityCells.keys()].filter((id) => id.startsWith('machine-')).length ===
    machineCount,
  'engine indexes machines'
);

const cloned = cloneWarehouseDocument(doc);
cloned.id = 'cloned';
assert(cloned.id === 'cloned' && doc.id === 'default', 'clone is independent');

const migrated = migrateWarehouseDocument({ warehouse: { width: 10, depth: 10 }, entities: [] });
assert(migrated.version === 1 && migrated.grid.cols > 0, 'migrate fills grid');

// Developer empty site round-trips without throw
const emptyDoc = toDocument(developerScenario.site, { id: 'developer' });
const emptySite = toSite(emptyDoc);
assert(emptySite.machines.length === 0, 'developer machines empty');
assert(emptySite.interiorWalls.length === 0, 'developer walls empty');
assert(emptySite.objects.length === 0, 'developer objects empty');

if (!process.exitCode) {
  console.log('siteAdapter.selfcheck: ok');
}
