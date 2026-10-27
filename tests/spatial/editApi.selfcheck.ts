import { SpatialEngine, toDocument, type EntityBase } from '../../src/core/grid';
import { developerScenario } from '../../src/data/scenarios/developer';
import { defaultWarehouseSite } from '../../src/data/scenarios/sites/default-warehouse-site';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function machine(id: string, x: number, z: number, width = 2, depth = 2): EntityBase {
  return {
    id,
    kind: 'machine',
    x,
    z,
    footprint: {
      width,
      depth,
      height: 2.3,
      layer: 'obstacle',
      blocksNavigation: true
    }
  };
}

const emptyDoc = toDocument(developerScenario.site as Record<string, unknown>, { id: 'developer' });
const engine = SpatialEngine.fromDocument(emptyDoc);
const entityCount0 = emptyDoc.entities.length;

const placed = engine.addEntity(machine('m1', 0, -5.5));
assert(placed.ok, `place empty pose: ${placed.reasons}`);
assert(emptyDoc.entities.some((entity) => entity.id === 'm1'), 'document gained m1');
assert(engine.getEntityCells('m1')?.cells.length, 'm1 indexed');
assert(placed.dirty?.entityIds.includes('m1'), 'dirty includes m1');

const blocked = engine.addEntity(machine('m2', 0, -5.5));
assert(!blocked.ok, 'overlap should reject');
assert(blocked.reasons.includes('layer_conflict'), 'overlap reason');
assert(!emptyDoc.entities.some((entity) => entity.id === 'm2'), 'rejected add leaves document unchanged');
assert(emptyDoc.entities.length === entityCount0 + 1, 'entity count unchanged after reject');

const movedBad = engine.moveEntity('m1', { x: 100, z: 0 });
assert(!movedBad.ok && movedBad.reasons.includes('out_of_bounds'), 'bad move rejected');
assert(emptyDoc.entities.find((entity) => entity.id === 'm1')?.x === 0, 'rejected move leaves pose');

const moved = engine.moveEntity('m1', { x: 4, z: -5.5 });
assert(moved.ok, `move ok: ${moved.reasons}`);
assert(emptyDoc.entities.find((entity) => entity.id === 'm1')?.x === 4, 'document pose updated');
assert(engine.getEntityCells('m1')?.cells.length, 'moved cells indexed');

assert(engine.consumeDirty().entityIds.includes('m1'), 'consumeDirty has m1');
assert(engine.consumeDirty().entityIds.length === 0, 'consumeDirty clears');

const removed = engine.removeEntity('m1');
assert(removed.ok, 'remove ok');
assert(!emptyDoc.entities.some((entity) => entity.id === 'm1'), 'document lost m1');
assert(!engine.getEntityCells('m1'), 'occupancy cleared');

const fullDoc = toDocument(defaultWarehouseSite, { id: 'default' });
const full = SpatialEngine.fromDocument(fullDoc);
const before = fullDoc.entities.length;
const clash = full.addEntity(machine('intruder', 0, 0, 12, 5));
assert(!clash.ok, 'intruder on center rejected');
assert(fullDoc.entities.length === before, 'full doc unchanged on reject');

const free = full.addEntity(machine('gap', 0, -8, 1, 1));
assert(free.ok, `gap place: ${free.reasons}`);
assert(fullDoc.entities.length === before + 1, 'accepted add grows doc');

if (!process.exitCode) console.log('editApi.selfcheck: ok');
