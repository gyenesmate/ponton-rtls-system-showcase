import type { ScenarioConfig } from '../../core/scenarios.types.ts';
import { developerScenario } from './developer.ts';

export const DEFAULT_SCENARIO_ID = 'developer';

export const scenarios: Readonly<Record<string, ScenarioConfig>> = Object.freeze({
  developer: developerScenario
});
