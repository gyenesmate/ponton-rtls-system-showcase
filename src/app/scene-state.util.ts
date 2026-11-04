/**
 * Per-showcase simulation state shared by warehouse and software views.
 */
export class SceneState {
  tags = new Map<string, Record<string, any>>();
  alerts: unknown[] = [];
  zones = new Map<string, unknown>();

  setTagPosition(tagId: string, position: unknown): void {
    const existing = this.tags.get(tagId) || {};
    this.tags.set(tagId, { ...existing, id: tagId, position });
  }

  getTag(tagId: string) {
    return this.tags.get(tagId) || null;
  }

  addAlert(alert: unknown): void {
    this.alerts = [alert, ...this.alerts].slice(0, 20);
  }

  clear(): void {
    this.tags.clear();
    this.alerts = [];
    this.zones.clear();
  }
}
