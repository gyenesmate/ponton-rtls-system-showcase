/**
 * Per-showcase simulation state shared by warehouse and software views.
 */
export class SceneState {
  constructor() {
    this.tags = new Map();
    this.alerts = [];
    this.zones = new Map();
  }

  setTagPosition(tagId, position) {
    const existing = this.tags.get(tagId) || {};
    this.tags.set(tagId, { ...existing, id: tagId, position });
  }

  getTag(tagId) {
    return this.tags.get(tagId) || null;
  }

  addAlert(alert) {
    this.alerts = [alert, ...this.alerts].slice(0, 20);
  }

  clear() {
    this.tags.clear();
    this.alerts = [];
    this.zones.clear();
  }
}
