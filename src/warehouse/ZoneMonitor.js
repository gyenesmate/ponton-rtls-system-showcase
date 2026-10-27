import { isPointInZone } from './scene/zones.js';

/**
 * Detects rectangular zone enter/leave for moving agents and emits EventBus events.
 */
export class ZoneMonitor {
  /**
   * @param {{
   *   zones?: Array<object>,
   *   eventBus?: { emit: Function } | null,
   *   state?: { addAlert?: Function } | null,
   *   objectLabels?: Record<string, string>
   * }} options
   */
  constructor({ zones = [], eventBus = null, state = null, objectLabels = {} } = {}) {
    this.zones = zones;
    this.eventBus = eventBus;
    this.state = state;
    this.objectLabels = objectLabels;
    /** @type {Map<string, boolean>} */
    this.inside = new Map();
  }

  update(movements, elapsedSeconds = 0) {
    if (!this.zones.length) return;

    (movements || []).forEach((movement) => {
      if (!movement?.agentId || !movement.object) return;
      const { x, z } = movement.object.position;

      this.zones.forEach((zone) => {
        const isInside = isPointInZone(x, z, zone);
        const key = `${movement.agentId}::${zone.id}`;
        const wasInside = this.inside.get(key) === true;

        if (isInside && !wasInside) {
          this.inside.set(key, true);
          this.emit('tag:zone-entered', movement.agentId, zone, elapsedSeconds);
        } else if (!isInside && wasInside) {
          this.inside.set(key, false);
          this.emit('tag:zone-left', movement.agentId, zone, elapsedSeconds);
        } else {
          this.inside.set(key, isInside);
        }
      });
    });
  }

  emit(eventName, agentId, zone, elapsedSeconds) {
    const objectLabel = this.objectLabels[agentId] || agentId;
    const zoneLabel = zone.label || zone.id;
    const payload = {
      tagId: agentId,
      objectLabel,
      zoneId: zone.id,
      zoneLabel,
      elapsed: elapsedSeconds,
      at: Date.now()
    };

    this.eventBus?.emit(eventName, payload);

    const action = eventName === 'tag:zone-entered' ? 'entered' : 'left';
    this.state?.addAlert?.({
      id: `${eventName}-${agentId}-${zone.id}-${payload.at}`,
      type: eventName,
      message: `${objectLabel} ${action} ${zoneLabel}`,
      ...payload
    });
  }
}
