import { SpatialEngine, indexableEntities, toDocument } from '../../src/core/grid';
import { defaultWarehouseSite } from '../../src/data/scenarios/sites/default-warehouse-site';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const site = defaultWarehouseSite;
const doc = toDocument(site, { id: 'default' });
const entities = indexableEntities(doc.entities).filter((entity) => entity.kind === 'machine');
const engine = SpatialEngine.fromWarehouse(site.warehouse, site.grid?.cellSize, entities);

assert(engine.getEntityCells('machine-0')?.cells.length, 'engine indexes machines');

const empty = engine.validatePlacement(0, -5.5, { width: 1, depth: 1, layer: 'obstacle' });
assert(empty.ok, `empty pose should be ok, got ${empty.reasons}`);
assert(empty.conflicts.length === 0, 'empty pose no conflicts');

const overlap = engine.validatePlacement(0, 0, { width: 12, depth: 5, layer: 'obstacle' });
assert(!overlap.ok, 'overlap should fail');
assert(overlap.reasons.includes('layer_conflict'), 'overlap reason layer_conflict');
assert(
  overlap.conflicts.some((conflict) => conflict.entityId === entities.find((entity) => entity.x === 0 && entity.z === 0)?.id),
  'overlap reports center machine id'
);

const near = engine.validatePlacement(-8, 0, { width: 2, depth: 2, clearance: 0, layer: 'obstacle' });
const nearPad = engine.validatePlacement(-8, 0, { width: 2, depth: 2, clearance: 4, layer: 'obstacle' });
assert(near.ok, `near-miss without clearance should be ok, got ${near.reasons}`);
assert(!nearPad.ok && nearPad.reasons.includes('layer_conflict'), 'large clearance hits center machine');

const zoneOverMachine = engine.validatePlacement(0, 0, { width: 12, depth: 5, layer: 'zone' });
assert(zoneOverMachine.ok, `zone over obstacle should be ok, got ${zoneOverMachine.reasons}`);
const zoneOverPath = engine.validatePlacement(0, -5.5, { width: 3, depth: 3, layer: 'zone' });
assert(zoneOverPath.ok, `zone over open path should be ok, got ${zoneOverPath.reasons}`);

const infra = engine.validatePlacement(0, 0, { width: 0.4, depth: 0.4, layer: 'infrastructure' });
assert(infra.ok, `infrastructure over obstacle should be ok, got ${infra.reasons}`);

const oob = engine.validatePlacement(-100, 0, { width: 2, depth: 2, layer: 'obstacle' });
assert(!oob.ok && oob.reasons.includes('out_of_bounds'), 'far west out of bounds');

const centerId = entities.find((entity) => entity.x === 0 && entity.z === 0)?.id;
const replaceSelf = engine.validatePlacement(0, 0, { width: 12, depth: 5, layer: 'obstacle' }, { excludeId: centerId });
assert(!replaceSelf.conflicts.some((conflict) => conflict.entityId === centerId), 'excludeId skips self conflict');

if (!process.exitCode) console.log('placement.selfcheck: ok');
