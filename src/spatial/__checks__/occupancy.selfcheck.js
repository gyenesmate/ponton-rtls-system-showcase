/**
 * Phase 2 OccupancyIndex self-check (default-site machines + overlap query).
 * Run via: npm run check:spatial
 */
import { GridConfig } from '../GridConfig.js';
import { OccupancyIndex } from '../OccupancyIndex.js';
import { toDocument } from '../../domain/siteAdapter.js';
import { indexableEntities } from '../../domain/warehouseDocument.js';
import { defaultWarehouseSite } from '../../scenarios/sites/defaultWarehouseSite.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const site = defaultWarehouseSite;
const doc = toDocument(site, { id: 'default' });
const grid = GridConfig.fromWarehouse(site.warehouse, site.grid?.cellSize);
const entities = indexableEntities(doc.entities).filter((e) => e.kind === 'machine');
const index = OccupancyIndex.fromEntities(grid, entities);

assert(entities.length === site.machines.length, 'entity count matches machines');
assert(index.entityCells.size === entities.length, 'all machines indexed');

// Center workstation (machine at 0,0 size 12×5) occupies origin neighborhood
const centerId = entities.find((e) => e.x === 0 && e.z === 0)?.id;
assert(centerId, 'center machine present');
const centerCells = index.entityCells.get(centerId)?.cells ?? [];
assert(centerCells.length > 0, 'center machine has cells');

// Empty pose far from machines — no obstacle conflicts
const emptyConflicts = index.findConflicts(
  0,
  -5.5,
  { width: 1, depth: 1, layer: 'obstacle' }
);
assert(emptyConflicts.length === 0, `empty pose should be free, got ${emptyConflicts.map((c) => c.entityId)}`);

// Overlap exact center machine pose → conflict with center (and only after exclude none)
const overlap = index.findConflicts(
  0,
  0,
  { width: 12, depth: 5, layer: 'obstacle' }
);
assert(overlap.some((c) => c.entityId === centerId), 'overlap finds center machine');
assert(overlap.every((c) => c.layer === 'obstacle'), 'conflicts report obstacle layer');

// Same pose excluding self → still may hit neighbors; excluding all indexed leaves none when querying own cells via exclude
const selfOnly = index.findConflicts(
  0,
  0,
  { width: 12, depth: 5, layer: 'obstacle' },
  { excludeId: centerId }
);
assert(!selfOnly.some((c) => c.entityId === centerId), 'excludeId skips self');

// Zone layer coexists: indexing a zone on same cells does not appear in obstacle query
index.addEntity({
  id: 'zone-test',
  kind: 'zone',
  x: 0,
  z: 0,
  footprint: { width: 12, depth: 5, layer: 'zone' }
});
const stillObstacle = index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'obstacle' });
assert(stillObstacle.every((c) => c.entityId !== 'zone-test'), 'zone not in obstacle conflicts');
const zoneHits = index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'zone' });
assert(zoneHits.some((c) => c.entityId === 'zone-test'), 'zone query finds zone');

// removeEntity clears sparse maps
assert(index.removeEntity('zone-test'), 'remove zone');
assert(!index.entityCells.has('zone-test'), 'zone unindexed');
assert(index.findConflicts(0, 0, { width: 1, depth: 1, layer: 'zone' }).length === 0, 'zone gone');

// Empty cells store nothing — obstacle map size << grid
const occupiedKeys = index.layers.obstacle.size;
assert(occupiedKeys > 0 && occupiedKeys < grid.cols * grid.rows, 'sparse obstacle map');

if (!process.exitCode) {
  console.log('occupancy.selfcheck: ok');
}
