/**
 * Compatibility shim — prefer `src/spatial/gridMath.js` and `GridConfig.js` for new code.
 * Keeps Three.js `snappedVector3` for route builders.
 */
import * as THREE from 'three';
import {
  DEFAULT_CELL_SIZE,
  snapToGrid,
  groundPose,
  wallYaw,
  wallFrame,
  wallToWorld,
  worldToWall
} from '../spatial/gridMath.js';

export {
  DEFAULT_CELL_SIZE,
  snapToGrid,
  groundPose,
  wallYaw,
  wallFrame,
  wallToWorld,
  worldToWall
};

/**
 * Build a Vector3 with x/z snapped to the layout grid (y unchanged).
 */
export function snappedVector3(x, y, z, cellSize = DEFAULT_CELL_SIZE) {
  return new THREE.Vector3(snapToGrid(x, cellSize), y, snapToGrid(z, cellSize));
}
