/**
 * Export current procedural warehouse objects to public/assets/models/*.glb
 * Run: npm run export:models
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { Blob } from 'node:buffer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter binary path expects browser Blob/FileReader APIs.
if (!globalThis.Blob) globalThis.Blob = Blob;
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onerror = null;
    }

    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer())
        .then((buffer) => {
          this.result = buffer;
          this.onloadend?.({ target: this });
        })
        .catch((error) => {
          this.onerror?.(error);
        });
    }
  };
}
import { PALETTE } from '../src/shared/constants.js';
import { createForklift } from '../src/warehouse/models/forklift.js';
import { createWorker } from '../src/warehouse/models/worker.js';
import { createAmrTransport } from '../src/warehouse/models/amr.js';
import { createIndustrialStorageContainer } from '../src/warehouse/models/container.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'assets', 'models');

const noopTags = {
  addTrackingTag() {
    /* RTLS overlays are runtime-only — not baked into GLB */
  }
};

function stripNonMesh(root) {
  const remove = [];
  root.traverse((obj) => {
    if (obj.isLine || obj.isLineSegments || obj.isLineLoop || obj.isPoints) {
      remove.push(obj);
    }
  });
  remove.forEach((obj) => obj.parent?.remove(obj));
}

function exportBinary(object) {
  stripNonMesh(object);
  // Export at unit scale — runtime applies MODEL_DISPLAY_SCALE on the host.
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(Buffer.from(result));
        else reject(new Error('Expected binary GLB ArrayBuffer'));
      },
      (error) => reject(error),
      { binary: true, onlyVisible: true }
    );
  });
}

async function writeModel(filename, factory) {
  const object = factory();
  const buffer = await exportBinary(object);
  const path = join(outDir, filename);
  await writeFile(path, buffer);
  console.log(`wrote ${filename} (${buffer.byteLength} bytes)`);
}

await mkdir(outDir, { recursive: true });

await writeModel('forklift.glb', () => createForklift(PALETTE.color4, PALETTE, noopTags));
await writeModel('worker.glb', () => createWorker(PALETTE, noopTags));
await writeModel('amr.glb', () => createAmrTransport(PALETTE, noopTags));
await writeModel('container.glb', () => createIndustrialStorageContainer(PALETTE, noopTags));

console.log('export-procedural-models: done');
