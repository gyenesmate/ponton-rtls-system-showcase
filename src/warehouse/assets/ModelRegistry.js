import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl } from '../../shared/assetUrl.js';
import { ASSET_BUDGETS } from '../../shared/constants.js';
import { modelLoadDebug } from '../../shared/devDebugger.js';

const DEFAULT_META = Object.freeze({
  scale: 1,
  yawOffset: 0
});

/**
 * Loads and caches glTF/GLB prototypes. Callers receive clones.
 * Failures resolve to null so procedural factories remain the fallback.
 */
export class ModelRegistry {
  constructor({ timeoutMs = ASSET_BUDGETS.loadTimeoutMs } = {}) {
    this.timeoutMs = timeoutMs;
    this.manager = new THREE.LoadingManager();
    this.loader = new GLTFLoader(this.manager);
    /** @type {Map<string, Promise<THREE.Object3D|null>>} */
    this._loading = new Map();
    /** @type {Map<string, THREE.Object3D>} */
    this._prototypes = new Map();
    /** @type {Map<string, object>} */
    this._meta = new Map();

    this.manager.onStart = (url, loaded, total) => {
      modelLoadDebug('manager-start', { url, loaded, total });
    };
    this.manager.onLoad = () => {
      modelLoadDebug('manager-all-loaded', {});
    };
    this.manager.onError = (url) => {
      modelLoadDebug('manager-error', { url, ok: false });
    };
  }

  /**
   * @param {string} key Registry key (maps to assets/models/<key>.glb)
   * @param {object} [meta] Optional scale / yawOffset
   * @returns {Promise<THREE.Object3D|null>}
   */
  acquire(key, meta = {}) {
    if (!key) {
      modelLoadDebug('acquire-skip', { key, reason: 'empty-key', ok: false });
      return Promise.resolve(null);
    }

    if (this._prototypes.has(key)) {
      modelLoadDebug('cache-hit', { key, source: 'prototype' });
      const clone = this.cloneKey(key);
      modelLoadDebug('clone', { key, ok: Boolean(clone), source: 'cache' });
      return Promise.resolve(clone);
    }

    if (!this._loading.has(key)) {
      this._meta.set(key, { ...DEFAULT_META, ...meta });
      modelLoadDebug('cache-miss', { key, source: 'network' });
      this._loading.set(key, this.loadKey(key));
    } else {
      modelLoadDebug('in-flight', { key, source: 'deduped-promise' });
    }

    return this._loading.get(key).then((proto) => {
      if (!proto) {
        modelLoadDebug('acquire-null', { key, ok: false });
        return null;
      }
      const clone = this.cloneKey(key);
      modelLoadDebug('clone', { key, ok: Boolean(clone), source: 'fresh-load' });
      return clone;
    });
  }

  preload(keys = []) {
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

  cloneKey(key) {
    const proto = this._prototypes.get(key);
    if (!proto) return null;
    const clone = proto.clone(true);
    clone.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return clone;
  }

  loadKey(key) {
    const url = assetUrl(`assets/models/${key}.glb`);
    const meta = this._meta.get(key) || DEFAULT_META;
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
    const finish = (proto, stage, extra = {}) => {
      if (settled) return;
      settled = true;
      modelLoadDebug(stage, {
        key,
        url,
        ok: Boolean(proto),
        ms: performance.now() - started,
        ...extra
      });
    };

    const loadPromise = new Promise((resolve) => {
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
          if (meta.scale != null && meta.scale !== 1) {
            root.scale.multiplyScalar(meta.scale);
          }
          if (meta.yawOffset) root.rotation.y += meta.yawOffset;
          this._prototypes.set(key, root);
          finish(root, 'fetch-ok', {
            children: root.children?.length ?? 0,
            scale: { x: root.scale.x, y: root.scale.y, z: root.scale.z }
          });
          resolve(root);
        },
        (event) => {
          if (!event?.total) return;
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
            error: error?.message || String(error)
          });
          resolve(null);
        }
      );
    });

    const timeout = new Promise((resolve) => {
      setTimeout(() => {
        // Do not mark settled — a late fetch-ok should still log and fill the cache.
        if (!this._prototypes.has(key)) {
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

    return Promise.race([loadPromise, timeout]).then((proto) => {
      const cached = this._prototypes.get(key);
      if (!cached && !proto) {
        this._loading.delete(key);
        modelLoadDebug('load-cleared', { key, reason: 'failed-or-timeout', ok: false });
      }
      // Prefer a late success that landed in the cache after a timeout race.
      return cached || proto;
    });
  }

  dispose() {
    modelLoadDebug('registry-dispose', {
      prototypes: [...this._prototypes.keys()]
    });
    this._prototypes.forEach((proto) => {
      proto.traverse((object) => {
        object.geometry?.dispose?.();
        const { material } = object;
        if (Array.isArray(material)) material.forEach((entry) => entry?.dispose?.());
        else material?.dispose?.();
      });
    });
    this._prototypes.clear();
    this._loading.clear();
    this._meta.clear();
  }
}
