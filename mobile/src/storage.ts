import type { PlayerProfile } from './types';

const STORAGE_KEY = 'atlas-flags-profile-v1';
export const PROFILE_SCHEMA_VERSION = 2;
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

export const saveProfile = (profile: PlayerProfile): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, schemaVersion: PROFILE_SCHEMA_VERSION }));
};
