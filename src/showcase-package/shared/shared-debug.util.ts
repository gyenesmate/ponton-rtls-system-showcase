/** Package-safe model/app debug helpers (no app imports). */
interface DebugEntry {
  t: number;
  channel: string;
  stage: string;
  [key: string]: unknown;
}

const STORAGE_KEY = 'rtlsDebug';
const PREFIX = '[RTLS]';
const log: DebugEntry[] = [];
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

export function isDevDebugEnabled(): boolean {
  if (forced !== null) return forced;
  const url = readUrlFlag();
  if (url !== null) return url;
  const stored = readStorageFlag();
  if (stored !== null) return stored;
  return Boolean(import.meta.env.DEV);
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

export function setDevDebugEnabled(value: boolean): void {
  forced = Boolean(value);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* private mode */
  }
  announceIfNeeded(true);
}

export function devDebug(
  stage: string,
  detail: Record<string, unknown> = {},
  options: { channel?: string } = {}
): void {
  if (!isDevDebugEnabled()) return;
  announceIfNeeded();
  const channel = options.channel || 'app';
  log.push({ t: performance.now(), channel, stage, ...detail });
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

export function modelLoadDebug(
  stage: string,
  detail: Record<string, unknown> = {}
): void {
  devDebug(stage, detail, { channel: 'models' });
}

export function getDevLog(channel?: string): DebugEntry[] {
  if (!channel) return log.slice();
  return log.filter((row) => row.channel === channel);
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
