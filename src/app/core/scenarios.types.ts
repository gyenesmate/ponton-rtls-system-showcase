export type ShowcaseLayout = 'warehouse' | 'split' | 'software';

export interface PlaybackOptions {
  mode?: 'continuous' | 'interactive';
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  respectReducedMotion?: boolean;
}

export interface ScenarioConfig {
  id: string;
  label?: string;
  layout: ShowcaseLayout;
  warehouse?: Record<string, unknown> & { visible?: boolean };
  software?: Record<string, unknown> & { visible?: boolean };
  playback?: PlaybackOptions;
  quality?: 'high' | 'medium' | 'low';
  site?: Record<string, unknown>;
}
