import * as THREE from 'three';
import { MODEL_DISPLAY_SCALE } from './displayScale.js';

export function createForklift(bodyColor, palette, trackingTags) {
  const forklift = new THREE.Group();
  forklift.name = 'forklift';

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.48, metalness: 0.05 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: palette.color8, roughness: 0.52 });
  const steelMaterial = new THREE.MeshStandardMaterial({ color: palette.color5, roughness: 0.4, metalness: 0.22 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: palette.color6,
    transparent: true,
    opacity: 0.5,
    roughness: 0.18,
    metalness: 0.05
  });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: palette.color8, roughness: 0.82 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.48, 2.35), bodyMaterial);
  chassis.position.y = 0.48;
  chassis.castShadow = true;
  forklift.add(chassis);

  const counterweight = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.72, 0.72), bodyMaterial);
  counterweight.position.set(0, 0.75, -0.9);
  counterweight.castShadow = true;
  forklift.add(counterweight);

  const lowerCab = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.45, 1.05), darkMaterial);
  lowerCab.position.set(0, 0.95, -0.28);
  lowerCab.castShadow = true;
  forklift.add(lowerCab);

  const postGeometry = new THREE.BoxGeometry(0.1, 1.45, 0.1);
  [
    [-0.58, 1.65, -0.72], [0.58, 1.65, -0.72],
    [-0.58, 1.65, 0.12], [0.58, 1.65, 0.12]
  ].forEach(([x, y, z]) => {
    const post = new THREE.Mesh(postGeometry, darkMaterial);
    post.position.set(x, y, z);
    post.castShadow = true;
    forklift.add(post);
  });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.13, 1.06), darkMaterial);
  roof.position.set(0, 2.37, -0.3);
  roof.castShadow = true;
  forklift.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.82, 0.055), glassMaterial);
  windshield.position.set(0, 1.75, 0.18);
  forklift.add(windshield);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.52), darkMaterial);
  seat.position.set(0, 1.25, -0.55);
  seat.castShadow = true;
  forklift.add(seat);

  const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10), steelMaterial);
  steeringColumn.rotation.x = Math.PI / 2.8;
  steeringColumn.position.set(-0.28, 1.45, -0.03);
  forklift.add(steeringColumn);

  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20), darkMaterial);
  steeringWheel.rotation.x = Math.PI / 2.8;
  steeringWheel.position.set(-0.28, 1.63, 0.13);
  forklift.add(steeringWheel);

  [-0.48, 0.48].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.18, 0.16), darkMaterial);
    rail.position.set(x, 1.3, 1.22);
    rail.castShadow = true;
    forklift.add(rail);
  });

  const mastBridgeTop = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.13, 0.16), darkMaterial);
  mastBridgeTop.position.set(0, 2.34, 1.22);
  forklift.add(mastBridgeTop);

  const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.34, 0.18), steelMaterial);
  carriage.position.set(0, 0.62, 1.3);
  carriage.castShadow = true;
  forklift.add(carriage);

  [-0.39, 0.39].forEach((x) => {
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 1.62), steelMaterial);
    fork.position.set(x, 0.22, 2.05);
    fork.castShadow = true;
    forklift.add(fork);
  });

  addWheel(-0.82, 0.34, -0.72, 0.34);
  addWheel(0.82, 0.34, -0.72, 0.34);
  addWheel(-0.78, 0.30, 0.72, 0.29);
  addWheel(0.78, 0.30, 0.72, 0.29);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.16, 16),
    new THREE.MeshStandardMaterial({
      color: palette.color4,
      emissive: palette.color4,
      emissiveIntensity: 0.4,
      roughness: 0.28
    })
  );
  beacon.position.set(0.46, 2.53, -0.3);
  forklift.add(beacon);

  trackingTags.addTrackingTag(forklift, {
    position: new THREE.Vector3(-0.34, 2.51, -0.3),
    size: new THREE.Vector3(0.34, 0.13, 0.34),
    signalPosition: new THREE.Vector3(-0.34, 2.78, -0.3)
  });

  forklift.scale.setScalar(MODEL_DISPLAY_SCALE.forklift);
  return forklift;

  function addWheel(x, y, z, radius) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.24, 20), tireMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    forklift.add(wheel);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.43, radius * 0.43, 0.255, 16), steelMaterial);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, y, z);
    forklift.add(hub);
  }
}
