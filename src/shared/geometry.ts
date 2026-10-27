import * as THREE from 'three';

export function addEdges(
  mesh: THREE.Mesh<THREE.BufferGeometry>,
  color: THREE.ColorRepresentation,
  opacity = 0.35
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  lines.renderOrder = 2;
  mesh.add(lines);
  return lines;
}

export function addWallLabel(
  scene: THREE.Object3D,
  text: string,
  position: THREE.Vector3,
  rotationY: number,
  _palette: unknown
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d7d9dd';
  context.fillRect(38, 38, 180, 180);
  context.strokeStyle = '#a2a5af';
  context.lineWidth = 8;
  context.strokeRect(38, 38, 180, 180);
  context.fillStyle = '#62687b';
  context.font = 'bold 118px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 137);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 1.55),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  label.position.copy(position);
  label.rotation.y = rotationY;
  scene.add(label);
  return label;
}
