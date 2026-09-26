import type { GameMode } from '../types';

/** Anillo local, separado de la sesión y de la outbox de ranking. */
export const DIAGNOSTICS_STORAGE_KEY = 'atlas-flags-diagnostics-v1';
export const DIAGNOSTICS_RING_LIMIT = 50;

const MAX_MESSAGE = 160;
const MAX_STACK = 480;
const MAX_REASON = 80;
const MAX_NAME = 40;

const GAME_MODES = new Set<GameMode>(['quick', 'region', 'career', 'daily']);
const PURCHASE_RESULTS = new Set(['success', 'cancel', 'error']);
const AD_FORMATS = new Set(['interstitial', 'rewarded']);

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const LABELED_SECRET_PATTERN = /\b(?:access_token|refresh_token|refresh|token|password|authorization)\s*[:=]\s*\S+/gi;
const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const ANSWER_SEQUENCE_PATTERN = /\b[A-Za-z]{2}(?:\s*,\s*[A-Za-z]{2}){2,}\b/g;

export type PurchaseResult = 'success' | 'cancel' | 'error';
export type AdFormat = 'interstitial' | 'rewarded';

export type DiagnosticEvent =
  | { type: 'crash'; name: string; message: string; stack: string }
  | { type: 'session_start'; mode: GameMode }
  | { type: 'session_complete'; mode: GameMode }
  | { type: 'abandon'; mode: GameMode }
  | { type: 'ranking_publish_failed'; code: string; reason: string }
  | { type: 'offering_missing' }
  | { type: 'purchase'; result: PurchaseResult }
  | { type: 'restore'; result: PurchaseResult }
  | { type: 'ad_unavailable'; format: AdFormat };

export interface DiagnosticRecord {
  at: number;
  event: DiagnosticEvent;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Quita correos, tokens, queries y secuencias de respuestas. Luego acota el largo. */
export const sanitizeDiagnosticText = (value: unknown, maxLength: number): string => {
  const source = typeof value === 'string' ? value : '';
  const redacted = source
    .replace(EMAIL_PATTERN, '[email]')
    .replace(BEARER_PATTERN, 'Bearer [token]')
    .replace(JWT_PATTERN, '[token]')
    .replace(LABELED_SECRET_PATTERN, '[token]')
    .replace(URL_PATTERN, (match) => {
      try {
        const url = new URL(match);
        return url.search || url.hash ? `${url.origin}${url.pathname}` : match;
      } catch {
        return '[url]';
      }
    })
    .replace(ANSWER_SEQUENCE_PATTERN, '[sequence]');
  return redacted.slice(0, maxLength);
};

const gameMode = (value: unknown): GameMode | null =>
  typeof value === 'string' && GAME_MODES.has(value as GameMode) ? value as GameMode : null;

const purchaseResult = (value: unknown): PurchaseResult | null =>
  typeof value === 'string' && PURCHASE_RESULTS.has(value) ? value as PurchaseResult : null;

const adFormat = (value: unknown): AdFormat | null =>
  typeof value === 'string' && AD_FORMATS.has(value) ? value as AdFormat : null;

const errorName = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(value)) return 'Error';
  return value.slice(0, MAX_NAME);
};

const failureCode = (value: unknown): string => {
  if (typeof value !== 'string' || value.length > 32 || !/^[A-Za-z0-9_-]+$/.test(value)) return 'unknown';
  return value;
};

/** Acepta sólo el shape cerrado. Cualquier campo extra se descarta. */
export const normalizeDiagnostic = (input: unknown, at = Date.now()): DiagnosticRecord | null => {
  if (!isObject(input) || typeof input.type !== 'string') return null;
  const event = closedEvent(input);
  if (!event) return null;
  return { at: Number.isFinite(at) ? at : 0, event };
};

const closedEvent = (input: Record<string, unknown>): DiagnosticEvent | null => {
  switch (input.type) {
    case 'crash':
      return {
        type: 'crash',
        name: errorName(input.name),
        message: sanitizeDiagnosticText(input.message, MAX_MESSAGE),
        stack: sanitizeDiagnosticText(input.stack, MAX_STACK),
      };
    case 'session_start':
    case 'session_complete':
    case 'abandon': {
      const mode = gameMode(input.mode);
      return mode ? { type: input.type, mode } : null;
    }
    case 'ranking_publish_failed':
      return {
        type: 'ranking_publish_failed',
        code: failureCode(input.code),
        reason: sanitizeDiagnosticText(input.reason, MAX_REASON),
      };
    case 'offering_missing':
      return { type: 'offering_missing' };
    case 'purchase':
    case 'restore': {
      const result = purchaseResult(input.result);
      return result ? { type: input.type, result } : null;
    }
    case 'ad_unavailable': {
      const format = adFormat(input.format);
      return format ? { type: 'ad_unavailable', format } : null;
    }
    default:
      return null;
  }
};

const storedRecord = (value: unknown): DiagnosticRecord | null => {
  if (!isObject(value) || !isObject(value.event) || typeof value.at !== 'number') return null;
  const normalized = normalizeDiagnostic(value.event, value.at);
  return normalized;
};

/** Función pura: anillo acotado, sin escribir almacenamiento ni red. */
export const appendDiagnostic = (ring: readonly unknown[], input: unknown, at = Date.now()): DiagnosticRecord[] => {
  const current = ring.flatMap((item) => {
    const record = storedRecord(item);
    return record ? [record] : [];
  });
  const next = normalizeDiagnostic(input, at);
  if (!next) return current.slice(-DIAGNOSTICS_RING_LIMIT);
  return [...current, next].slice(-DIAGNOSTICS_RING_LIMIT);
};

export const recordDiagnostic = (input: unknown): void => {
  try {
    const saved = JSON.parse(localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) || '[]') as unknown;
    const ring = Array.isArray(saved) ? saved : [];
    localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(appendDiagnostic(ring, input)));
  } catch {
    // El diagnóstico local no debe interrumpir la partida.
  }
};

export const recordCrash = (error: unknown): void => {
  if (error instanceof Error) {
    recordDiagnostic({ type: 'crash', name: error.name, message: error.message, stack: error.stack ?? '' });
    return;
  }
  recordDiagnostic({
    type: 'crash',
    name: 'Error',
    message: typeof error === 'string' ? error : 'unavailable',
    stack: '',
  });
};

/** Cancelación estructurada de RevenueCat, sin conservar el mensaje ni el recibo. */
export const purchaseOutcome = (error: unknown): Exclude<PurchaseResult, 'success'> => {
  if (!error || typeof error !== 'object') return 'error';
  const value = error as { userCancelled?: unknown; code?: unknown; readableErrorCode?: unknown };
  if (value.userCancelled === true) return 'cancel';
  if (value.code === 1 || value.code === '1' || value.readableErrorCode === 'PURCHASE_CANCELLED_ERROR') return 'cancel';
  return 'error';
};

let installed = false;

export const installDiagnostics = (): void => {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (event) => {
    if (event.error instanceof Error) recordCrash(event.error);
    else recordCrash(typeof event.message === 'string' ? event.message : 'unavailable');
  });
  window.addEventListener('unhandledrejection', (event) => {
    recordCrash(event.reason);
  });
};
