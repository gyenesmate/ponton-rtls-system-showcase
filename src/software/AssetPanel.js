import { el } from '../shared/dom.js';

export class AssetPanel {
  constructor(root, { visible = true, assets = null } = {}) {
    this.root = root;
    this.element = el('div', 'rtls-software__assets');
    this.element.hidden = !visible;
    this.element.append(el('h3', 'rtls-software__panel-title', 'Assets'));
    this.list = el('ul', 'rtls-software__asset-list');
    this.element.append(this.list);

    const names = Array.isArray(assets) && assets.length
      ? assets
      : ['Forklift A', 'Forklift B', 'Worker', 'AMR + Container'];

    names.forEach((name) => {
      this.list.append(el('li', 'rtls-software__asset-item', name));
    });

    root.append(this.element);
  }

  destroy() {
    this.element.remove();
  }
}
