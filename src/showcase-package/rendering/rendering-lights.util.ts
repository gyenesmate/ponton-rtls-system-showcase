import * as THREE from 'three';

export interface LightQuality {
  shadows: boolean;
  shadowMapSize: number;
}

export function addLights(
  scene: THREE.Scene,
  palette: Record<string, THREE.ColorRepresentation>,
  quality: LightQuality
) {
  const hemisphere = new THREE.HemisphereLight(palette.color1, palette.color5, 2.15);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(palette.color1, 3.0);
  keyLight.position.set(26, 42, 30);
  keyLight.castShadow = quality.shadows;
  keyLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  keyLight.shadow.camera.left = -36;
  keyLight.shadow.camera.right = 36;
  keyLight.shadow.camera.top = 32;
  keyLight.shadow.camera.bottom = -32;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 100;
  keyLight.shadow.bias = -0.00025;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(palette.color2, 1.0);
  fillLight.position.set(-25, 20, 12);
  scene.add(fillLight);

  return { hemisphere, keyLight, fillLight };
}
