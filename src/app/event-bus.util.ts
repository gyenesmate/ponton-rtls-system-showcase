type Handler = (payload?: any) => void;

/**
 * Lightweight pub/sub for warehouse ↔ software coordination.
 * Kept intentionally small; expand event names as scenarios need them.
 */
export class EventBus {
  private readonly listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => {
      handler(payload);
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
