import { DEFAULT_SCENARIO_ID, scenarios } from '../../data/scenarios';
import type { ScenarioConfig } from './scenario-types';

const scenarioRegistry = scenarios;

export class ScenarioManager {
  static resolve(scenarioId?: unknown): ScenarioConfig {
    const id = typeof scenarioId === 'string' ? scenarioId.trim() : '';
    if (id && scenarioRegistry[id]) {
      return scenarioRegistry[id];
    }

    if (id) {
      console.warn(
        `[RTLS Showcase] Unknown scenario "${id}", falling back to "${DEFAULT_SCENARIO_ID}".`
      );
    }

    return scenarioRegistry[DEFAULT_SCENARIO_ID];
  }

  static list(): string[] {
    return Object.keys(scenarioRegistry);
  }
}
