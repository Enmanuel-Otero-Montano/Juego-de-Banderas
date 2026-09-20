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

export interface PlayerProfile {
  schemaVersion: number;
  xp: number;
  coins: number;
  streak: number;
  lastPlayedDate: string | null;
  sessionsCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  unlockedStage: number;
  completedStages: number[];
  expeditionSeen: string[];
  homeCountryCode: string | null;
  journeyRoute: number[];
  masteredCountries: Record<string, number>;
  dailyResults: Record<string, { correct: number; total: number }>;
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
