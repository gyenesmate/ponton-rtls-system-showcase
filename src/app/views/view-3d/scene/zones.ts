import * as THREE from 'three';
import type { Palette, SiteEntry } from '../types.ts';

/**
 * Rectangular floor zones from site.zones.
 * Zone coords: center (x, z), size (width along X, depth along Z).
 *
 * @param {THREE.Object3D} parent
 * @param {object} palette
 * @param {Array<object>} zones
 * @param {boolean} showZones
 */
export function createZones(parent: THREE.Object3D, palette: Palette, zones: SiteEntry[] = [], showZones = false) {
  const group = new THREE.Group();
  group.visible = showZones === true;
  parent.add(group);

  const meshes = zones.map((zone) => {
    const size = normalizeZoneSize(zone);
    const opacityScale = zone.visible === false ? 0 : 1;

    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(size.width, size.depth),
      new THREE.MeshBasicMaterial({
        color: palette.color4,
        transparent: true,
        opacity: 0.14 * opacityScale,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(zone.x, 0.05, zone.z);
    fill.userData.zoneId = zone.id;
    group.add(fill);

    const border = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size.width / 2, 0, -size.depth / 2),
        new THREE.Vector3(size.width / 2, 0, -size.depth / 2),
        new THREE.Vector3(size.width / 2, 0, size.depth / 2),
        new THREE.Vector3(-size.width / 2, 0, size.depth / 2)
      ]),
      new THREE.LineBasicMaterial({
        color: palette.color4,
        transparent: true,
        opacity: 0.85 * opacityScale
      })
    );
    border.position.set(zone.x, 0.07, zone.z);
    group.add(border);

    return { id: zone.id, fill, border, ...size };
  });

  return {
    group,
    meshes,
    setVisible(visible: boolean) {
      group.visible = visible === true;
    }
  };
}

export function normalizeZoneSize(zone: SiteEntry) {
  if (zone.width != null && zone.depth != null) {
    return { width: zone.width, depth: zone.depth };
  }
  // Backward-compatible fallback if an older radius-only zone remains.
  const diameter = (zone.radius ?? 3) * 2;
  return { width: diameter, depth: diameter };
}

export function isPointInZone(x: number, z: number, zone: SiteEntry) {
  const { width, depth } = normalizeZoneSize(zone);
  return (
    Math.abs(x - zone.x) <= width / 2 &&
    Math.abs(z - zone.z) <= depth / 2
  );
}
