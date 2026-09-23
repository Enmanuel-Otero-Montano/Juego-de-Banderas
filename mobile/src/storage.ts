import type { Difficulty, JourneyHistoryEntry, PlayerProfile } from './types';

const STORAGE_KEY = 'atlas-flags-profile-v1';
export const PROFILE_SCHEMA_VERSION = 3;
export const MAX_CAMPAIGN_HEARTS = 15;

export const initialProfile: PlayerProfile = {
  schemaVersion: PROFILE_SCHEMA_VERSION,
  xp: 0,
  coins: 120,
  streak: 0,
  lastPlayedDate: null,
  sessionsCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  unlockedStage: 1,
  completedStages: [],
  expeditionSeen: [],
  homeCountryCode: null,
  journeyRoute: [],
  masteredCountries: {},
  dailyResults: {},
  journeyHistory: [],
  isPremium: false,
  soundEnabled: true,
  hapticsEnabled: true,
  campaignHearts: MAX_CAMPAIGN_HEARTS,
  displayName: null,
  rankedProfileReady: false,
};

const freshInitialProfile = (): PlayerProfile => ({
  ...initialProfile,
  completedStages: [],
  expeditionSeen: [],
  journeyRoute: [],
  masteredCountries: {},
  dailyResults: {},
  journeyHistory: [],
});

const finiteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** Migra y sanea perfiles creados por versiones anteriores de la app. */
export const migrateProfile = (stored: unknown): PlayerProfile => {
  if (!stored || typeof stored !== 'object') return freshInitialProfile();
  const value = stored as Partial<PlayerProfile>;
  const numericArray = (input: unknown, minimum: number, maximum: number): number[] =>
    Array.isArray(input)
      ? [...new Set(input.filter((item): item is number => Number.isInteger(item) && item >= minimum && item <= maximum))]
      : [];
  const stringArray = (input: unknown): string[] =>
    Array.isArray(input) ? [...new Set(input.filter((item): item is string => typeof item === 'string'))] : [];
  const journeyHistory = Array.isArray(value.journeyHistory)
    ? value.journeyHistory.flatMap((item): JourneyHistoryEntry[] => {
        if (!item || typeof item !== 'object') return [];
        const entry = item as Partial<JourneyHistoryEntry>;
        const difficulty: Difficulty = entry.difficulty === 'easy' || entry.difficulty === 'hard' ? entry.difficulty : 'normal';
        const total = Math.max(1, finiteNumber(entry.total, 10));
        const correct = Math.min(total, Math.max(0, finiteNumber(entry.correct, 0)));
        if (typeof entry.playedAt !== 'string' || !Number.isInteger(entry.stageId)) return [];
        return [{
          id: typeof entry.id === 'string' ? entry.id : `migrated-${entry.playedAt}-${entry.stageId}`,
          attemptId: typeof entry.attemptId === 'string' ? entry.attemptId : undefined,
          serverRunId: Number.isInteger(entry.serverRunId) ? entry.serverRunId : undefined,
          playedAt: entry.playedAt,
          stageId: entry.stageId!,
          difficulty,
          correct,
          total,
          accuracy: Math.round((correct / total) * 100),
          score: Math.max(0, finiteNumber(entry.score, 0)),
          mistakes: Math.max(0, finiteNumber(entry.mistakes, 0)),
          hintsUsed: Math.max(0, finiteNumber(entry.hintsUsed, 0)),
          passed: correct === total,
        }];
      }).slice(-100)
    : [];

  return {
    ...freshInitialProfile(),
    ...value,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    xp: finiteNumber(value.xp, initialProfile.xp),
    coins: finiteNumber(value.coins, initialProfile.coins),
    streak: finiteNumber(value.streak, initialProfile.streak),
    sessionsCompleted: finiteNumber(value.sessionsCompleted, initialProfile.sessionsCompleted),
    correctAnswers: finiteNumber(value.correctAnswers, initialProfile.correctAnswers),
    totalAnswers: finiteNumber(value.totalAnswers, initialProfile.totalAnswers),
    unlockedStage: Math.min(13, Math.max(1, finiteNumber(value.unlockedStage, 1))),
    completedStages: numericArray(value.completedStages, 1, 13),
    expeditionSeen: stringArray(value.expeditionSeen),
    journeyRoute: numericArray(value.journeyRoute, 1, 11),
    masteredCountries: value.masteredCountries && typeof value.masteredCountries === 'object' ? value.masteredCountries : {},
    dailyResults: value.dailyResults && typeof value.dailyResults === 'object' ? value.dailyResults : {},
    journeyHistory,
    campaignHearts: Math.min(MAX_CAMPAIGN_HEARTS, Math.max(0, finiteNumber(value.campaignHearts, initialProfile.campaignHearts))),
  };
};

export const loadProfile = (): PlayerProfile => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? migrateProfile(JSON.parse(value)) : freshInitialProfile();
  } catch {
    return freshInitialProfile();
  }
};

export const saveProfile = (profile: PlayerProfile): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, schemaVersion: PROFILE_SCHEMA_VERSION }));
    return true;
  } catch {
    return false;
  }
};
