import * as THREE from 'three';
import { addEdges } from '../../../../shared/geometry.ts';
import { ASSET_BUDGETS } from '../../../../shared/constants.ts';
import type { ModelRegistry } from '../../../../core/models/index.ts';
import type { Palette } from '../types.ts';

interface Machine {
  x: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  model?: string;
}

type MachineEntry = { machine: Machine; index: number };

export function createMachineLayout(
  parent: THREE.Object3D,
  palette: Palette,
  machines: Machine[] = [],
  options: { modelRegistry?: ModelRegistry | null } = {}
) {
  const { modelRegistry = null } = options;
  const results: THREE.Object3D[] = [];
  /** Per-layout material share (avoid module-global caches that outlive dispose). */
  const materials = new Map<number, THREE.MeshStandardMaterial>();

  function materialFor(color: number) {
    if (!materials.has(color)) {
      materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.03 })
      );
    }
    return materials.get(color)!;
  }

  // Group identical box sizes for InstancedMesh when count justifies it.
  const groups = new Map<string, MachineEntry[]>();
  machines.forEach((machine, index) => {
    const key = `${machine.sx}|${machine.sy}|${machine.sz}|${index % 3}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ machine, index });
  });

  groups.forEach((entries) => {
    const { sx, sy, sz } = entries[0].machine;
    const color = entries[0].index % 3 === 0 ? palette.color5 : palette.color3;

    if (entries.length >= ASSET_BUDGETS.instanceMinCount && !entries.some((e) => e.machine.model)) {
      results.push(...createInstancedMachines(parent, entries, { sx, sy, sz, color: materialFor(color) }));
      return;
    }

    entries.forEach(({ machine }) => {
      const mesh = createMachineCube(parent, palette, machine, materialFor(color));
      results.push(mesh);
      if (machine.model && modelRegistry) {
        swapMachineModel(parent, mesh, machine, modelRegistry);
      }
    });
  });

  return results;
}

function createInstancedMachines(
  parent: THREE.Object3D,
  entries: MachineEntry[],
  { sx, sy, sz, color }: { sx: number; sy: number; sz: number; color: THREE.Material }
) {
  const geometry = new THREE.BoxGeometry(sx, sy, sz);
  const instanced = new THREE.InstancedMesh(geometry, color, entries.length);
  instanced.castShadow = true;
  instanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  entries.forEach(({ machine }, i) => {
    dummy.position.set(machine.x, machine.sy / 2, machine.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  });
  instanced.instanceMatrix.needsUpdate = true;
  parent.add(instanced);

  // Edges are per-mesh elsewhere; skip on instances (draw-call budget).
  return [instanced];
}

function createMachineCube(
  parent: THREE.Object3D,
  palette: Palette,
  { x, z, sx, sy, sz }: Pick<Machine, 'x' | 'z' | 'sx' | 'sy' | 'sz'>,
  material: THREE.Material
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, sy / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  addEdges(mesh, palette.color6, 0.45);
  return mesh;
}

function swapMachineModel(
  parent: THREE.Object3D,
  placeholder: THREE.Mesh,
  machine: Machine,
  modelRegistry: ModelRegistry
) {
  modelRegistry.acquire(machine.model!).then((model) => {
    if (!model || !placeholder.parent) return;
    model.position.set(machine.x, 0, machine.z);
    parent.add(model);
    parent.remove(placeholder);
    placeholder.geometry?.dispose?.();
    // Material may be shared across machines in this layout — do not dispose here.
  });
}
