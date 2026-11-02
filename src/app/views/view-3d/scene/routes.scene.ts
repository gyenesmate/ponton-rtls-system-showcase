import * as THREE from 'three';
import { DEFAULT_CELL_SIZE, snapToGrid } from '../../../../showcase-package/grid-system/grid-system.index.ts';
import type { IntersectionController } from '../intersection.controller.ts';
import type { RouteManager } from '../route.controller.ts';
import type { Palette, SiteEntry } from '../view-3d.types.ts';

export function createMovementRoutes(
  routeManager: RouteManager,
  palette: Palette,
  routes: SiteEntry[] = [],
  cellSize = DEFAULT_CELL_SIZE
) {
  routes.forEach((route) => {
    routeManager.registerRoute({
      id: route.id,
      points: (route.points || []).map(
        ([x, y, z]: number[]) => new THREE.Vector3(snapToGrid(x, cellSize), y, snapToGrid(z, cellSize))
      ),
      visible: route.visible !== false,
      closed: route.closed === true,
      width: route.width ?? 1.4,
      cornerRadius: route.cornerRadius ?? 0.55,
      baseColor: palette[route.baseColor] ?? palette.color3,
      accentColor: palette[route.accentColor] ?? palette.color4
    });
  });
}

export function registerRouteIntersections(
  intersectionController: IntersectionController,
  intersections: SiteEntry[] = []
) {
  intersections.forEach((crossing) => {
    intersectionController.register({
      id: crossing.id,
      position: { x: crossing.x, z: crossing.z },
      approachRadius: crossing.approachRadius ?? 2.2,
      routeIds: crossing.routeIds || null
    });
  });
}
