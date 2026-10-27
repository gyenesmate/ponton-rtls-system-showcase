import type { ScenarioConfig } from '../../core/scenarios/scenario-types.ts';
import { developerScenario } from './developer.ts';

export const DEFAULT_SCENARIO_ID = 'developer';

export const scenarios: Readonly<Record<string, ScenarioConfig>> = Object.freeze({
  developer: developerScenario
});
