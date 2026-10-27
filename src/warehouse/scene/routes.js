import { snappedVector3, DEFAULT_CELL_SIZE } from '../../shared/grid.js';

/**
 * @param {import('../RouteManager.js').RouteManager} routeManager
 * @param {object} palette
 * @param {Array<object>} routes
 * @param {number} [cellSize]
 */
export function createMovementRoutes(routeManager, palette, routes = [], cellSize = DEFAULT_CELL_SIZE) {
  routes.forEach((route) => {
    routeManager.registerRoute({
      id: route.id,
      points: (route.points || []).map(([x, y, z]) => snappedVector3(x, y, z, cellSize)),
      visible: route.visible !== false,
      closed: route.closed === true,
      width: route.width ?? 1.4,
      cornerRadius: route.cornerRadius ?? 0.55,
      baseColor: palette[route.baseColor] ?? palette.color3,
      accentColor: palette[route.accentColor] ?? palette.color4
    });
  });
}

/**
 * @param {import('../IntersectionController.js').IntersectionController} intersectionController
 * @param {Array<object>} intersections
 */
export function registerRouteIntersections(intersectionController, intersections = []) {
  intersections.forEach((crossing) => {
    intersectionController.register({
      id: crossing.id,
      position: { x: crossing.x, z: crossing.z },
      approachRadius: crossing.approachRadius ?? 2.2,
      routeIds: crossing.routeIds || null
    });
  });
}
