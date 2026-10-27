import { el } from '../shared/dom.js';

export class AlertPanel {
  constructor(root, { visible = true, eventBus = null } = {}) {
    this.root = root;
    this.eventBus = eventBus;
    this.element = el('div', 'rtls-software__alerts');
    this.element.hidden = !visible;
    this.element.append(el('h3', 'rtls-software__panel-title', 'Alerts'));
    this.list = el('ul', 'rtls-software__alert-list');
    this.empty = el('li', 'rtls-software__alert-empty', 'No zone events yet');
    this.list.append(this.empty);
    this.element.append(this.list);
    root.append(this.element);
    this.unsubscribers = [];

    if (eventBus) {
      this.unsubscribers.push(
        eventBus.on('tag:zone-entered', (payload) => {
          this.prepend(`${payload.objectLabel} entered ${payload.zoneLabel}`);
        })
      );
      this.unsubscribers.push(
        eventBus.on('tag:zone-left', (payload) => {
          this.prepend(`${payload.objectLabel} left ${payload.zoneLabel}`);
        })
      );
    }
  }

  prepend(text) {
    this.empty?.remove();
    this.empty = null;
    const item = el('li', 'rtls-software__alert-item', text);
    this.list.prepend(item);
    while (this.list.children.length > 12) {
      this.list.lastElementChild?.remove();
    }
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.element.remove();
  }
}
