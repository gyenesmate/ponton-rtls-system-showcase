import * as THREE from 'three';
import { DEFAULT_CELL_SIZE } from '../grid/index.ts';

/**
 * Optional authoring grids. Visualization only — does not affect site poses.
 * Ground grid matches the physical floor rectangle (width × depth).
 * Wall grids deferred with shell walls.
 */
export function createDebugGrids(
  parent: THREE.Object3D,
  site: Record<string, any> = {},
  options: { showGroundGrid?: boolean; showWallGrid?: boolean } = {}
) {
  const group = new THREE.Group();
  group.name = 'rtls-debug-grids';
  group.visible = true;
  parent.add(group);

  const cellSize = site.grid?.cellSize ?? DEFAULT_CELL_SIZE;
  const warehouse = site.warehouse || {};
  const width = warehouse.width ?? 44;
  const depth = warehouse.depth ?? 30;

  if (options.showGroundGrid) {
    group.add(createGroundGrid(width, depth, cellSize));
  }

  return group;
}

/**
 * Rectangular XZ grid aligned to the floor footprint (not a square GridHelper).
 */
function createGroundGrid(width: number, depth: number, cellSize: number) {
  const step = Math.max(cellSize, 0.05);
  const halfW = width / 2;
  const halfD = depth / 2;
  const positions: number[] = [];

  for (let x = -halfW; x <= halfW + 1e-6; x += step) {
    positions.push(x, 0, -halfD, x, 0, halfD);
  }
  if (Math.abs(((halfW * 2) / step) % 1) > 1e-6) {
    positions.push(halfW, 0, -halfD, halfW, 0, halfD);
  }

  for (let z = -halfD; z <= halfD + 1e-6; z += step) {
    positions.push(-halfW, 0, z, halfW, 0, z);
  }
  if (Math.abs(((halfD * 2) / step) % 1) > 1e-6) {
    positions.push(-halfW, 0, halfD, halfW, 0, halfD);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7 })
  );
  lines.position.y = 0.02;
  lines.name = 'rtls-ground-grid';
  return lines;
}
