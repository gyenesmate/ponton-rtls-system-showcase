import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl } from '../../shared/assetUrl.ts';
import { ASSET_BUDGETS } from '../../shared/constants.ts';
import { modelLoadDebug } from '../../shared/devDebugger.ts';

/** Public URL segment under Vite publicDir / dist. */
export const MODELS_PUBLIC_PREFIX = 'models';

export interface ModelMeta {
  scale?: number;
  yawOffset?: number;
}

const DEFAULT_META: Required<ModelMeta> = Object.freeze({
  scale: 1,
  yawOffset: 0
});

/** Loads and caches glTF/GLB prototypes. Callers receive clones. */
export class ModelRegistry {
  readonly timeoutMs: number;
  readonly manager = new THREE.LoadingManager();
  readonly loader = new GLTFLoader(this.manager);
  private readonly loading = new Map<string, Promise<THREE.Object3D | null>>();
  private readonly prototypes = new Map<string, THREE.Object3D>();
  private readonly meta = new Map<string, Required<ModelMeta>>();

  constructor({ timeoutMs = ASSET_BUDGETS.loadTimeoutMs }: { timeoutMs?: number } = {}) {
    this.timeoutMs = timeoutMs;
    this.manager.onStart = (url, loaded, total) => {
      modelLoadDebug('manager-start', { url, loaded, total });
    };
    this.manager.onLoad = () => modelLoadDebug('manager-all-loaded', {});
    this.manager.onError = (url) => modelLoadDebug('manager-error', { url, ok: false });
  }

  acquire(key: string, meta: ModelMeta = {}): Promise<THREE.Object3D | null> {
    if (!key) {
      modelLoadDebug('acquire-skip', { key, reason: 'empty-key', ok: false });
      return Promise.resolve(null);
    }

    if (this.prototypes.has(key)) {
      modelLoadDebug('cache-hit', { key, source: 'prototype' });
      const clone = this.cloneKey(key);
      modelLoadDebug('clone', { key, ok: Boolean(clone), source: 'cache' });
      return Promise.resolve(clone);
    }

    if (!this.loading.has(key)) {
      this.meta.set(key, { ...DEFAULT_META, ...meta });
      modelLoadDebug('cache-miss', { key, source: 'network' });
      this.loading.set(key, this.loadKey(key));
    } else {
      modelLoadDebug('in-flight', { key, source: 'deduped-promise' });
    }

    return this.loading.get(key)!.then((prototype) => {
      if (!prototype) {
        modelLoadDebug('acquire-null', { key, ok: false });
        return null;
      }
      const clone = this.cloneKey(key);
      modelLoadDebug('clone', { key, ok: Boolean(clone), source: 'fresh-load' });
      return clone;
    });
  }

  preload(keys: string[] = []): Promise<Array<THREE.Object3D | null>> {
    modelLoadDebug('preload-start', { keys: [...keys], count: keys.length });
    const started = performance.now();
    return Promise.all(keys.map((key) => this.acquire(key))).then((results) => {
      modelLoadDebug('preload-done', {
        keys: [...keys],
        ok: results.every(Boolean),
        loaded: results.filter(Boolean).length,
        failed: results.filter((item) => !item).length,
        ms: performance.now() - started
      });
      return results;
    });
  }

  private cloneKey(key: string): THREE.Object3D | null {
    const prototype = this.prototypes.get(key);
    if (!prototype) return null;
    const clone = prototype.clone(true);
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return clone;
  }

  private loadKey(key: string): Promise<THREE.Object3D | null> {
    const url = assetUrl(`${MODELS_PUBLIC_PREFIX}/${key}.glb`);
    const meta = this.meta.get(key) ?? DEFAULT_META;
    const started = performance.now();

    modelLoadDebug('resolve-url', {
      key,
      url,
      env: import.meta.env.DEV ? 'dev' : 'prod',
      baseUrl: import.meta.env.BASE_URL,
      importMetaUrl: import.meta.url,
      timeoutMs: this.timeoutMs
    });

    let settled = false;
    const finish = (
      prototype: THREE.Object3D | null,
      stage: string,
      extra: Record<string, unknown> = {}
    ) => {
      if (settled) return;
      settled = true;
      modelLoadDebug(stage, {
        key,
        url,
        ok: Boolean(prototype),
        ms: performance.now() - started,
        ...extra
      });
    };

    const loadPromise = new Promise<THREE.Object3D | null>((resolve) => {
      modelLoadDebug('fetch-start', { key, url });
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene || gltf.scenes?.[0];
          if (!root) {
            console.warn(`[RTLS Showcase] Empty GLB for model "${key}"`);
            finish(null, 'fetch-empty');
            resolve(null);
            return;
          }
          if (meta.scale !== 1) root.scale.multiplyScalar(meta.scale);
          if (meta.yawOffset) root.rotation.y += meta.yawOffset;
          this.prototypes.set(key, root);
          finish(root, 'fetch-ok', {
            children: root.children.length,
            scale: { x: root.scale.x, y: root.scale.y, z: root.scale.z }
          });
          resolve(root);
        },
        (event) => {
          if (!event.total) return;
          modelLoadDebug('fetch-progress', {
            key,
            url,
            loaded: event.loaded,
            total: event.total,
            pct: Math.round((event.loaded / event.total) * 100)
          });
        },
        (error) => {
          console.warn(`[RTLS Showcase] Failed to load model "${key}":`, error);
          finish(null, 'fetch-fail', {
            error: error instanceof Error ? error.message : String(error)
          });
          resolve(null);
        }
      );
    });

    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => {
        if (!this.prototypes.has(key)) {
          modelLoadDebug('fetch-timeout', {
            key,
            url,
            ok: false,
            ms: performance.now() - started,
            timeoutMs: this.timeoutMs
          });
        }
        resolve(null);
      }, this.timeoutMs);
    });

    return Promise.race([loadPromise, timeout]).then((prototype) => {
      const cached = this.prototypes.get(key);
      if (!cached && !prototype) {
        this.loading.delete(key);
        modelLoadDebug('load-cleared', { key, reason: 'failed-or-timeout', ok: false });
      }
      return cached ?? prototype;
    });
  }

  dispose(): void {
    modelLoadDebug('registry-dispose', { prototypes: [...this.prototypes.keys()] });
    this.prototypes.forEach((prototype) => {
      prototype.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const { material } = object;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      });
    });
    this.prototypes.clear();
    this.loading.clear();
    this.meta.clear();
  }
}
