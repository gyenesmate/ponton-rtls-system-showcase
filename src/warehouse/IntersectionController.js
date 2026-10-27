import * as THREE from 'three';

/**
 * Intersection occupancy with invisible approach zones.
 * First agent to enter claims the mutex; later arrivals hold until it leaves.
 */
export class IntersectionController {
  constructor(scene, { palette = null, debug = false } = {}) {
    this.scene = scene;
    this.palette = palette;
    this.debug = debug;
    this.intersections = new Map();
    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = debug;
    this.scene.add(this.debugGroup);
  }

  /**
   * @param {{
   *   id: string,
   *   position: { x: number, z: number } | THREE.Vector2 | THREE.Vector3,
   *   approachRadius?: number,
   *   routeIds?: string[]
   * }} config
   */
  register(config) {
    const { id, approachRadius = 6.2, routeIds = null } = config;
    if (!id || this.intersections.has(id)) {
      throw new Error(`Intersection id must be unique: ${id}`);
    }

    const x = config.position.x;
    const z = config.position.z;
    const position = new THREE.Vector3(x, 0.04, z);

    const entry = {
      id,
      position,
      approachRadius,
      routeIds: routeIds ? [...routeIds] : null,
      occupants: new Set(),
      inside: new Set(),
      debugMesh: null
    };

    if (this.debug || this.debugGroup.visible) {
      entry.debugMesh = this.createDebugRing(position, approachRadius);
      this.debugGroup.add(entry.debugMesh);
    }

    this.intersections.set(id, entry);
    return entry;
  }

  setDebugVisible(visible) {
    this.debug = visible;
    this.debugGroup.visible = visible;

    if (visible) {
      this.intersections.forEach((entry) => {
        if (!entry.debugMesh) {
          entry.debugMesh = this.createDebugRing(entry.position, entry.approachRadius);
          this.debugGroup.add(entry.debugMesh);
        }
      });
    }
  }

  createDebugRing(position, radius) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.2, radius - 0.12), radius, 48),
      new THREE.MeshBasicMaterial({
        color: this.palette?.color4 ?? 0xffa400,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y = 0.06;
    return ring;
  }

  /**
   * Evaluates approach zones and sets movement.held for blocked agents.
   * Call before RouteManager.update(delta) so held agents do not advance.
   */
  update(movements) {
    const list = Array.isArray(movements) ? movements : [];

    list.forEach((movement) => {
      movement.held = false;
    });

    this.intersections.forEach((intersection) => {
      const insideMovements = [];

      list.forEach((movement) => {
        if (!movement?.agentId || !movement.object || !movement.route) return;
        if (
          intersection.routeIds &&
          !intersection.routeIds.includes(movement.route.id)
        ) {
          return;
        }

        const pos = movement.object.position;
        const dx = pos.x - intersection.position.x;
        const dz = pos.z - intersection.position.z;
        const radius = intersection.approachRadius;
        const isInside = dx * dx + dz * dz <= radius * radius;

        if (isInside) {
          insideMovements.push(movement);
          intersection.inside.add(movement.agentId);
        } else {
          intersection.inside.delete(movement.agentId);
          intersection.occupants.delete(movement.agentId);
        }
      });

      for (const agentId of [...intersection.occupants]) {
        if (!intersection.inside.has(agentId)) {
          intersection.occupants.delete(agentId);
        }
      }

      insideMovements.forEach((movement) => {
        const agentId = movement.agentId;
        if (intersection.occupants.has(agentId)) {
          return;
        }

        if (intersection.occupants.size === 0) {
          intersection.occupants.add(agentId);
          return;
        }

        movement.held = true;
      });
    });
  }

  getOccupancy(intersectionId) {
    return this.intersections.get(intersectionId)?.occupants.size ?? 0;
  }

  destroy() {
    this.debugGroup.removeFromParent();
    this.intersections.clear();
  }
}
