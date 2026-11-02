/** Shared loose shapes for the 3D view (site data is authored config, not strictly typed yet). */
import type { PALETTE } from '../../../showcase-package/shared/shared.const.ts';

export type Palette = typeof PALETTE & Record<string, number>;

/** One authored site entry (zone, route, machine, object, ...). */
export type SiteEntry = Record<string, any>;
