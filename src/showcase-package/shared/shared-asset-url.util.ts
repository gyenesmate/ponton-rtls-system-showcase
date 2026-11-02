/**
 * Resolve a static asset path for Vite preview and WordPress dist.
 * Put files under public/ (e.g. public/models/forklift.glb).
 */
export function assetUrl(path: string): string {
  const clean = String(path || '').replace(/^\/+/, '');

  if (import.meta.env.DEV) {
    const base = import.meta.env.BASE_URL || '/';
    return `${base}${clean}`.replace(/([^:]\/)\/+/g, '$1');
  }

  // Production bundle lives in dist/; public files are copied next to it.
  return new URL(clean, import.meta.url).href;
}
