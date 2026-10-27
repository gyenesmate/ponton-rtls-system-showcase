import * as THREE from 'three';

export class RouteManager {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.routes = new Map();
    this.movingObjects = [];
  }

  registerRoute({
    id,
    points,
    visible = true,
    closed = false,
    width = 1.4,
    cornerRadius = 0.55,
    baseColor = this.palette.color3,
    accentColor = this.palette.color4
  }) {
    if (!id || this.routes.has(id)) {
      throw new Error(`Route id must be unique: ${id}`);
    }
    if (!Array.isArray(points) || points.length < 2) {
      throw new Error(`Route "${id}" needs at least two THREE.Vector3 points.`);
    }

    const curve = this.createIndustrialRoundedCurve(points, closed, cornerRadius);
    curve.arcLengthDivisions = 400;

    const routeGroup = new THREE.Group();
    routeGroup.visible = visible;

    const base = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 160, width / 2, 8, closed),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.9,
        transparent: true,
        opacity: 0.72,
        depthWrite: true
      })
    );
    base.scale.y = 0.055;
    base.position.y = 0.032;
    base.receiveShadow = true;
    routeGroup.add(base);

    const accent = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 160, 0.075, 6, closed),
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.52 })
    );
    accent.scale.y = 0.07;
    accent.position.y = 0.058;
    routeGroup.add(accent);

    this.scene.add(routeGroup);

    const route = { id, points, curve, closed, width, cornerRadius, group: routeGroup };
    this.routes.set(id, route);
    return route;
  }

  setRouteVisibility(routeId, visible) {
    const route = this.routes.get(routeId);
    if (!route) throw new Error(`Unknown route: ${routeId}`);
    route.group.visible = visible;
  }

  assignObjectToRoute(object, routeId, options = {}) {
    const route = this.routes.get(routeId);
    if (!route) throw new Error(`Unknown route: ${routeId}`);

    const movement = {
      object,
      route,
      agentId: options.agentId ?? null,
      duration: options.duration ?? 16,
      delay: options.delay ?? 0,
      pause: options.pause ?? 0,
      loop: options.loop ?? true,
      reverse: options.reverse ?? false,
      faceForward: options.faceForward ?? true,
      hideDuringDelay: options.hideDuringDelay ?? true,
      offsetY: options.offsetY ?? 0,
      phase: options.phase ?? 0,
      onUpdate: options.onUpdate ?? null,
      finished: false,
      /** Simulation clock; freezes while held so resume does not teleport. */
      simTime: 0,
      held: false
    };

    object.visible = !movement.hideDuringDelay || movement.delay === 0;
    this.movingObjects.push(movement);
    return movement;
  }

  setHeld(agentId, held) {
    const movement = this.movingObjects.find((entry) => entry.agentId === agentId);
    if (movement) movement.held = held;
  }

  /**
   * Reset agent simulation clocks (playback restart / seek).
   * @param {number} [simTime=0]
   */
  resetSimulation(simTime = 0) {
    this.movingObjects.forEach((movement) => {
      movement.simTime = simTime;
      movement.held = false;
      movement.finished = false;
    });
  }

  /**
   * @param {number} delta Seconds since last update. Only advances non-held agents.
   */
  update(delta) {
    const safeDelta = Math.max(0, delta);

    this.movingObjects.forEach((movement) => {
      if (!movement.held) {
        movement.simTime += safeDelta;
      }

      const totalCycle = Math.max(0.001, movement.delay + movement.duration + movement.pause);
      let localTime = movement.simTime + movement.phase;

      if (movement.loop) {
        localTime %= totalCycle;
      } else if (movement.finished) {
        return;
      }

      if (localTime < movement.delay) {
        movement.object.visible = !movement.hideDuringDelay;
        movement.onUpdate?.({
          object: movement.object,
          elapsed: movement.simTime,
          progress: 0,
          isMoving: false,
          held: movement.held,
          movement
        });
        return;
      }

      movement.object.visible = true;
      localTime -= movement.delay;

      const isMoving = !movement.held && localTime <= movement.duration;
      const rawProgress = THREE.MathUtils.clamp(localTime / movement.duration, 0, 1);
      const progress = movement.reverse ? 1 - rawProgress : rawProgress;
      const position = movement.route.curve.getPointAt(progress);
      const tangent = movement.route.curve.getTangentAt(progress).normalize();

      movement.object.position.set(position.x, position.y + movement.offsetY, position.z);

      if (movement.faceForward && tangent.lengthSq() > 0.00001) {
        const direction = movement.reverse ? tangent.multiplyScalar(-1) : tangent;
        movement.object.rotation.y = Math.atan2(direction.x, direction.z);
      }

      movement.onUpdate?.({
        object: movement.object,
        elapsed: movement.simTime,
        progress,
        isMoving,
        held: movement.held,
        movement
      });

      if (!movement.loop && localTime >= movement.duration + movement.pause) {
        movement.finished = true;
      }
    });
  }

  createIndustrialRoundedCurve(points, closed, requestedRadius) {
    const path = new THREE.CurvePath();
    const safePoints = points.map((point) => point.clone());

    if (safePoints.length === 2 && !closed) {
      path.add(new THREE.LineCurve3(safePoints[0], safePoints[1]));
      return path;
    }

    const getCorner = (index) => {
      const count = safePoints.length;
      const previous = safePoints[(index - 1 + count) % count];
      const current = safePoints[index];
      const next = safePoints[(index + 1) % count];
      const incomingLength = current.distanceTo(previous);
      const outgoingLength = current.distanceTo(next);
      const radius = Math.min(requestedRadius, incomingLength * 0.32, outgoingLength * 0.32);
      const entryDirection = previous.clone().sub(current).normalize();
      const exitDirection = next.clone().sub(current).normalize();

      return {
        center: current,
        entry: current.clone().addScaledVector(entryDirection, radius),
        exit: current.clone().addScaledVector(exitDirection, radius)
      };
    };

    if (closed) {
      const corners = safePoints.map((_, index) => getCorner(index));
      for (let index = 0; index < corners.length; index++) {
        const previousCorner = corners[(index - 1 + corners.length) % corners.length];
        const currentCorner = corners[index];
        path.add(new THREE.LineCurve3(previousCorner.exit, currentCorner.entry));
        path.add(new THREE.QuadraticBezierCurve3(currentCorner.entry, currentCorner.center, currentCorner.exit));
      }
      return path;
    }

    let segmentStart = safePoints[0];
    for (let index = 1; index < safePoints.length - 1; index++) {
      const corner = getCorner(index);
      path.add(new THREE.LineCurve3(segmentStart, corner.entry));
      path.add(new THREE.QuadraticBezierCurve3(corner.entry, corner.center, corner.exit));
      segmentStart = corner.exit;
    }
    path.add(new THREE.LineCurve3(segmentStart, safePoints[safePoints.length - 1]));
    return path;
  }
}
