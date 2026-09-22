import type { Country, Difficulty, RecognitionTier } from './types';

export interface DifficultyRule {
  id: Difficulty;
  label: string;
  description: string;
  questionCount: number;
  groupSizes: number[];
  durationSeconds: number;
  rankedLives: number;
}

export const difficultyRules: Record<Difficulty, DifficultyRule> = {
  easy: {
    id: 'easy', label: 'Fácil', description: '8 banderas familiares', questionCount: 8,
    groupSizes: [1, 1, 2, 2, 2], durationSeconds: 100, rankedLives: 6,
  },
  normal: {
    id: 'normal', label: 'Normal', description: '10 banderas equilibradas', questionCount: 10,
    groupSizes: [1, 1, 2, 2, 2, 2], durationSeconds: 95, rankedLives: 5,
  },
  hard: {
    id: 'hard', label: 'Difícil', description: '12 banderas con reto extra', questionCount: 12,
    groupSizes: [1, 1, 2, 2, 2, 2, 2], durationSeconds: 90, rankedLives: 4,
  },
};

const tierWeight: Record<RecognitionTier, number> = { familiar: 0, intermediate: 1, expert: 2 };

/**
 * The content team controls recognition through the country data.  Difficulty
 * changes the composition of a round, never the value of an individual flag.
 */
export const chooseDifficultyCountries = (pool: Country[], difficulty: Difficulty): Country[] => {
  const count = difficultyRules[difficulty].questionCount;
  if (difficulty === 'hard') return pool.slice(0, count);
  return [...pool]
    .sort((a, b) => tierWeight[a.recognition] - tierWeight[b.recognition] || a.name.localeCompare(b.name, 'es'))
    .slice(0, count);
};

export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;
  cleanBonus: number;
  score: number;
  hintsUsed: number;
  mistakes: number;
}

export interface ScoredAnswer {
  correct: boolean;
  usedHint: boolean;
  wrongAttempts: number;
}

export const scoreAnswer = (answer: ScoredAnswer): number => {
  if (!answer.correct) return 0;
  if (answer.usedHint) return 2;
  return answer.wrongAttempts > 0 ? 5 : 10;
};

/** A deliberately small, integer-only score that players can understand. */
export const calculateScore = (answers: ScoredAnswer[], secondsRemaining = 0): ScoreBreakdown => {
  const baseScore = answers.reduce((total, answer) => total + scoreAnswer(answer), 0);
  const hintsUsed = answers.filter((answer) => answer.usedHint).length;
  const mistakes = answers.reduce((total, answer) => total + answer.wrongAttempts, 0);
  const completed = answers.length > 0 && answers.every((answer) => answer.correct);
  const timeBonus = completed ? Math.min(10, Math.floor(Math.max(0, secondsRemaining) / 10)) : 0;
  const cleanBonus = completed && hintsUsed === 0 && mistakes === 0 ? 5 : 0;
  return { baseScore, timeBonus, cleanBonus, score: baseScore + timeBonus + cleanBonus, hintsUsed, mistakes };
};
