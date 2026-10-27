import * as THREE from 'three';
import { wallYaw } from '../../../../core/grid/index.ts';
import type { Palette, SiteEntry } from '../types.ts';

export interface WallAnchor {
  id: string;
  group: THREE.Group;
  wall: string;
  signalOriginLocal: THREE.Vector3;
  indicatorMaterial: THREE.MeshStandardMaterial;
}

type CableSide = 'left' | 'right' | 'bottom';

/** @param config site.infrastructure */
export function createRtlsInfrastructure(parent: THREE.Object3D, palette: Palette, config: SiteEntry = {}) {
  const anchors: WallAnchor[] = [];
  const anchorConfigs = config.anchors || [];

  anchorConfigs.forEach((anchorCfg: SiteEntry) => {
    const position = new THREE.Vector3(anchorCfg.x, anchorCfg.y, anchorCfg.z);
    anchors.push(createWallAnchor(position, anchorCfg.wall, palette, anchorCfg.id));
  });

  const controlAnchorId = config.controlUnderAnchorId;
  const controlAnchor =
    anchors.find((anchor) => anchor.id === controlAnchorId) || anchors[0] || null;

  let controlGroup: THREE.Group | null = null;
  if (controlAnchor) {
    controlGroup = createWallControlUnit(
      controlAnchor.group.position,
      controlAnchor.wall,
      palette
    );
    parent.add(controlGroup);
  }

  const cableGroup = new THREE.Group();
  parent.add(cableGroup);

  const backAnchors = anchors.filter((anchor) => anchor.wall === 'back');
  const leftAnchors = anchors.filter((anchor) => anchor.wall === 'left');

  addWallCableRun(cableGroup, backAnchors, palette);
  addWallCableRun(cableGroup, leftAnchors, palette);

  if (backAnchors[0] && leftAnchors[0]) {
    addCableBetween(
      cableGroup,
      cablePortWorld(backAnchors[0], 'left'),
      cablePortWorld(leftAnchors[0], 'right'),
      palette
    );
  }

  if (controlGroup && controlAnchor) {
    addCableBetween(
      cableGroup,
      controlCablePortWorld(controlGroup),
      cablePortWorld(controlAnchor, 'bottom'),
      palette
    );
  }

  return { anchors, controlGroup, cableGroup };

  function createWallAnchor(position: THREE.Vector3, wall: string, paletteRef: Palette, id: string): WallAnchor {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.9, 0.34),
      new THREE.MeshStandardMaterial({ color: paletteRef.color7, roughness: 0.48 })
    );
    body.castShadow = true;
    group.add(body);

    const front = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.52, 0.05),
      new THREE.MeshStandardMaterial({
        color: paletteRef.color4,
        roughness: 0.3,
        emissive: paletteRef.color4,
        emissiveIntensity: 0.04
      })
    );
    front.position.z = 0.195;
    group.add(front);

    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x63d38a,
      emissive: 0x2d9f5d,
      emissiveIntensity: 0.55,
      roughness: 0.25
    });
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.06), indicatorMaterial);
    indicator.position.set(0.28, 0, 0.225);
    group.add(indicator);

    group.rotation.y = wallYaw(wall);
    group.position.copy(position);
    parent.add(group);

    return {
      id,
      group,
      wall,
      signalOriginLocal: new THREE.Vector3(0, 0, 0.24),
      indicatorMaterial
    };
  }

  function createWallControlUnit(anchorPosition: THREE.Vector3, wall: string, paletteRef: Palette) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 1.15, 0.42),
      new THREE.MeshStandardMaterial({ color: paletteRef.color7, roughness: 0.48 })
    );
    body.castShadow = true;
    group.add(body);

    const face = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.72, 0.05),
      new THREE.MeshStandardMaterial({
        color: paletteRef.color4,
        roughness: 0.3,
        emissive: paletteRef.color4,
        emissiveIntensity: 0.06
      })
    );
    face.position.z = 0.24;
    group.add(face);

    const status = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.05),
      new THREE.MeshBasicMaterial({ color: paletteRef.color1 })
    );
    status.position.set(0, 0.22, 0.27);
    group.add(status);

    group.rotation.y = wallYaw(wall);
    group.position.set(anchorPosition.x, anchorPosition.y - 1.35, anchorPosition.z);
    group.userData.wall = wall;
    return group;
  }
}

function cablePortWorld(anchor: WallAnchor, side: CableSide) {
  const local = new THREE.Vector3(0, 0.42, 0.2);
  if (side === 'left') local.x = -0.62;
  if (side === 'right') local.x = 0.62;
  if (side === 'bottom') {
    local.x = 0;
    local.y = -0.45;
  }
  anchor.group.updateWorldMatrix(true, false);
  return anchor.group.localToWorld(local);
}

function controlCablePortWorld(controlGroup: THREE.Group) {
  const local = new THREE.Vector3(0, 0.58, 0.24);
  controlGroup.updateWorldMatrix(true, false);
  return controlGroup.localToWorld(local);
}

function addWallCableRun(cableGroup: THREE.Group, wallAnchors: WallAnchor[], palette: Palette) {
  for (let index = 0; index < wallAnchors.length - 1; index++) {
    addCableBetween(
      cableGroup,
      cablePortWorld(wallAnchors[index], 'right'),
      cablePortWorld(wallAnchors[index + 1], 'left'),
      palette
    );
  }
}

function addCableBetween(cableGroup: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, palette: Palette) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 0.01) return;

  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, length, 6),
    new THREE.MeshStandardMaterial({
      color: palette.color8,
      roughness: 0.65,
      metalness: 0.15
    })
  );
  cable.position.copy(start).add(end).multiplyScalar(0.5);
  cable.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  cableGroup.add(cable);
}
