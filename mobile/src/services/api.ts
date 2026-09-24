import type { Difficulty, GameConfig, RegionKey } from '../types';
import { rankingContract } from '../ranking';
import { readSecureSession, removeSecureSession, writeSecureSession } from './secureSession';

const RANKING_OUTBOX_KEY = 'atlas-flags-ranking-outbox-v1';
const RANKING_ATTEMPT_TTL_MS = 180_000;
const REQUEST_TIMEOUT_MS = 15_000;
export const RANKING_SESSION_EXPIRED_EVENT = 'atlas-flags-ranking-session-expired';
const configuredBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
export const apiBaseUrl = (configuredBaseUrl || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface RankingSession {
  accessToken: string;
  refreshToken: string;
  username: string;
  /** Identificador estable para vincular la compra con la cuenta de ranking. */
  userId?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  display_name: string | null;
  country: string | null;
  region: RegionKey | null;
  difficulty: Difficulty;
  stages_completed: number;
  total_score: number;
  total_hints_used: number;
  total_mistakes: number;
  total_time_seconds: number;
}

export interface LeaderboardResponse {
  items: LeaderboardEntry[];
  total: number;
  season_id: string;
  ruleset_version: number;
  content_version: number;
}

export interface CareerHistoryEntry {
  stage_run_id: number;
  attempt_id: string | null;
  stage_id: string;
  route_position: number | null;
  difficulty: Difficulty;
  correct_answers: number;
  flags_total: number;
  score: number;
  mistakes: number;
  hints_used: number;
  time_seconds: number;
  passed: boolean;
  played_at: string;
}

export interface CareerHistoryResponse {
  items: CareerHistoryEntry[];
  total: number;
  season_id: string;
}

export interface CareerStageResponse {
  stage_run_id: number;
  ranked: boolean;
  correct_answers: number;
  score: number;
  base_score: number;
  time_bonus: number;
  clean_bonus: number;
  hints_used: number;
  mistakes: number;
  stage_best_updated: boolean;
}

export interface RankedAttemptPlan {
  attemptId: string;
  countryCodes: string[];
}

interface PendingRankingAttempt {
  attemptId: string;
  username: string;
  createdAt: number;
  complete: boolean;
  events: Array<{ eventId: string; sequence: number; countryCode: string; selectedCode: string }>;
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly email?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const errorFor = async (response: Response): Promise<ApiError> => {
  try {
    const payload = await response.json();
    const detail = payload.detail || payload.message;
    if (typeof detail === 'string') return new ApiError(detail, response.status);
    if (detail?.message) return new ApiError(detail.message, response.status, typeof detail.email === 'string' ? detail.email : undefined);
  } catch {
    // The server may return an empty or non-JSON response.
  }
  return new ApiError('No se pudo conectar con el servidor.', response.status);
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: init.signal || controller.signal,
    });
    if (!response.ok) throw await errorFor(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Intenta nuevamente.');
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

export const loadRankingSession = async (): Promise<RankingSession | null> => {
  try {
    const saved = await readSecureSession();
    const session = saved ? JSON.parse(saved) as Partial<RankingSession> : null;
    return typeof session?.accessToken === 'string' && typeof session.refreshToken === 'string' && typeof session.username === 'string'
      ? session as RankingSession
      : null;
  } catch {
    return null;
  }
};

export const saveRankingSession = async (session: RankingSession): Promise<void> => {
  await writeSecureSession(JSON.stringify(session));
};

export const clearRankingSession = async (): Promise<void> => removeSecureSession();

let refreshInFlight: Promise<void> | null = null;

const refreshRankingSession = async (session: RankingSession): Promise<void> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await request<{ access_token: string; refresh_token: string }>('/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      session.accessToken = response.access_token;
      session.refreshToken = response.refresh_token;
      await saveRankingSession(session);
    })().finally(() => { refreshInFlight = null; });
  }
  await refreshInFlight;
};

const authenticatedRequest = async <T>(session: RankingSession, path: string, init: RequestInit = {}): Promise<T> => {
  try {
    return await request<T>(path, { ...init, headers: authorization(session) });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    try {
      await refreshRankingSession(session);
      return await request<T>(path, { ...init, headers: authorization(session) });
    } catch (refreshError) {
      if (typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(new Event(RANKING_SESSION_EXPIRED_EVENT));
      throw refreshError;
    }
  }
};

const loadRankingOutbox = (): PendingRankingAttempt[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(RANKING_OUTBOX_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item): item is PendingRankingAttempt =>
      item && typeof item.attemptId === 'string' && typeof item.username === 'string'
      && typeof item.createdAt === 'number' && Array.isArray(item.events) && typeof item.complete === 'boolean') : [];
  } catch {
    return [];
  }
};

const saveRankingOutbox = (items: PendingRankingAttempt[]): void => {
  try { localStorage.setItem(RANKING_OUTBOX_KEY, JSON.stringify(items)); } catch { /* Reintentar en esta sesión sigue siendo posible. */ }
};

const isExpiredAttempt = (item: PendingRankingAttempt) => Date.now() - item.createdAt >= RANKING_ATTEMPT_TTL_MS;

export const startPendingRankingAttempt = (session: RankingSession, attemptId: string): void => {
  const items = loadRankingOutbox().filter((item) => item.attemptId !== attemptId && !isExpiredAttempt(item));
  items.push({ attemptId, username: session.username, createdAt: Date.now(), complete: false, events: [] });
  saveRankingOutbox(items);
};

export const queueCareerSelection = async (
  session: RankingSession,
  attemptId: string,
  event: { eventId: string; sequence: number; countryCode: string; selectedCode: string },
): Promise<boolean> => {
  const items = loadRankingOutbox();
  const item = items.find((candidate) => candidate.attemptId === attemptId && candidate.username === session.username);
  if (!item || isExpiredAttempt(item)) return false;
  if (!item.events.some((candidate) => candidate.eventId === event.eventId)) item.events.push(event);
  saveRankingOutbox(items);
  return flushPendingRanking(session, attemptId);
};

/** Reproduce eventos idempotentes, en orden, y completa sólo si todos llegaron. */
export const flushPendingRanking = async (session: RankingSession, onlyAttemptId?: string): Promise<boolean> => {
  const items = loadRankingOutbox();
  let completed = false;
  const retained: PendingRankingAttempt[] = [];
  for (const item of items) {
    if (isExpiredAttempt(item)) continue;
    if (item.username !== session.username || (onlyAttemptId && item.attemptId !== onlyAttemptId)) { retained.push(item); continue; }
    try {
      for (const event of [...item.events].sort((a, b) => a.sequence - b.sequence)) {
        await recordCareerSelection(session, item.attemptId, event);
        item.events = item.events.filter((candidate) => candidate.eventId !== event.eventId);
      }
      if (item.complete) {
        await authenticatedRequest(session, `/career/attempts/${item.attemptId}/complete`, { method: 'POST', body: JSON.stringify({}) });
        completed = true;
      } else retained.push(item);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      retained.push(item);
    }
  }
  saveRankingOutbox(retained);
  return completed;
};

export const completePendingRankingAttempt = async (session: RankingSession, attemptId: string): Promise<boolean> => {
  const items = loadRankingOutbox();
  const item = items.find((candidate) => candidate.attemptId === attemptId && candidate.username === session.username);
  if (!item || isExpiredAttempt(item)) return false;
  item.complete = true;
  saveRankingOutbox(items);
  return flushPendingRanking(session, attemptId);
};

export const deleteRankingAccount = async (session: RankingSession): Promise<void> => {
  await authenticatedRequest(session, '/users/me', {
    method: 'DELETE',
  });
};

export const registerRankingAccount = async (input: { username: string; email: string; password: string }): Promise<void> => {
  const form = new URLSearchParams({
    username: input.username,
    email: input.email,
    password: input.password,
    full_name: '',
  });
  await request('/register', { method: 'POST', body: form });
};

export const resendVerificationEmail = async (email: string): Promise<void> => {
  await request('/resend-verification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await request('/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
};

export const loginRankingAccount = async (username: string, password: string): Promise<RankingSession> => {
  const form = new URLSearchParams({ username, password });
  const response = await request<{ access_token: string; refresh_token: string; user_id: number }>('/token', { method: 'POST', body: form });
  if (!Number.isInteger(response.user_id)) throw new ApiError('La respuesta de inicio de sesión no incluyó una cuenta válida.');
  const session = { accessToken: response.access_token, refreshToken: response.refresh_token, username, userId: response.user_id };
  await saveRankingSession(session);
  return session;
};

const authorization = (session: RankingSession): HeadersInit => ({
  Authorization: `Bearer ${session.accessToken}`,
  'Content-Type': 'application/json',
});

export const updateRankingProfile = async (
  session: RankingSession,
  input: { displayName: string | null; country: string },
): Promise<{ ranked_profile_ready: boolean }> => authenticatedRequest(session, '/career/profile', {
  method: 'PUT',
  body: JSON.stringify({ display_name: input.displayName || '', country: input.country }),
});

export const beginCareerAttempt = async (
  session: RankingSession,
  config: GameConfig,
): Promise<RankedAttemptPlan> => {
  if (!config.stageId || !config.contentStageId || !config.difficulty) {
    throw new ApiError('La etapa no tiene un contrato de clasificación válido.');
  }
  const response = await authenticatedRequest<{ attempt_id: string; country_codes: string[] }>(session, '/career/attempts', {
    method: 'POST',
    body: JSON.stringify({
      route_position: config.stageId,
      content_stage_id: config.contentStageId,
      difficulty: config.difficulty,
      season_id: rankingContract.seasonId,
      ruleset_version: rankingContract.rulesetVersion,
      content_version: rankingContract.contentVersion,
      app_version: rankingContract.appVersion,
    }),
  });
  return { attemptId: response.attempt_id, countryCodes: response.country_codes };
};

export const recordCareerSelection = async (
  session: RankingSession,
  attemptId: string,
  event: { eventId: string; sequence: number; countryCode: string; selectedCode: string },
): Promise<void> => {
  await authenticatedRequest(session, `/career/attempts/${attemptId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      event_id: event.eventId,
      sequence: event.sequence,
      country_code: event.countryCode,
      selected_code: event.selectedCode,
    }),
  });
};

export const submitCareerStage = async (
  session: RankingSession,
  config: GameConfig,
): Promise<CareerStageResponse> => {
  if (!config.stageId || config.stageId > 12 || !config.contentStageId || !config.difficulty || !config.rankingAttemptId) {
    throw new ApiError('Esta partida no tiene un intento clasificatorio emitido por el servidor.');
  }
  return authenticatedRequest(session, `/career/attempts/${config.rankingAttemptId}/complete`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
};

export const getCareerHistory = async (
  session: RankingSession,
  difficulty: Difficulty,
  limit = 50,
): Promise<CareerHistoryResponse> => {
  const params = new URLSearchParams({ difficulty, limit: String(limit) });
  return authenticatedRequest(session, `/career/me/history?${params.toString()}`);
};

export const getLeaderboard = async (input: { difficulty: Difficulty; country?: string; region?: RegionKey }): Promise<LeaderboardResponse> => {
  const params = new URLSearchParams({ difficulty: input.difficulty });
  if (input.country) params.set('country', input.country);
  if (input.region) params.set('region', input.region);
  return request(`/career/leaderboard?${params.toString()}`);
};
