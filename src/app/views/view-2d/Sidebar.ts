import { el } from '../../../shared/dom.ts';

export class Sidebar {
  root: HTMLElement;
  element: HTMLElement;

  constructor(root: HTMLElement, { title = 'RTLS' }: { title?: string } = {}) {
    this.root = root;
    this.element = el('aside', 'rtls-software__sidebar');
    this.element.append(
      el('div', 'rtls-software__brand', title),
      el('nav', 'rtls-software__nav')
    );
    const nav = this.element.querySelector('.rtls-software__nav')!;
    ['Livemap', 'Assets', 'Zones', 'Alerts'].forEach((label) => {
      nav.append(el('button', 'rtls-software__nav-item', label));
    });
    root.append(this.element);
  }

  destroy() {
    this.element.remove();
  }
}
