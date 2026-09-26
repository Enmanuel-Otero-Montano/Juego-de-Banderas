export type RegionKey = 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania';
export type GameMode = 'quick' | 'region' | 'career' | 'daily';
export type QuestionKind = 'flag-to-name' | 'name-to-flag' | 'capital-to-flag';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type RecognitionTier = 'familiar' | 'intermediate' | 'expert';
export type LocaleCode = 'es' | 'en' | 'pt';

export interface Country {
  code: string;
  code3: string;
  name: string;
  capital: string;
  region: RegionKey;
  subregion: string;
  population: number;
  recognition: RecognitionTier;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  answer: Country;
  options: Country[];
}

export interface GameConfig {
  mode: GameMode;
  title: string;
  subtitle: string;
  pool: Country[];
  questionCount: number;
  difficulty?: Difficulty;
  seed?: string;
  stageId?: number;
  /** Identidad estable del bloque; stageId es sólo la posición en la ruta. */
  contentStageId?: number;
  rankingAttemptId?: string;
  /** Plan de países emitido por el servidor para una partida clasificatoria. */
  rankedCountryCodes?: string[];
  /** La partida siguió localmente porque no pudo sincronizarse con ranking. */
  rankingDegraded?: boolean;
}

export interface AnswerRecord {
  questionId: string;
  countryCode: string;
  correct: boolean;
  usedHint: boolean;
  wrongAttempts: number;
  elapsedSeconds: number;
  /** Secuencia de nombres elegidos para esta bandera; permite validación del servidor. */
  selectedCodes?: string[];
}

export interface JourneyHistoryEntry {
  id: string;
  attemptId?: string;
  serverRunId?: number;
  playedAt: string;
  stageId: number;
  difficulty: Difficulty;
  correct: number;
  total: number;
  accuracy: number;
  score: number;
  mistakes: number;
  hintsUsed: number;
  passed: boolean;
}

export interface JourneyDifficultyProgress {
  unlockedStage: number;
  completedStages: number[];
}

export type JourneyProgress = Record<Difficulty, JourneyDifficultyProgress>;

export interface PlayerProfile {
  schemaVersion: number;
  xp: number;
  coins: number;
  streak: number;
  lastPlayedDate: string | null;
  sessionsCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  /** Avance independiente de Fácil, Normal y Difícil sobre la misma ruta. */
  journeyProgress: JourneyProgress;
  /** Dificultad visible en el mapa del viaje. */
  selectedJourneyDifficulty: Difficulty;
  expeditionSeen: string[];
  homeCountryCode: string | null;
  journeyRoute: number[];
  masteredCountries: Record<string, number>;
  dailyResults: Record<string, { correct: number; total: number }>;
  journeyHistory: JourneyHistoryEntry[];
  isPremium: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  campaignHearts: number;
  displayName: string | null;
  rankedProfileReady: boolean;
}

export interface SessionReward {
  xp: number;
  coins: number;
  correct: number;
  total: number;
  newStageUnlocked: boolean;
  score: number;
  baseScore: number;
  timeBonus: number;
  cleanBonus: number;
  hintsUsed: number;
  mistakes: number;
}
