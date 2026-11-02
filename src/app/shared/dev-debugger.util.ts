import type { GridConfigData, SpatialLayer } from '../../showcase-package/grid-system/grid-system.types.ts';
import {
  clearDevLog,
  devDebug,
  getDevLog,
  isDevDebugEnabled,
  modelLoadDebug,
  setDevDebugEnabled
} from '../../showcase-package/shared/shared-debug.util.ts';

export {
  clearDevLog,
  devDebug,
  getDevLog,
  isDevDebugEnabled,
  modelLoadDebug,
  setDevDebugEnabled
};

interface OccupancyLike {
  grid: GridConfigData;
  layers: Partial<Record<SpatialLayer, Map<string, Set<string>>>>;
}

interface DevDebugApi {
  enabled: boolean;
  enable(): void;
  disable(): void;
  getLog: typeof getDevLog;
  clearLog: typeof clearDevLog;
  printLog(channel?: string): void;
  formatOccupancyMatrix: typeof formatOccupancyMatrix;
  logOccupancyMatrix: typeof logOccupancyMatrix;
}

interface LegacyDebugApi {
  models: boolean;
  enableModels(): void;
  disableModels(): void;
  getModelLog: typeof getModelLoadLog;
  clearModelLog: typeof clearModelLoadLog;
  printModelLog(): void;
}

declare global {
  interface Window {
    RtlsDevDebug?: DevDebugApi;
    RtlsShowcaseDebug?: LegacyDebugApi;
  }
}

const PREFIX = '[RTLS]';

/** @deprecated Use isDevDebugEnabled */
export function isModelLoadDebugEnabled(): boolean {
  return isDevDebugEnabled();
}

/** @deprecated Use setDevDebugEnabled */
export function setModelLoadDebugEnabled(value: boolean): void {
  setDevDebugEnabled(value);
}

/** Enable from showcase root data-debug / data-debug-models. */
export function enableDevDebugFromElement(element: HTMLElement): void {
  const raw = element.dataset.debug ?? element.dataset.debugModels;
  if (raw === 'true' || raw === '1') setDevDebugEnabled(true);
}

/** @deprecated Use enableDevDebugFromElement */
export function enableModelLoadDebugFromElement(element: HTMLElement): void {
  enableDevDebugFromElement(element);
}

/**
 * Format one occupancy layer as a text matrix.
 * Row 0 = min Z (back / −Z); col 0 = min X (−X).
 */
export function formatOccupancyMatrix(
  occupancy: OccupancyLike,
  { layer = 'obstacle' }: { layer?: SpatialLayer } = {}
): string {
  const { cols, rows, cellSize, originX, originZ, widthM, depthM } = occupancy.grid;
  const layerMap = occupancy.layers[layer];
  const body: string[] = [];

  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < cols; col++) {
      const set = layerMap?.get(`${col},${row}`);
      line += set && set.size > 0 ? '#' : '.';
    }
    body.push(`${String(row).padStart(2, ' ')} ${line}`);
  }

  const header = [
    `floor grid ${widthM}×${depthM} m | cell ${cellSize} m | ${cols}×${rows} cells`,
    `origin (SW corner) x=${originX} z=${originZ} | layer=${layer}`,
    'legend: . empty  # occupied | row0=back(−Z) → last=front(+Z) | col0=left(−X)',
    `   ${[...Array(cols)].map((_, col) => col % 10).join('')}`
  ];

  return [...header, ...body].join('\n');
}

/** Log the floor occupancy matrix when debug is on. */
export function logOccupancyMatrix(
  occupancy: OccupancyLike,
  { layer = 'obstacle', label = 'floor-plan' }: {
    layer?: SpatialLayer;
    label?: string;
  } = {}
): string | undefined {
  if (!isDevDebugEnabled() || !occupancy?.grid) return undefined;
  const text = formatOccupancyMatrix(occupancy, { layer });
  console.log(`${PREFIX} ${label} matrix\n${text}`);
  devDebug('floor-matrix', { label, layer, matrix: text }, { channel: 'spatial' });
  return text;
}

/** @deprecated Use getDevLog('models') */
export function getModelLoadLog(): ReturnType<typeof getDevLog> {
  return getDevLog('models');
}

/** @deprecated Use clearDevLog('models') */
export function clearModelLoadLog(): void {
  clearDevLog('models');
}

export function installDevDebugApi(): void {
  if (typeof window === 'undefined') return;

  const api: DevDebugApi = {
    get enabled() {
      return isDevDebugEnabled();
    },
    set enabled(value: boolean) {
      setDevDebugEnabled(value);
    },
    enable() {
      setDevDebugEnabled(true);
      console.log(`${PREFIX} enabled — reload to capture a full init trace`);
    },
    disable() {
      setDevDebugEnabled(false);
      console.log(`${PREFIX} disabled`);
    },
    getLog: getDevLog,
    clearLog: clearDevLog,
    printLog(channel?: string) {
      const rows = getDevLog(channel);
      if (!rows.length) {
        console.log(`${PREFIX} log is empty${channel ? ` (channel: ${channel})` : ''}`);
        return;
      }
      console.table(
        rows.map((row) => ({
          ms: row.t.toFixed(1),
          channel: row.channel,
          stage: row.stage,
          key: row.key ?? '',
          ok: row.ok ?? '',
          url: row.url ?? '',
          source: row.source ?? ''
        }))
      );
    },
    formatOccupancyMatrix,
    logOccupancyMatrix
  };

  const legacyApi: LegacyDebugApi = {
    get models() {
      return isDevDebugEnabled();
    },
    set models(value: boolean) {
      setDevDebugEnabled(value);
    },
    enableModels: api.enable,
    disableModels: api.disable,
    getModelLog: getModelLoadLog,
    clearModelLog: clearModelLoadLog,
    printModelLog() {
      api.printLog('models');
    }
  };

  window.RtlsDevDebug = api;
  window.RtlsShowcaseDebug = legacyApi;
}

installDevDebugApi();
