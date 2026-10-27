/**
 * General development logger for the RTLS showcase.
 *
 * On by default in Vite DEV. Otherwise enable via:
 * - URL: ?rtlsDebug=1
 * - localStorage.setItem('rtlsDebug', '1') then reload
 * - data-debug="true" on .rtls-showcase
 * - RtlsDevDebug.enable() then reload / re-init
 *
 * Disable in DEV: ?rtlsDebug=0 or localStorage.setItem('rtlsDebug','0')
 *
 * Namespaced helpers:
 *   devDebug('stage', detail)           — general
 *   modelLoadDebug('stage', detail)     — model pipeline (same log, channel: models)
í *   logOccupancyMatrix(occupancy)       — ASCII floor-plan matrix
 *
 * Inspect: RtlsDevDebug.printLog() / printLog('models')
 */

const STORAGE_KEY = 'rtlsDebug';
const PREFIX = '[RTLS]';

/** @type {Array<object>} */
const log = [];

/** Explicit override from API / data-attr: true | false | null (unset). */
let forced = null;
let announced = false;

function readUrlFlag() {
  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    // Prefer rtlsDebug; keep legacy rtlsDebugModels as alias.
    const value = params.get('rtlsDebug') ?? params.get('rtlsDebugModels');
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    /* non-browser */
  }
  return null;
}

function readStorageFlag() {
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
export function isDevDebugEnabled() {
  if (forced === true) return true;
  if (forced === false) return false;

  const url = readUrlFlag();
  if (url !== null) return url;

  const stored = readStorageFlag();
  if (stored !== null) return stored;

  return Boolean(import.meta.env.DEV);
}

/** @deprecated Use isDevDebugEnabled */
export function isModelLoadDebugEnabled() {
  return isDevDebugEnabled();
}

export function setDevDebugEnabled(value) {
  forced = Boolean(value);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* private mode */
  }
  announceIfNeeded(true);
}

/** @deprecated Use setDevDebugEnabled */
export function setModelLoadDebugEnabled(value) {
  setDevDebugEnabled(value);
}

/** Enable from showcase root data-debug / data-debug-models. */
export function enableDevDebugFromElement(element) {
  const raw = element?.dataset?.debug ?? element?.dataset?.debugModels;
  if (raw === 'true' || raw === '1') {
    setDevDebugEnabled(true);
  }
}

/** @deprecated Use enableDevDebugFromElement */
export function enableModelLoadDebugFromElement(element) {
  enableDevDebugFromElement(element);
}

function announceIfNeeded(force = false) {
  if (!isDevDebugEnabled()) return;
  if (announced && !force) return;
  announced = true;
  console.log(`${PREFIX} debug ACTIVE`, {
    dev: Boolean(import.meta.env.DEV),
    href: typeof location !== 'undefined' ? location.href : '',
    tip: 'RtlsDevDebug.printLog() for a table'
  });
}

/**
 * @param {string} stage
 * @param {object} [detail]
 * @param {{ channel?: string }} [options]
 */
export function devDebug(stage, detail = {}, options = {}) {
  if (!isDevDebugEnabled()) return;

  announceIfNeeded();

  const channel = options.channel || 'app';
  const entry = {
    t: performance.now(),
    channel,
    stage,
    ...detail
  };
  log.push(entry);

  const { key, url, ms, ok, error, ...rest } = detail;
  const channelTag = channel === 'app' ? '' : `:${channel}`;
  const label = key
    ? `${PREFIX}${channelTag} ${stage} · ${key}`
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
export function modelLoadDebug(stage, detail = {}) {
  devDebug(stage, detail, { channel: 'models' });
}

/**
 * Format one occupancy layer as a text matrix.
 * Row 0 = min Z (back / −Z); col 0 = min X (−X). Printed top→bottom = back→front.
 *
 * @param {{ grid: object, layers: Record<string, Map<string, Set<string>>> }} occupancy
 * @param {{ layer?: string }} [options]
 * @returns {string}
 */
export function formatOccupancyMatrix(occupancy, { layer = 'obstacle' } = {}) {
  const { cols, rows, cellSize, originX, originZ, widthM, depthM } = occupancy.grid;
  const layerMap = occupancy.layers[layer];
  const body = [];

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
    `legend: . empty  # occupied | row0=back(−Z) → last=front(+Z) | col0=left(−X)`,
    `   ${[...Array(cols)].map((_, c) => c % 10).join('')}`
  ];

  return [...header, ...body].join('\n');
}

/**
 * Log the floor occupancy matrix when debug is on.
 *
 * @param {{ grid: object, layers: Record<string, Map<string, Set<string>>> }} occupancy
 * @param {{ layer?: string, label?: string }} [options]
 * @returns {string|undefined}
 */
export function logOccupancyMatrix(occupancy, { layer = 'obstacle', label = 'floor-plan' } = {}) {
  if (!isDevDebugEnabled() || !occupancy?.grid) return undefined;
  const text = formatOccupancyMatrix(occupancy, { layer });
  console.log(`${PREFIX} ${label} matrix\n${text}`);
  devDebug('floor-matrix', { label, layer, matrix: text }, { channel: 'spatial' });
  return text;
}

export function getDevLog(channel) {
  if (!channel) return log.slice();
  return log.filter((row) => row.channel === channel);
}

/** @deprecated Use getDevLog('models') */
export function getModelLoadLog() {
  return getDevLog('models');
}

export function clearDevLog(channel) {
  if (!channel) {
    log.length = 0;
    return;
  }
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].channel === channel) log.splice(i, 1);
  }
}

/** @deprecated Use clearDevLog('models') */
export function clearModelLoadLog() {
  clearDevLog('models');
}

export function installDevDebugApi() {
  if (typeof window === 'undefined') return;
  window.RtlsDevDebug = {
    get enabled() {
      return isDevDebugEnabled();
    },
    set enabled(value) {
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
    printLog(channel) {
      const rows = getDevLog(channel);
      if (!rows.length) {
        console.log(`${PREFIX} log is empty${channel ? ` (channel: ${channel})` : ''}`);
        return;
      }
      console.table(
        rows.map((row) => ({
          ms: row.t.toFixed(1),
          channel: row.channel ?? '',
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

  // Back-compat alias used by older docs / console habits.
  window.RtlsShowcaseDebug = {
    get models() {
      return isDevDebugEnabled();
    },
    set models(value) {
      setDevDebugEnabled(value);
    },
    enableModels() {
      window.RtlsDevDebug.enable();
    },
    disableModels() {
      window.RtlsDevDebug.disable();
    },
    getModelLog: getModelLoadLog,
    clearModelLog: clearModelLoadLog,
    printModelLog() {
      window.RtlsDevDebug.printLog('models');
    }
  };

  announceIfNeeded();
}

installDevDebugApi();
