import * as THREE from 'three';
import { addEdges } from '../../../shared/geometry.ts';
import { createIndustrialStorageContainer } from './container.ts';
import { MODEL_DISPLAY_SCALE } from '../scaling/display-scale.ts';

type Palette = typeof import('../../../shared/constants.ts').PALETTE;
type TrackingTags = Parameters<typeof createIndustrialStorageContainer>[1];

export function createAmrTransport(
  palette: Palette,
  trackingTags: TrackingTags
): THREE.Group {
  const transport = new THREE.Group();
  const robot = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: palette.color7,
    roughness: 0.5,
    metalness: 0.08
  });
  const bumperMaterial = new THREE.MeshStandardMaterial({
    color: palette.color8,
    roughness: 0.76
  });
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: palette.color5,
    roughness: 0.48,
    metalness: 0.16
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.42, 3.05), shellMaterial);
  chassis.position.y = 0.38;
  chassis.castShadow = true;
  robot.add(chassis);
  addEdges(chassis, palette.color8, 0.5);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 3.2), bumperMaterial);
  bumper.position.y = 0.18;
  bumper.castShadow = true;
  robot.add(bumper);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.14, 2.72), deckMaterial);
  deck.position.y = 0.66;
  deck.castShadow = true;
  robot.add(deck);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: palette.color8,
    roughness: 0.86
  });
  [
    [-1.13, 0.25, -0.92],
    [1.13, 0.25, -0.92],
    [-1.13, 0.25, 0.92],
    [1.13, 0.25, 0.92]
  ].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.18, 18),
      wheelMaterial
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    robot.add(wheel);
  });

  const lidar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.22, 20),
    new THREE.MeshStandardMaterial({
      color: palette.color4,
      emissive: palette.color4,
      emissiveIntensity: 0.08,
      roughness: 0.3
    })
  );
  lidar.position.set(0, 0.83, 1.2);
  lidar.castShadow = true;
  robot.add(lidar);

  [-1.535, 1.535].forEach((z) => {
    const statusStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.1, 0.04),
      new THREE.MeshBasicMaterial({ color: palette.color4 })
    );
    statusStrip.position.set(0, 0.4, z);
    robot.add(statusStrip);
  });

  const cargo = createIndustrialStorageContainer(palette, trackingTags);
  cargo.name = 'cargo';
  cargo.position.y = 0.73;

  robot.name = 'amr';
  transport.add(robot, cargo);
  transport.userData.cargo = cargo;
  transport.scale.setScalar(MODEL_DISPLAY_SCALE.amr);
  return transport;
}
