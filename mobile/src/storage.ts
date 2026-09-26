import type { Difficulty, JourneyDifficultyProgress, JourneyHistoryEntry, JourneyProgress, PlayerProfile } from './types';

const STORAGE_KEY = 'atlas-flags-profile-v1';
export const PROFILE_SCHEMA_VERSION = 4;
export const MAX_CAMPAIGN_HEARTS = 15;
export const JOURNEY_DIFFICULTIES = ['easy', 'normal', 'hard'] as const satisfies readonly Difficulty[];

export const emptyJourneyProgress = (): JourneyProgress => ({
  easy: { unlockedStage: 1, completedStages: [] },
  normal: { unlockedStage: 1, completedStages: [] },
  hard: { unlockedStage: 1, completedStages: [] },
});

/** Solo cuenta la racha que empieza en la etapa 1. Una etapa posterior no se abre hasta aprobar las anteriores en esa dificultad. */
export const normalizeDifficultyProgress = (completed: readonly number[]): JourneyDifficultyProgress => {
  const cleared = new Set(completed.filter((stage) => Number.isInteger(stage) && stage >= 1 && stage <= 13));
  const completedStages: number[] = [];
  let stage = 1;
  while (stage <= 12 && cleared.has(stage)) {
    completedStages.push(stage);
    stage += 1;
  }
  if (stage === 13 && cleared.has(13)) completedStages.push(13);
  return { unlockedStage: Math.min(13, stage), completedStages };
};

export const clearedRouteStageCount = (profile: PlayerProfile): number =>
  Math.max(...JOURNEY_DIFFICULTIES.map((difficulty) =>
    profile.journeyProgress[difficulty].completedStages.filter((stage) => stage <= 12).length));

const isDifficulty = (value: unknown): value is Difficulty =>
  value === 'easy' || value === 'normal' || value === 'hard';

const journeyProgressFromLegacy = (history: JourneyHistoryEntry[], legacyCompleted: number[]): JourneyProgress => {
  const passed: Record<Difficulty, number[]> = { easy: [], normal: [], hard: [] };
  history.forEach((entry) => {
    if (entry.passed) passed[entry.difficulty].push(entry.stageId);
  });
  const explained = new Set(JOURNEY_DIFFICULTIES.flatMap((difficulty) => passed[difficulty]));
  const destination = JOURNEY_DIFFICULTIES.reduce((best, difficulty) => (
    passed[difficulty].length > passed[best].length ? difficulty : best
  ), 'normal' as Difficulty);
  passed[destination].push(...legacyCompleted.filter((stage) => !explained.has(stage)));
  return {
    easy: normalizeDifficultyProgress(passed.easy),
    normal: normalizeDifficultyProgress(passed.normal),
    hard: normalizeDifficultyProgress(passed.hard),
  };
};

export const initialProfile: PlayerProfile = {
  schemaVersion: PROFILE_SCHEMA_VERSION,
  xp: 0,
  coins: 120,
  streak: 0,
  lastPlayedDate: null,
  sessionsCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  journeyProgress: emptyJourneyProgress(),
  selectedJourneyDifficulty: 'normal',
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
  journeyProgress: emptyJourneyProgress(),
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
  const value = stored as Partial<PlayerProfile> & {
    unlockedStage?: unknown;
    completedStages?: unknown;
    journeyProgress?: unknown;
    selectedJourneyDifficulty?: unknown;
  };
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
  const {
    unlockedStage: _legacyUnlocked,
    completedStages: legacyCompleted,
    journeyProgress: storedProgress,
    selectedJourneyDifficulty: storedDifficulty,
    ...rest
  } = value;
  const legacyStages = numericArray(legacyCompleted, 1, 13);
  const journeyProgress = storedProgress && typeof storedProgress === 'object'
    ? {
        easy: normalizeDifficultyProgress(numericArray((storedProgress as Partial<JourneyProgress>).easy?.completedStages, 1, 13)),
        normal: normalizeDifficultyProgress(numericArray((storedProgress as Partial<JourneyProgress>).normal?.completedStages, 1, 13)),
        hard: normalizeDifficultyProgress(numericArray((storedProgress as Partial<JourneyProgress>).hard?.completedStages, 1, 13)),
      }
    : journeyProgressFromLegacy(journeyHistory, legacyStages);
  const latestDifficulty = journeyHistory.at(-1)?.difficulty;

  return {
    ...freshInitialProfile(),
    ...rest,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    xp: finiteNumber(value.xp, initialProfile.xp),
    coins: finiteNumber(value.coins, initialProfile.coins),
    streak: finiteNumber(value.streak, initialProfile.streak),
    sessionsCompleted: finiteNumber(value.sessionsCompleted, initialProfile.sessionsCompleted),
    correctAnswers: finiteNumber(value.correctAnswers, initialProfile.correctAnswers),
    totalAnswers: finiteNumber(value.totalAnswers, initialProfile.totalAnswers),
    journeyProgress,
    selectedJourneyDifficulty: isDifficulty(storedDifficulty) ? storedDifficulty : latestDifficulty ?? 'normal',
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

const PREMIUM_HINT_PREFIX = 'atlas-premium-hints-';

/** Reinicia la partida local. Conserva país, alias, preferencias, sesión de clasificación y compra premium. */
export const resetLocalProgress = (profile: PlayerProfile): PlayerProfile => ({
  ...freshInitialProfile(),
  homeCountryCode: profile.homeCountryCode,
  isPremium: profile.isPremium,
  soundEnabled: profile.soundEnabled,
  hapticsEnabled: profile.hapticsEnabled,
  displayName: profile.displayName,
  rankedProfileReady: profile.rankedProfileReady,
});

/** Las pistas premium del día viven fuera del perfil y también vuelven a cero. */
export const clearDailyHintCounters = (): void => {
  try {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(PREMIUM_HINT_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // El progreso principal ya quedó reiniciado; el contador diario vuelve a cero al día siguiente.
  }
};
