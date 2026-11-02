import * as THREE from 'three';

interface Disposable {
  dispose(): void;
}

function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  );
}

/** Dispose GPU resources for an Object3D subtree (geometry / material / texture). */
export function disposeObject3D(root: THREE.Object3D | null | undefined): void {
  if (!root) return;

  root.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      geometry?: Disposable;
      material?: THREE.Material | THREE.Material[];
    };
    renderable.geometry?.dispose();

    const { material } = renderable;
    if (!material) return;

    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else disposeMaterial(material);
  });
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (isDisposable(value)) value.dispose();
  }
  material.dispose();
}
