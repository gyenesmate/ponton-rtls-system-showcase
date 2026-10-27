/**
 * Dispose GPU resources for an Object3D subtree (geometry / material / texture).
 */
export function disposeObject3D(root) {
  if (!root) return;

  root.traverse((object) => {
    if (object.geometry?.dispose) {
      object.geometry.dispose();
    }

    const { material } = object;
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else {
      disposeMaterial(material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value && typeof value === 'object' && typeof value.dispose === 'function') {
      value.dispose();
    }
  }
  material.dispose?.();
}
