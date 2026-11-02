/** Lightweight DOM helpers scoped to a showcase root. */
export function qs<E extends Element = Element>(
  root: ParentNode,
  selector: string
): E | null {
  return root.querySelector<E>(selector);
}

export function qsa<E extends Element = Element>(
  root: ParentNode,
  selector: string
): E[] {
  return Array.from(root.querySelectorAll<E>(selector));
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string | null
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
