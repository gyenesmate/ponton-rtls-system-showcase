import * as THREE from 'three';
import { addEdges } from '../../shared/geometry.js';

export function createIndustrialStorageContainer(palette, trackingTags) {
  const containerGroup = new THREE.Group();
  containerGroup.name = 'container';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: palette.color3, roughness: 0.7, metalness: 0.03 });
  const frameMaterial = new THREE.MeshStandardMaterial({ color: palette.color6, roughness: 0.56, metalness: 0.08 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.45, 2.25), bodyMaterial);
  body.position.y = 0.82;
  body.castShadow = true;
  body.receiveShadow = true;
  containerGroup.add(body);
  addEdges(body, palette.color6, 0.55);

  [0.18, 1.52].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.12, 2.38), frameMaterial);
    rim.position.y = y;
    rim.castShadow = true;
    containerGroup.add(rim);
  });

  [
    [-1.01, -1.16], [1.01, -1.16],
    [-1.01, 1.16], [1.01, 1.16]
  ].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.12), frameMaterial);
    post.position.set(x, 0.82, z);
    post.castShadow = true;
    containerGroup.add(post);
  });

  for (let index = -2; index <= 2; index++) {
    const frontRib = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.07, 0.06), frameMaterial);
    frontRib.position.set(0, 0.82 + index * 0.22, 1.155);
    containerGroup.add(frontRib);

    const sideRib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 1.8), frameMaterial);
    sideRib.position.set(0.985, 0.82 + index * 0.22, 0);
    containerGroup.add(sideRib);
  }

  trackingTags.addTrackingTag(containerGroup, {
    position: new THREE.Vector3(0.72, 1.63, 0.38),
    size: new THREE.Vector3(0.32, 0.12, 0.32),
    signalPosition: new THREE.Vector3(0.72, 1.9, 0.38),
    signalScale: 0.9
  });

  return containerGroup;
}
