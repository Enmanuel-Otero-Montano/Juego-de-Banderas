import type { AnswerRecord, Country, Difficulty, GameConfig, PlayerProfile, Question, QuestionKind, SessionReward } from './types';
import { calculateScore } from './rules';
import { initialProfile, MAX_CAMPAIGN_HEARTS } from './storage';

export const isoDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const millisecondsUntilNextLocalDay = (date = new Date()): number => {
  const nextDay = new Date(date);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1_000, nextDay.getTime() - date.getTime());
};

export const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const seededRandom = (seed: number) => {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = <T,>(items: T[], random = Math.random): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const questionKindFor = (index: number, config: GameConfig): QuestionKind => {
  if (config.mode === 'daily') return index % 3 === 2 ? 'capital-to-flag' : index % 2 ? 'name-to-flag' : 'flag-to-name';
  if (config.mode === 'career' && (config.stageId || 1) >= 7) return index % 3 === 0 ? 'capital-to-flag' : index % 2 ? 'name-to-flag' : 'flag-to-name';
  return index % 3 === 1 ? 'name-to-flag' : 'flag-to-name';
};

export const buildQuestions = (config: GameConfig): Question[] => {
  const random = config.seed ? seededRandom(hashSeed(config.seed)) : Math.random;
  const answers = shuffle(config.pool, random).slice(0, Math.min(config.questionCount, config.pool.length));

  return answers.map((answer, index) => {
    const wrong = shuffle(config.pool.filter((country) => country.code !== answer.code), random).slice(0, 3);
    return {
      id: `${config.mode}-${config.seed || Date.now()}-${index}-${answer.code}`,
      kind: questionKindFor(index, config),
      answer,
      options: shuffle([answer, ...wrong], random),
    };
  });
};

export const hiddenOptionCodes = (question: Question, random = Math.random): string[] =>
  shuffle(question.options.filter((item) => item.code !== question.answer.code), random)
    .slice(0, 2)
    .map((item) => item.code);

const daysBetween = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
};

export const completeSession = (
  profile: PlayerProfile,
  config: GameConfig,
  answers: AnswerRecord[],
  today = isoDate(),
  secondsRemaining = 0,
): { profile: PlayerProfile; reward: SessionReward } => {
  const correct = answers.filter((answer) => answer.correct).length;
  const accuracy = answers.length ? correct / answers.length : 0;
  const dailyAlreadyRewarded = config.mode === 'daily' && Boolean(profile.dailyResults[today]);
  const baseXp = dailyAlreadyRewarded ? 0 : correct * 12;
  const perfectBonus = dailyAlreadyRewarded ? 0 : accuracy === 1 ? 40 : 0;
  const coins = dailyAlreadyRewarded ? 0 : correct * 3 + (accuracy >= 0.8 ? 15 : 0);
  const masteredCountries = { ...profile.masteredCountries };

  answers.forEach((answer) => {
    const previous = masteredCountries[answer.countryCode] || 0;
    masteredCountries[answer.countryCode] = Math.max(0, Math.min(5, previous + (answer.correct ? 1 : -1)));
  });

  const gap = profile.lastPlayedDate ? daysBetween(profile.lastPlayedDate, today) : 0;
  const streak = profile.lastPlayedDate === today ? profile.streak : gap === 1 ? profile.streak + 1 : 1;
  const difficulty: Difficulty = config.difficulty === 'easy' || config.difficulty === 'hard' ? config.difficulty : 'normal';
  const currentProgress = profile.journeyProgress[difficulty];
  const completedStages = [...currentProgress.completedStages];
  let unlockedStage = currentProgress.unlockedStage;
  let newStageUnlocked = false;
  let expeditionSeen = [...(profile.expeditionSeen || [])];

  if (config.mode === 'career' && config.stageId === 13 && unlockedStage >= 13) {
    expeditionSeen = [...new Set([...expeditionSeen, ...answers.map((answer) => answer.countryCode)])];
    if (accuracy === 1 && !completedStages.includes(13)) completedStages.push(13);
  } else if (config.mode === 'career' && config.stageId && config.stageId === unlockedStage && accuracy === 1) {
    if (!completedStages.includes(config.stageId)) completedStages.push(config.stageId);
    if (unlockedStage < 13) {
      unlockedStage += 1;
      newStageUnlocked = true;
    }
  }

  const dailyResults = { ...profile.dailyResults };
  if (config.mode === 'daily' && !dailyResults[today]) dailyResults[today] = { correct, total: answers.length };

  const score = calculateScore(answers, secondsRemaining);
  const campaignHearts = config.mode === 'career'
    ? accuracy === 1
      ? Math.min(MAX_CAMPAIGN_HEARTS, profile.campaignHearts + 1)
      : MAX_CAMPAIGN_HEARTS
    : profile.campaignHearts;
  const journeyHistory = [...profile.journeyHistory];
  if (config.mode === 'career') {
    journeyHistory.push({
      id: config.rankingAttemptId || `local-${Date.now()}-${profile.sessionsCompleted + 1}`,
      attemptId: config.rankingAttemptId,
      playedAt: new Date().toISOString(),
      stageId: config.stageId || 13,
      difficulty: config.difficulty || 'normal',
      correct,
      total: answers.length,
      accuracy: Math.round(accuracy * 100),
      score: score.score,
      mistakes: answers.reduce((totalMistakes, answer) => totalMistakes + answer.wrongAttempts, 0),
      hintsUsed: answers.filter((answer) => answer.usedHint).length,
      passed: accuracy === 1,
    });
  }

  return {
    profile: {
      ...profile,
      xp: profile.xp + baseXp + perfectBonus,
      coins: profile.coins + coins,
      streak,
      lastPlayedDate: today,
      sessionsCompleted: profile.sessionsCompleted + 1,
      correctAnswers: profile.correctAnswers + correct,
      totalAnswers: profile.totalAnswers + answers.length,
      journeyProgress: config.mode === 'career'
        ? { ...profile.journeyProgress, [difficulty]: { unlockedStage, completedStages } }
        : profile.journeyProgress,
      expeditionSeen,
      masteredCountries,
      dailyResults,
      journeyHistory: journeyHistory.slice(-100),
      campaignHearts,
    },
    reward: {
      xp: baseXp + perfectBonus,
      coins,
      correct,
      total: answers.length,
      newStageUnlocked,
      ...score,
    },
  };
};

export const createShareText = (correct: number, total: number, date: string, answers: AnswerRecord[]): string => {
  const tiles = answers.map((answer) => (answer.correct ? '🟩' : '🟥')).join('');
  return `Banderas, Países y Regiones · ${date}\n${tiles}\n${correct}/${total} banderas · ¿Puedes superarme?`;
};
