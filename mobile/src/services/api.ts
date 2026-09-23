import type { Difficulty, GameConfig, RegionKey } from '../types';
import { rankingContract } from '../ranking';

const SESSION_KEY = 'atlas-flags-ranking-session-v1';
const REQUEST_TIMEOUT_MS = 15_000;
const configuredBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
export const apiBaseUrl = (configuredBaseUrl || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface RankingSession {
  accessToken: string;
  username: string;
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

export const loadRankingSession = (): RankingSession | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) as RankingSession : null;
  } catch {
    return null;
  }
};

export const saveRankingSession = (session: RankingSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearRankingSession = (): void => localStorage.removeItem(SESSION_KEY);

export const deleteRankingAccount = async (session: RankingSession): Promise<void> => {
  await request('/users/me', {
    method: 'DELETE',
    headers: authorization(session),
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
  const response = await request<{ access_token: string }>('/token', { method: 'POST', body: form });
  const session = { accessToken: response.access_token, username };
  saveRankingSession(session);
  return session;
};

const authorization = (session: RankingSession): HeadersInit => ({
  Authorization: `Bearer ${session.accessToken}`,
  'Content-Type': 'application/json',
});

export const updateRankingProfile = async (
  session: RankingSession,
  input: { displayName: string | null; country: string },
): Promise<{ ranked_profile_ready: boolean }> => request('/career/profile', {
  method: 'PUT',
  headers: authorization(session),
  body: JSON.stringify({ display_name: input.displayName || '', country: input.country }),
});

export const beginCareerAttempt = async (
  session: RankingSession,
  config: GameConfig,
): Promise<RankedAttemptPlan> => {
  if (!config.stageId || !config.contentStageId || !config.difficulty) {
    throw new ApiError('La etapa no tiene un contrato de clasificación válido.');
  }
  const response = await request<{ attempt_id: string; country_codes: string[] }>('/career/attempts', {
    method: 'POST',
    headers: authorization(session),
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
  await request(`/career/attempts/${attemptId}/events`, {
    method: 'POST',
    headers: authorization(session),
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
  return request(`/career/attempts/${config.rankingAttemptId}/complete`, {
    method: 'POST',
    headers: authorization(session),
    body: JSON.stringify({}),
  });
};

export const getCareerHistory = async (
  session: RankingSession,
  difficulty: Difficulty,
  limit = 50,
): Promise<CareerHistoryResponse> => {
  const params = new URLSearchParams({ difficulty, limit: String(limit) });
  return request(`/career/me/history?${params.toString()}`, { headers: authorization(session) });
};

export const getLeaderboard = async (input: { difficulty: Difficulty; country?: string; region?: RegionKey }): Promise<LeaderboardResponse> => {
  const params = new URLSearchParams({ difficulty: input.difficulty });
  if (input.country) params.set('country', input.country);
  if (input.region) params.set('region', input.region);
  return request(`/career/leaderboard?${params.toString()}`);
};
