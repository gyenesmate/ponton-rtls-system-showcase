import { withSite } from './sites/defaultWarehouseSite.js';
import { GridConfig } from '../spatial/GridConfig.js';
import { cellToWorld } from '../spatial/gridMath.js';

const CELL = 2;
const warehouse = { width: 44, depth: 30 };
const grid = GridConfig.fromWarehouse(warehouse, CELL);

/** Test placement: logical cell (col=10, row=10) → world center. */
const atCell1010 = cellToWorld(10, 10, grid);

/**
 * Developer shell: floor + grid; one machine at matrix cell (10, 10) for spatial checks.
 */
export const developerScenario = {
  id: 'developer',
  label: 'Developer',
  layout: 'warehouse',
  quality: 'medium',
  warehouse: {
    visible: true,
    showTags: false,
    showAnchors: false,
    showZones: false,
    showSignals: false,
    showPaths: false,
    showIntersections: false,
    showGroundGrid: true,
    showWallGrid: false
  },
  software: {
    visible: false
  },
  site: withSite({
    warehouse,
    grid: { cellSize: CELL, wallCellSize: CELL },
    machines: [
      {
        x: atCell1010.x,
        z: atCell1010.z,
        sx: 1.6,
        sy: 2.3,
        sz: 1.6
      }
    ],
    routes: [],
    intersections: [],
    zones: [],
    objects: [],
    interiorWalls: [],
    infrastructure: {
      controlUnderAnchorId: null,
      anchors: []
    }
  })
};
