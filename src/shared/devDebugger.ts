import type { GridConfigData, SpatialLayer } from '../core/grid/types.ts';

interface DebugEntry {
  t: number;
  channel: string;
  stage: string;
  [key: string]: unknown;
}

interface OccupancyLike {
  grid: GridConfigData;
  layers: Partial<Record<SpatialLayer, Map<string, Set<string>>>>;
}

interface DebugOptions {
  channel?: string;
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

const STORAGE_KEY = 'rtlsDebug';
const PREFIX = '[RTLS]';
const log: DebugEntry[] = [];

/** Explicit override from API / data-attr: true | false | null (unset). */
let forced: boolean | null = null;
let announced = false;

function readUrlFlag(): boolean | null {
  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    const value = params.get('rtlsDebug') ?? params.get('rtlsDebugModels');
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    /* non-browser */
  }
  return null;
}

function readStorageFlag(): boolean | null {
  try {
    const value =
      globalThis.localStorage?.getItem(STORAGE_KEY) ??
      globalThis.localStorage?.getItem('rtlsDebugModels');
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    /* private mode */
  }
  return null;
}

/** Fresh check every call so DEV / URL / storage stay in sync. */
export function isDevDebugEnabled(): boolean {
  if (forced !== null) return forced;

  const url = readUrlFlag();
  if (url !== null) return url;

  const stored = readStorageFlag();
  if (stored !== null) return stored;

  return Boolean(import.meta.env.DEV);
}

/** @deprecated Use isDevDebugEnabled */
export function isModelLoadDebugEnabled(): boolean {
  return isDevDebugEnabled();
}

export function setDevDebugEnabled(value: boolean): void {
  forced = Boolean(value);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* private mode */
  }
  announceIfNeeded(true);
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

function announceIfNeeded(force = false): void {
  if (!isDevDebugEnabled() || (announced && !force)) return;
  announced = true;
  console.log(`${PREFIX} debug ACTIVE`, {
    dev: Boolean(import.meta.env.DEV),
    href: typeof location !== 'undefined' ? location.href : '',
    tip: 'RtlsDevDebug.printLog() for a table'
  });
}

export function devDebug(
  stage: string,
  detail: Record<string, unknown> = {},
  options: DebugOptions = {}
): void {
  if (!isDevDebugEnabled()) return;

  announceIfNeeded();

  const channel = options.channel || 'app';
  const entry: DebugEntry = {
    t: performance.now(),
    channel,
    stage,
    ...detail
  };
  log.push(entry);

  const { key, url, ms, ok, error, ...rest } = detail;
  const channelTag = channel === 'app' ? '' : `:${channel}`;
  const label = key
    ? `${PREFIX}${channelTag} ${stage} · ${String(key)}`
    : `${PREFIX}${channelTag} ${stage}`;
  const payload = {
    ...(url != null ? { url } : {}),
    ...(ms != null ? { ms: Number(Number(ms).toFixed(2)) } : {}),
    ...(ok != null ? { ok } : {}),
    ...(error != null ? { error } : {}),
    ...rest
  };

  if (ok === false || /fail|timeout|fallback|error/i.test(stage)) {
    console.warn(label, payload);
  } else {
    console.log(label, payload);
  }
}

/** Model-load channel helper (keeps existing call sites). */
export function modelLoadDebug(stage: string, detail: Record<string, unknown> = {}): void {
  devDebug(stage, detail, { channel: 'models' });
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

export function getDevLog(channel?: string): DebugEntry[] {
  if (!channel) return log.slice();
  return log.filter((row) => row.channel === channel);
}

/** @deprecated Use getDevLog('models') */
export function getModelLoadLog(): DebugEntry[] {
  return getDevLog('models');
}

export function clearDevLog(channel?: string): void {
  if (!channel) {
    log.length = 0;
    return;
  }
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].channel === channel) log.splice(i, 1);
  }
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
  announceIfNeeded();
}

installDevDebugApi();
