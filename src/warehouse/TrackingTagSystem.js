import * as THREE from 'three';

export class TrackingTagSystem {
  constructor(palette) {
    this.palette = palette;
    this.signalRings = [];
  }

  addTrackingTag(parent, {
    position,
    size = new THREE.Vector3(0.28, 0.12, 0.28),
    signalPosition = position.clone().add(new THREE.Vector3(0, 0.28, 0)),
    signalScale = 1
  }) {
    const tag = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({
        color: this.palette.color4,
        emissive: this.palette.color4,
        emissiveIntensity: 0.15,
        roughness: 0.3
      })
    );
    tag.position.copy(position);
    tag.castShadow = true;
    tag.userData.rtlsOverlay = true;
    parent.add(tag);

    parent.userData.rtlsTagLocalPosition = position.clone();
    parent.userData.rtlsSignalLocalPosition = signalPosition.clone();

    this.createSignalAboveTag(parent, signalPosition, signalScale);
    return tag;
  }

  createSignalAboveTag(parent, basePosition, sizeMultiplier = 1) {
    for (let index = 0; index < 3; index++) {
      const material = new THREE.MeshBasicMaterial({
        color: this.palette.color4,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      });

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry((0.23 + index * 0.15) * sizeMultiplier, 0.018, 8, 40),
        material
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(basePosition).add(new THREE.Vector3(0, index * 0.16 * sizeMultiplier, 0));
      ring.userData.rtlsOverlay = true;
      parent.add(ring);
      this.signalRings.push({ ring, offset: index * 0.3 });
    }
  }

  update(elapsed) {
    this.signalRings.forEach(({ ring, offset }) => {
      const pulse = (elapsed * 1.22 + offset) % 1;
      const scale = 1 + pulse * 1.15;
      ring.scale.set(scale, scale, scale);
      ring.material.opacity = 0.78 * (1 - pulse);
    });
  }
}
