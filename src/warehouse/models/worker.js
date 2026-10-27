import * as THREE from 'three';
import { MODEL_DISPLAY_SCALE } from './displayScale.js';

export function createWorker(palette, trackingTags) {
  const worker = new THREE.Group();
  worker.name = 'worker';
  const uniformMaterial = new THREE.MeshStandardMaterial({ color: palette.color7, roughness: 0.7 });
  const vestMaterial = new THREE.MeshStandardMaterial({ color: palette.color4, roughness: 0.55 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a783, roughness: 0.78 });
  const bootMaterial = new THREE.MeshStandardMaterial({ color: palette.color8, roughness: 0.82 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.82, 0.34), uniformMaterial);
  torso.position.y = 1.35;
  torso.castShadow = true;
  worker.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 0.37), vestMaterial);
  vest.position.set(0, 1.48, 0);
  vest.castShadow = true;
  worker.add(vest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), skinMaterial);
  head.position.y = 1.98;
  head.castShadow = true;
  worker.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    vestMaterial
  );
  helmet.position.y = 2.04;
  helmet.castShadow = true;
  worker.add(helmet);

  const leftArm = createLimb(0.13, 0.72, uniformMaterial);
  const rightArm = createLimb(0.13, 0.72, uniformMaterial);
  leftArm.name = 'leftArm';
  rightArm.name = 'rightArm';
  leftArm.position.set(-0.39, 1.53, 0);
  rightArm.position.set(0.39, 1.53, 0);
  worker.add(leftArm, rightArm);

  const leftLeg = createLimb(0.16, 0.82, uniformMaterial);
  const rightLeg = createLimb(0.16, 0.82, uniformMaterial);
  leftLeg.name = 'leftLeg';
  rightLeg.name = 'rightLeg';
  leftLeg.position.set(-0.18, 0.83, 0);
  rightLeg.position.set(0.18, 0.83, 0);
  worker.add(leftLeg, rightLeg);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.36), bootMaterial);
  const rightBoot = leftBoot.clone();
  leftBoot.position.set(-0.18, 0.12, 0.09);
  rightBoot.position.set(0.18, 0.12, 0.09);
  worker.add(leftBoot, rightBoot);

  trackingTags.addTrackingTag(worker, {
    position: new THREE.Vector3(0.31, 1.48, 0.2),
    size: new THREE.Vector3(0.18, 0.12, 0.08),
    signalPosition: new THREE.Vector3(0.31, 1.78, 0.2),
    signalScale: 0.72
  });

  worker.userData.leftArm = leftArm;
  worker.userData.rightArm = rightArm;
  worker.userData.leftLeg = leftLeg;
  worker.userData.rightLeg = rightLeg;
  worker.scale.setScalar(MODEL_DISPLAY_SCALE.worker);
  return worker;

  function createLimb(width, length, material) {
    const pivot = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), material);
    limb.position.y = -length / 2;
    limb.castShadow = true;
    pivot.add(limb);
    return pivot;
  }
}
