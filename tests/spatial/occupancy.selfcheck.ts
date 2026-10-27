import { GridConfig, OccupancyIndex, indexableEntities, toDocument } from '../../src/core/grid';
import { defaultWarehouseSite } from '../../src/data/scenarios/sites/default-warehouse-site';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const site = defaultWarehouseSite;
const doc = toDocument(site, { id: 'default' });
const grid = GridConfig.fromWarehouse(site.warehouse, site.grid?.cellSize);
const entities = indexableEntities(doc.entities).filter((entity) => entity.kind === 'machine');
const index = OccupancyIndex.fromEntities(grid, entities);

assert(entities.length === site.machines.length, 'entity count matches machines');
assert(index.entityCells.size === entities.length, 'all machines indexed');

const centerId = entities.find((entity) => entity.x === 0 && entity.z === 0)?.id;
assert(centerId, 'center machine present');
assert((index.entityCells.get(centerId)?.cells ?? []).length > 0, 'center machine has cells');

const emptyConflicts = index.findConflicts(0, -5.5, { width: 1, depth: 1, layer: 'obstacle' });
assert(emptyConflicts.length === 0, `empty pose should be free, got ${emptyConflicts.map((conflict) => conflict.entityId)}`);

const overlap = index.findConflicts(0, 0, { width: 12, depth: 5, layer: 'obstacle' });
assert(overlap.some((conflict) => conflict.entityId === centerId), 'overlap finds center machine');
assert(overlap.every((conflict) => conflict.layer === 'obstacle'), 'conflicts report obstacle layer');

const selfOnly = index.findConflicts(0, 0, { width: 12, depth: 5, layer: 'obstacle' }, { excludeId: centerId });
assert(!selfOnly.some((conflict) => conflict.entityId === centerId), 'excludeId skips self');

index.addEntity({
  id: 'zone-test',
  kind: 'zone',
  x: 0,
  z: 0,
  footprint: { width: 12, depth: 5, layer: 'zone' }
});
assert(
  index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'obstacle' }).every((conflict) => conflict.entityId !== 'zone-test'),
  'zone not in obstacle conflicts'
);
assert(
  index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'zone' }).some((conflict) => conflict.entityId === 'zone-test'),
  'zone query finds zone'
);

assert(index.removeEntity('zone-test'), 'remove zone');
assert(!index.entityCells.has('zone-test'), 'zone unindexed');
assert(index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'zone' }).length === 0, 'zone gone');

const occupiedKeys = index.layers.obstacle.size;
assert(occupiedKeys > 0 && occupiedKeys < grid.cols * grid.rows, 'sparse obstacle map');

if (!process.exitCode) console.log('occupancy.selfcheck: ok');
