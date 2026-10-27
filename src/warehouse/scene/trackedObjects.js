import * as THREE from 'three';
import { createForklift } from '../models/forklift.js';
import { createWorker } from '../models/worker.js';
import { createAmrTransport } from '../models/amr.js';
import { MODEL_DISPLAY_SCALE } from '../models/displayScale.js';
import { modelLoadDebug } from '../../shared/devDebugger.js';

const FACTORIES = {
  forklift: (spec, palette, trackingTags) =>
    createForklift(palette[spec.color] || palette.color4, palette, trackingTags),
  worker: (_spec, palette, trackingTags) => createWorker(palette, trackingTags),
  amr: (_spec, palette, trackingTags) => createAmrTransport(palette, trackingTags)
};

/** Tag placements matching procedural factories (runtime overlays, not baked into GLB). */
const TAG_BY_TYPE = {
  forklift: {
    position: new THREE.Vector3(-0.34, 2.51, -0.3),
    size: new THREE.Vector3(0.34, 0.13, 0.34),
    signalPosition: new THREE.Vector3(-0.34, 2.78, -0.3)
  },
  worker: {
    position: new THREE.Vector3(0.31, 1.48, 0.2),
    size: new THREE.Vector3(0.18, 0.12, 0.08),
    signalPosition: new THREE.Vector3(0.31, 1.78, 0.2),
    signalScale: 0.72
  },
  cargo: {
    position: new THREE.Vector3(0.72, 1.63, 0.38),
    size: new THREE.Vector3(0.32, 0.12, 0.32),
    signalPosition: new THREE.Vector3(0.72, 1.9, 0.38),
    signalScale: 0.9
  }
};

/**
 * Builds tracked agents from scenario site.objects.
 * When `model` is set: load GLB first; procedural factory only if load fails.
 *
 * @returns {Promise<Record<string, THREE.Object3D>>}
 */
export async function createTrackedObjects({
  scene,
  palette,
  routeManager,
  trackingTags,
  detectionVisualizer,
  objects = [],
  modelRegistry = null
}) {
  const assets = {};
  const modelKeys = [...new Set(objects.map((spec) => spec.model).filter(Boolean))];

  modelLoadDebug('tracked-objects-start', {
    objectCount: objects.length,
    modelKeys,
    hasRegistry: Boolean(modelRegistry)
  });

  if (modelRegistry && modelKeys.length) {
    await modelRegistry.preload(modelKeys);
  }

  for (const spec of objects) {
    const factory = FACTORIES[spec.type];
    if (!factory) {
      console.warn(`[RTLS Showcase] Unknown object type: ${spec.type}`);
      continue;
    }

    let object = null;
    let source = 'procedural';

    if (spec.model && modelRegistry) {
      const model = await modelRegistry.acquire(spec.model);
      if (model) {
        object = buildHostFromModel(model, spec, trackingTags);
        source = 'glb';
        modelLoadDebug('agent-bound', {
          key: spec.model,
          id: spec.id,
          type: spec.type,
          source,
          scale: MODEL_DISPLAY_SCALE[spec.type] ?? 1,
          ok: true
        });
      } else {
        console.warn(
          `[RTLS Showcase] Model "${spec.model}" unavailable — using procedural "${spec.type}"`
        );
        modelLoadDebug('fallback-procedural', {
          key: spec.model,
          id: spec.id,
          type: spec.type,
          ok: false,
          reason: 'acquire-returned-null'
        });
      }
    }

    if (!object) {
      object = factory(spec, palette, trackingTags);
      source = 'procedural';
      if (!spec.model) {
        modelLoadDebug('agent-bound', {
          id: spec.id,
          type: spec.type,
          source,
          reason: 'no-model-key'
        });
      }
    }

    scene.add(object);
    assets[spec.id] = object;

    const tracking = spec.tracking || {};
    const trackedTarget =
      tracking.trackCargo && object.userData.cargo ? object.userData.cargo : object;

    detectionVisualizer.registerTrackedAsset(trackedTarget, {
      label: tracking.label || spec.id,
      ringTarget: tracking.trackCargo ? object : trackedTarget,
      cycleOffset: tracking.cycleOffset ?? 0,
      ringRadius: tracking.ringRadius ?? 1,
      ringY: tracking.ringY ?? 0.05
    });

    if (spec.routeId) {
      const movement = { ...(spec.movement || {}) };
      let onUpdate = null;

      if (spec.type === 'worker' || movement.walkCycle) {
        onUpdate = ({ object: agent, elapsed, isMoving }) => {
          const swing = isMoving ? Math.sin(elapsed * 7.2) * 0.55 : 0;
          if (!agent.userData.leftArm) return;
          agent.userData.leftArm.rotation.x = swing;
          agent.userData.rightArm.rotation.x = -swing;
          agent.userData.leftLeg.rotation.x = -swing;
          agent.userData.rightLeg.rotation.x = swing;
        };
        delete movement.walkCycle;
      }

      routeManager.assignObjectToRoute(object, spec.routeId, {
        agentId: spec.id,
        ...movement,
        onUpdate
      });
    }
  }

  modelLoadDebug('tracked-objects-done', {
    agents: Object.keys(assets),
    count: Object.keys(assets).length
  });

  return assets;
}

/**
 * Wrap a loaded GLB in a host group at the same display scale as the procedural factory.
 */
function buildHostFromModel(model, spec, trackingTags) {
  const host = new THREE.Group();
  host.name = spec.id;

  // GLBs are authored at unit scale; match procedural factory scale on the host.
  const displayScale = MODEL_DISPLAY_SCALE[spec.type] ?? 1;
  host.scale.setScalar(displayScale);

  normalizeModelRoot(model);
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  host.add(model);

  const cargo = model.getObjectByName('cargo');
  if (cargo) host.userData.cargo = cargo;

  for (const key of ['leftArm', 'rightArm', 'leftLeg', 'rightLeg']) {
    const part = model.getObjectByName(key);
    if (part) host.userData[key] = part;
  }

  if (spec.type === 'amr' && host.userData.cargo) {
    trackingTags.addTrackingTag(host.userData.cargo, TAG_BY_TYPE.cargo);
  } else if (TAG_BY_TYPE[spec.type]) {
    trackingTags.addTrackingTag(host, TAG_BY_TYPE[spec.type]);
  }

  return host;
}

/** Ensure imported roots do not carry a baked display scale (host applies it). */
function normalizeModelRoot(model) {
  const displayScales = Object.values(MODEL_DISPLAY_SCALE);
  model.traverse((node) => {
    const { x, y, z } = node.scale;
    if (Math.abs(x - y) > 1e-5 || Math.abs(x - z) > 1e-5) return;
    if (displayScales.some((scale) => Math.abs(x - scale) < 1e-5)) {
      node.scale.set(1, 1, 1);
    }
  });
  model.scale.set(1, 1, 1);
}
