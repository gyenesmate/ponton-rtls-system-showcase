/**
 * Declarative default warehouse site — clean orthogonal industrial floor plan.
 * Neutral schematic for RTLS overlays (paths, zones, tags). No Three.js types.
 *
 * World conventions (see docs/plans/rtls-showcase-foundation.md):
 * - Y-up, units = meters, floor top ≈ y = 0
 * - Origin at footprint center (0, 0, 0)
 * - x ∈ [-width/2, width/2], z ∈ [-depth/2, depth/2] (default ±22 × ±15)
 * - −z = back, +z = front; agent local forward = +Z
 * - Optional site.grid.cellSize (default 2) for authoring snap / viz
 */

export const DEFAULT_SITE_OBJECTS = Object.freeze([
  {
    id: 'forklift-a',
    type: 'forklift',
    model: 'forklift',
    color: 'color4',
    routeId: 'forklift-route-a',
    movement: { duration: 18, delay: 0, pause: 2.5, offsetY: 0.02 },
    tracking: { label: 'Forklift A', cycleOffset: 0, ringRadius: 1.15, ringY: 0.055 }
  },
  {
    id: 'forklift-b',
    type: 'forklift',
    model: 'forklift',
    color: 'color6',
    routeId: 'forklift-route-b',
    movement: { duration: 19, delay: 4, pause: 2.5, offsetY: 0.02 },
    tracking: { label: 'Forklift B', cycleOffset: 1.2, ringRadius: 1.15, ringY: 0.055 }
  },
  {
    id: 'worker',
    type: 'worker',
    model: 'worker',
    routeId: 'worker-center-loop',
    movement: { duration: 22, delay: 0, pause: 0, offsetY: 0.02, walkCycle: true },
    tracking: { label: 'Tracked Worker', cycleOffset: 2.4, ringRadius: 0.72, ringY: 0.05 }
  },
  {
    id: 'amr',
    type: 'amr',
    model: 'amr',
    routeId: 'amr-container-route',
    movement: { duration: 22, delay: 2, pause: 2.5, offsetY: 0.02 },
    tracking: {
      label: 'Tagged Container',
      trackCargo: true,
      cycleOffset: 3.6,
      ringRadius: 1.05,
      ringY: 0.055
    }
  }
]);

export const ASSET_TRACKING_OBJECTS = Object.freeze(
  DEFAULT_SITE_OBJECTS.filter((object) => object.type !== 'worker')
);

const W = 44;
const D = 30;
const EDGE_X = W / 2 - 0.5; // 21.5
const EDGE_Z = D / 2 - 0.5; // 14.5

/** Axis-aligned wall segment helper. */
function wall(x1, z1, x2, z2) {
  return Object.freeze({ x1, z1, x2, z2 });
}

/** Machine block helper (axis-aligned). */
function machine(x, z, sx, sz, sy = 2.3) {
  return Object.freeze({ x, z, sx, sy, sz });
}

export const defaultWarehouseSite = Object.freeze({
  orientationY: 0,

  warehouse: Object.freeze({
    width: W,
    depth: D,
    wallHeight: 10,
    wallThickness: 0.55,
    doorHeight: 6.6,
    backDoor: Object.freeze({ center: 0, width: 7.0 }),
    leftDoor: Object.freeze({ center: 0, width: 6.5 }),
    partition: null,
    labels: Object.freeze([])
  }),

  /**
   * Orthogonal interior partitions only (90° corners).
   * Outer building border is drawn separately by the livemap.
   */
  interiorWalls: Object.freeze([
    // Upper-left L: vertical then inward (toward center)
    wall(-8.5, -14.0, -8.5, -3.5),
    wall(-8.5, -3.5, -1.5, -3.5),

    // Upper-right L: vertical then inward (toward center)
    wall(10.0, -14.0, 10.0, -3.5),
    wall(10.0, -3.5, 3.0, -3.5),

    // Lower bay / stepped walls forming a wide U open to the center
    wall(-EDGE_X, 5.0, -9.5, 5.0),
    wall(-9.5, 5.0, -9.5, 11.5),
    wall(-9.5, 11.5, 9.5, 11.5),
    wall(9.5, 11.5, 9.5, 5.0),
    wall(9.5, 5.0, EDGE_X, 5.0)
  ]),

  machines: Object.freeze([
    // Upper-left: 2×2 medium horizontal blocks, generous spacing
    machine(-16.5, -11.0, 4.2, 2.2),
    machine(-11.0, -11.0, 4.2, 2.2),
    machine(-16.5, -7.0, 4.2, 2.2),
    machine(-11.0, -7.0, 4.2, 2.2),

    // Upper-center: 3 tall narrow racks in a row
    machine(-2.5, -11.0, 1.6, 3.6),
    machine(1.5, -11.0, 1.6, 3.6),
    machine(5.5, -11.0, 1.6, 3.6),

    // Upper-right: 2 long horizontal racks stacked
    machine(15.5, -11.0, 5.5, 2.0),
    machine(15.5, -7.0, 5.5, 2.0),

    // Center: one large workstation (worker circulates around it)
    machine(0.0, 0.0, 12.0, 5.0, 2.8),

    // Lower-left: compact cluster (~3 blocks)
    machine(-16.5, 7.5, 3.0, 2.4),
    machine(-16.5, 11.0, 3.0, 2.4),
    machine(-12.5, 9.0, 3.0, 2.4),

    // Lower-right: sparse 2–3 blocks
    machine(14.0, 7.5, 3.4, 2.4),
    machine(18.0, 7.5, 3.4, 2.4),
    machine(16.0, 11.0, 4.0, 2.2),

    // Lower-center: three medium horizontals below the bay wall
    machine(-5.0, 13.5, 4.0, 1.8),
    machine(0.0, 13.5, 4.0, 1.8),
    machine(5.0, 13.5, 4.0, 1.8)
  ]),

  infrastructure: Object.freeze({
    controlUnderAnchorId: 'anchor-back-3',
    anchors: Object.freeze([
      Object.freeze({ id: 'anchor-back-0', x: -18.0, y: 7.1, z: -14.68, wall: 'back' }),
      Object.freeze({ id: 'anchor-back-1', x: -8.0, y: 7.1, z: -14.68, wall: 'back' }),
      Object.freeze({ id: 'anchor-back-2', x: 2.0, y: 7.1, z: -14.68, wall: 'back' }),
      Object.freeze({ id: 'anchor-back-3', x: 17.5, y: 7.1, z: -14.68, wall: 'back' }),
      Object.freeze({ id: 'anchor-left-0', x: -21.68, y: 7.1, z: -10.0, wall: 'left' }),
      Object.freeze({ id: 'anchor-left-1', x: -21.68, y: 7.1, z: 0.0, wall: 'left' }),
      Object.freeze({ id: 'anchor-left-2', x: -21.68, y: 7.1, z: 10.0, wall: 'left' })
    ])
  }),

  /**
   * Inner circulation only. Haul routes start and end at the map border.
   * Worker path is a closed loop around the central machine.
   */
  routes: Object.freeze([
    // West aisle: top border → bottom border (between UL equipment and center)
    Object.freeze({
      id: 'forklift-route-a',
      points: Object.freeze([
        Object.freeze([-6.0, 0.05, -EDGE_Z]),
        Object.freeze([-6.0, 0.05, -2.0]),
        Object.freeze([-6.0, 0.05, 3.0]),
        Object.freeze([-6.0, 0.05, EDGE_Z])
      ]),
      visible: true,
      width: 1.5,
      cornerRadius: 0.25,
      baseColor: 'color3',
      accentColor: 'color5'
    }),
    // Mid horizontal aisle: left border → right border (south of center machine)
    Object.freeze({
      id: 'forklift-route-b',
      points: Object.freeze([
        Object.freeze([-EDGE_X, 0.05, 3.0]),
        Object.freeze([-6.0, 0.05, 3.0]),
        Object.freeze([7.0, 0.05, 3.0]),
        Object.freeze([EDGE_X, 0.05, 3.0])
      ]),
      visible: true,
      width: 1.5,
      cornerRadius: 0.25,
      baseColor: 'color3',
      accentColor: 'color5'
    }),
    // East aisle: top border → bottom border
    Object.freeze({
      id: 'amr-container-route',
      points: Object.freeze([
        Object.freeze([7.0, 0.06, -EDGE_Z]),
        Object.freeze([7.0, 0.06, -2.0]),
        Object.freeze([7.0, 0.06, 3.0]),
        Object.freeze([7.0, 0.06, EDGE_Z])
      ]),
      visible: true,
      width: 1.35,
      cornerRadius: 0.25,
      baseColor: 'color3',
      accentColor: 'color5'
    }),
    // Human circulates the central workstation
    Object.freeze({
      id: 'worker-center-loop',
      points: Object.freeze([
        Object.freeze([-8.0, 0.02, -4.0]),
        Object.freeze([8.0, 0.02, -4.0]),
        Object.freeze([8.0, 0.02, 4.0]),
        Object.freeze([-8.0, 0.02, 4.0])
      ]),
      visible: false,
      closed: true,
      cornerRadius: 0.5
    })
  ]),

  intersections: Object.freeze([
    Object.freeze({
      id: 'cross-west-mid',
      x: -6.0,
      z: 3.0,
      approachRadius: 3.0,
      routeIds: Object.freeze(['forklift-route-a', 'forklift-route-b'])
    }),
    Object.freeze({
      id: 'cross-east-mid',
      x: 7.0,
      z: 3.0,
      approachRadius: 3.0,
      routeIds: Object.freeze(['amr-container-route', 'forklift-route-b'])
    })
  ]),

  zones: Object.freeze([]),

  objects: DEFAULT_SITE_OBJECTS
});

export function withSite(overrides = {}) {
  return {
    ...defaultWarehouseSite,
    ...overrides,
    warehouse: { ...defaultWarehouseSite.warehouse, ...(overrides.warehouse || {}) },
    grid: { ...(defaultWarehouseSite.grid || {}), ...(overrides.grid || {}) },
    infrastructure: {
      ...defaultWarehouseSite.infrastructure,
      ...(overrides.infrastructure || {}),
      anchors: overrides.infrastructure?.anchors || defaultWarehouseSite.infrastructure.anchors
    },
    machines: overrides.machines || defaultWarehouseSite.machines,
    routes: overrides.routes || defaultWarehouseSite.routes,
    intersections: overrides.intersections || defaultWarehouseSite.intersections,
    zones: overrides.zones || defaultWarehouseSite.zones,
    interiorWalls: overrides.interiorWalls || defaultWarehouseSite.interiorWalls,
    objects: overrides.objects || defaultWarehouseSite.objects
  };
}
