import { el } from '../../../shared/dom.ts';
import type { EventBus } from '../../event-bus.ts';
import type { SceneState } from '../../scene-state.ts';
import type { ScenarioConfig } from '../../../core/scenarios';
import { Sidebar } from './Sidebar.ts';
import { Livemap } from './Livemap.ts';
import { ZoneToast } from './ZoneToast.ts';

/**
 * Marketing representation of an RTLS operator UI (livemap-first).
 */
export interface SoftwareViewOptions {
  eventBus?: EventBus | null;
  state?: SceneState | null;
  options?: Record<string, unknown>;
  scenario?: ScenarioConfig | null;
}

export class SoftwareView {
  container: HTMLElement;
  eventBus: EventBus | null;
  state: SceneState | null;
  options: Record<string, unknown>;
  scenario: ScenarioConfig | null;
  shell: HTMLElement;
  main: HTMLElement;
  sidebar: Sidebar;
  livemap: Livemap;
  toastHost: HTMLElement;
  zoneToast: ZoneToast;

  constructor(container: HTMLElement, { eventBus = null, state = null, options = {}, scenario = null }: SoftwareViewOptions = {}) {
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
