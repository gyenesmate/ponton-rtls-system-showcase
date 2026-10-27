import { Showcase } from './core/Showcase.js';
import './shared/devDebugger.js';
import './styles/showcase.css';
import './styles/warehouse.css';
import './styles/software.css';

const instances = new WeakMap();

function initializeShowcase(container, overrides = {}) {
  if (!(container instanceof HTMLElement)) return null;
  if (instances.has(container)) return instances.get(container);

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

function initializeAll(root = document) {
  root.querySelectorAll('.rtls-showcase').forEach((element) => {
    initializeShowcase(element);
  });
}

function boot() {
  initializeAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

window.RtlsShowcase = Object.freeze({
  initialize: initializeShowcase,
  initializeAll,
  getInstance: (container) => instances.get(container) || null
});

export { Showcase, initializeShowcase, initializeAll };
