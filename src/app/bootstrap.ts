import { Showcase } from './showcase.ts';
import type { ShowcaseOptions } from './showcase.ts';

declare global {
  interface Window {
    RtlsShowcase?: Readonly<{
      initialize: typeof initializeShowcase;
      initializeAll: typeof initializeAll;
      getInstance: (container: HTMLElement) => Showcase | null;
    }>;
  }
}

const instances = new WeakMap<HTMLElement, Showcase>();

export function initializeShowcase(
  container: Element | null,
  overrides: ShowcaseOptions = {}
): Showcase | null {
  if (!(container instanceof HTMLElement)) return null;
  const existing = instances.get(container);
  if (existing) return existing;

  try {
    const showcase = new Showcase(container, {
      scenario: overrides.scenario || container.dataset.scenario,
      quality: overrides.quality || container.dataset.quality
    });
    instances.set(container, showcase);
    return showcase;
  } catch (error) {
    container.dataset.rtlsState = 'error';
    console.error('RTLS Showcase initialization failed:', error);
    return null;
  }
}

export function initializeAll(root: ParentNode = document): void {
  root.querySelectorAll('.rtls-showcase').forEach((element) => {
    initializeShowcase(element);
  });
}

/** Auto-init on DOM ready and expose the `window.RtlsShowcase` API. */
export function bootstrap(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll(), { once: true });
  } else {
    initializeAll();
  }

  window.RtlsShowcase = Object.freeze({
    initialize: initializeShowcase,
    initializeAll,
    getInstance: (container: HTMLElement) => instances.get(container) || null
  });
}
