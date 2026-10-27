import * as THREE from 'three';
import { addEdges, addWallLabel } from '../../../../shared/geometry.ts';
import type { Palette, SiteEntry } from '../types.ts';

/**
 * Warehouse shell: floor only for now (walls deferred — draft separately).
 * World + matrix origin markers.
 * @param config site.warehouse
 */
export function createWarehouse(parent: THREE.Object3D, palette: Palette, config: SiteEntry = {}) {
  const width = config.width ?? 44;
  const depth = config.depth ?? 30;
  const partitionCfg = config.partition;
  const labels = config.labels || [];
  const backZ = -depth / 2;
  const leftX = -width / 2;

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: palette.color2,
    roughness: 0.95,
    metalness: 0
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, depth), floorMaterial);
  floor.position.y = -0.14;
  floor.receiveShadow = true;
  parent.add(floor);
  addEdges(floor, palette.color5, 0.42);

  // ponytail: walls omitted until a dedicated wall/grid display plan lands.
  let partition: THREE.Mesh | null = null;
  if (partitionCfg) {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: palette.color1,
      roughness: 0.82,
      metalness: 0
    });
    partition = new THREE.Mesh(
      new THREE.BoxGeometry(partitionCfg.sx, partitionCfg.sy, partitionCfg.sz),
      wallMaterial
    );
    partition.position.set(partitionCfg.x, partitionCfg.y, partitionCfg.z);
    partition.castShadow = true;
    partition.receiveShadow = true;
    parent.add(partition);
    addEdges(partition, palette.color3, 0.32);
  }

  labels.forEach((label: SiteEntry) => {
    addWallLabel(
      parent,
      label.text,
      new THREE.Vector3(label.x, label.y, label.z),
      label.rotationY,
      palette
    );
  });

  // World origin = floor center; matrix origin = SW corner (cell 0,0).
  addOriginMarker(parent, {
    name: 'rtls-world-origin',
    x: 0,
    z: 0,
    color: palette.color4,
    title: 'world origin (center)',
    titleColor: '#ffa400',
    axisLen: 3
  });
  addOriginMarker(parent, {
    name: 'rtls-matrix-origin',
    x: leftX,
    z: backZ,
    color: palette.color6,
    title: 'matrix origin (cell 0,0)',
    titleColor: '#62687b',
    axisLen: 3
  });

  return { floor, partition };
}

/**
 * Labeled origin gizmo: sphere + AxesHelper (+X / +Y / +Z).
 */
function addOriginMarker(
  parent: THREE.Object3D,
  { name, x, z, color, title, titleColor, axisLen = 3 }: {
    name: string;
    x: number;
    z: number;
    color: number;
    title: string;
    titleColor: string;
    axisLen?: number;
  }
) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0, z);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshBasicMaterial({ color })
  );
  marker.position.y = 0.18;
  group.add(marker);

  const axes = new THREE.AxesHelper(axisLen);
  axes.position.y = 0.02;
  group.add(axes);

  group.add(makeAxisLabel(title, new THREE.Vector3(0.4, 1.1, 0.4), titleColor, { scaleX: 3.4, scaleY: 0.85 }));
  group.add(makeAxisLabel('+X', new THREE.Vector3(axisLen + 0.35, 0.35, 0), '#ff4444'));
  group.add(makeAxisLabel('+Y up', new THREE.Vector3(0.35, axisLen + 0.35, 0), '#44cc44'));
  group.add(makeAxisLabel('+Z', new THREE.Vector3(0, 0.35, axisLen + 0.35), '#4488ff'));

  parent.add(group);
  return group;
}

function makeAxisLabel(
  text: string,
  position: THREE.Vector3,
  cssColor: string,
  { scaleX = 1.6, scaleY = 0.8 }: { scaleX?: number; scaleY?: number } = {}
) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = cssColor;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  );
  sprite.position.copy(position);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.renderOrder = 10;
  return sprite;
}
