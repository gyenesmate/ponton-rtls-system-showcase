import { scenarios, DEFAULT_SCENARIO_ID } from '../scenarios/index.js';

export class ScenarioManager {
  static resolve(scenarioId) {
    const id = typeof scenarioId === 'string' ? scenarioId.trim() : '';
    if (id && scenarios[id]) {
      return scenarios[id];
    }

    if (id) {
      console.warn(
        `[RTLS Showcase] Unknown scenario "${id}", falling back to "${DEFAULT_SCENARIO_ID}".`
      );
    }

    return scenarios[DEFAULT_SCENARIO_ID];
  }

  static list() {
    return Object.keys(scenarios);
  }
}
