import { el } from '../shared/dom.js';

/**
 * Short-lived toast overlay for zone enter/leave events.
 */
export class ZoneToast {
  constructor(root, { eventBus = null } = {}) {
    this.root = root;
    this.eventBus = eventBus;
    this.element = el('div', 'rtls-software__toasts');
    root.append(this.element);
    this.unsubscribers = [];

    if (eventBus) {
      this.unsubscribers.push(
        eventBus.on('tag:zone-entered', (payload) => {
          this.push(`${payload.objectLabel} entered ${payload.zoneLabel}`, 'enter');
        })
      );
      this.unsubscribers.push(
        eventBus.on('tag:zone-left', (payload) => {
          this.push(`${payload.objectLabel} left ${payload.zoneLabel}`, 'leave');
        })
      );
    }
  }

  push(message, kind = 'enter') {
    const toast = el('div', `rtls-software__toast rtls-software__toast--${kind}`);
    toast.textContent = message;
    this.element.prepend(toast);

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 280);
    }, 3200);

    while (this.element.children.length > 4) {
      this.element.lastElementChild?.remove();
    }
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.element.remove();
  }
}
