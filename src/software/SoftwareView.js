import { el } from '../shared/dom.js';
import { Sidebar } from './Sidebar.js';
import { Livemap } from './Livemap.js';
import { ZoneToast } from './ZoneToast.js';

/**
 * Marketing representation of an RTLS operator UI (livemap-first).
 */
export class SoftwareView {
  constructor(container, { eventBus = null, state = null, options = {}, scenario = null } = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('SoftwareView needs a valid container element.');
    }

    this.container = container;
    this.eventBus = eventBus;
    this.state = state;
    this.options = options;
    this.scenario = scenario;

    this.container.classList.add('rtls-software');
    this.shell = el('div', 'rtls-software__shell');
    this.main = el('div', 'rtls-software__main');

    this.container.append(this.shell);
    this.sidebar = new Sidebar(this.shell, {
      title: scenario?.label || 'RTLS Software'
    });
    this.shell.append(this.main);

    this.livemap = new Livemap(this.main, {
      eventBus,
      state,
      site: scenario?.site || null
    });

    this.toastHost = el('div', 'rtls-software__toast-host');
    this.main.append(this.toastHost);
    this.zoneToast = new ZoneToast(this.toastHost, { eventBus });
  }

  destroy() {
    this.zoneToast?.destroy();
    this.livemap?.destroy();
    this.sidebar?.destroy();
    this.shell?.remove();
  }
}
