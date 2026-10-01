import type { Difficulty, RegionKey } from '../types';

export const RACE_PROTOCOL_VERSION = 1;
export const RACE_FLAGS_TOTAL = 12;

export type RaceScope = RegionKey | 'World';
export type RaceDifficulty = Difficulty;
export type RaceIntermissionState = 'reviewing_result' | 'ad_break' | 'in_lobby';
export type RaceRoundStatus = 'countdown' | 'running' | 'finished' | 'expired' | 'cancelled';

export interface RaceMember {
  user_id: number;
  display_name: string;
  seat: number;
  role: 'host' | 'player';
  ready: boolean;
  connected: boolean;
  intermission_state: RaceIntermissionState;
}

export interface RaceQuestion {
  country_code: string;
  option_codes: string[];
}

export interface RaceParticipantState {
  progress: number;
  mistakes: number;
  expected_sequence: number;
  discarded_codes: string[];
  locked_until: string | null;
  session_eligible?: boolean;
}

export interface RaceStanding {
  rank: number;
  user_id: number;
  display_name: string;
  progress: number;
  mistakes: number;
  finished_at: string | null;
}

export interface RaceRound {
  id: string;
  number: number;
  status: RaceRoundStatus;
  starts_at: string;
  deadline_at: string;
  finished_at: string | null;
  finish_reason: 'completed' | 'timeout' | 'cancelled' | null;
  winner_user_id: number | null;
  ruleset_version: number;
  content_version: number;
  participant?: RaceParticipantState;
  plan?: RaceQuestion[];
  standings?: RaceStanding[];
}

export interface RaceRoom {
  id: string;
  code: string;
  invite_url: string;
  status: 'waiting' | 'round_active' | 'closed';
  scope: RaceScope;
  difficulty: RaceDifficulty;
  host_user_id: number;
  current_user_id: number;
  revision: number;
  expires_at: string;
  members: RaceMember[];
  current_round: RaceRound | null;
}

export type RaceServerMessage = {
  type: string;
  protocol_version: number;
  revision: number;
  room?: RaceRoom;
  round?: RaceRound;
  participants?: Array<{ user_id: number; progress: number; mistakes: number }>;
  user_id?: number;
  state?: RaceIntermissionState;
  event_id?: string;
  correct?: boolean;
  locked_until?: string | null;
  progress?: number;
  mistakes?: number;
  expected_sequence?: number;
  discarded_codes?: string[];
  next_question?: RaceQuestion | null;
  round_id?: string;
  reason?: 'completed' | 'timeout' | 'cancelled';
  winner_user_id?: number | null;
  standings?: RaceStanding[];
  code?: string;
  message?: string;
};
