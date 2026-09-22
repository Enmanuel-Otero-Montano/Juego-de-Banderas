import { describe, expect, it } from 'vitest';
import { calculateScore, scoreAnswer } from './rules';

describe('puntuación explicable', () => {
  it('premia 10/5/2/0 según el recorrido de cada bandera', () => {
    expect(scoreAnswer({ correct: true, usedHint: false, wrongAttempts: 0 })).toBe(10);
    expect(scoreAnswer({ correct: true, usedHint: false, wrongAttempts: 1 })).toBe(5);
    expect(scoreAnswer({ correct: true, usedHint: true, wrongAttempts: 0 })).toBe(2);
    expect(scoreAnswer({ correct: false, usedHint: false, wrongAttempts: 0 })).toBe(0);
  });

  it('mantiene el tiempo como bonus pequeño y visible', () => {
    const answers = [
      { correct: true, usedHint: false, wrongAttempts: 0 },
      { correct: true, usedHint: false, wrongAttempts: 1 },
      { correct: true, usedHint: true, wrongAttempts: 0 },
    ];
    expect(calculateScore(answers, 16).timeBonus).toBe(1);
    expect(calculateScore(answers, 28).timeBonus).toBe(2);
    expect(calculateScore(answers, 50).timeBonus).toBe(5);
    expect(calculateScore(answers, 70).timeBonus).toBe(7);
    expect(calculateScore(answers, 80).timeBonus).toBe(8);
    expect(calculateScore(answers, 90).timeBonus).toBe(9);
    expect(calculateScore(answers, 100).timeBonus).toBe(10);
    expect(calculateScore(answers, 76)).toMatchObject({ baseScore: 17, timeBonus: 7, cleanBonus: 0, score: 24, hintsUsed: 1, mistakes: 1 });
  });

  it('otorga ruta limpia solo sin pistas ni errores', () => {
    const score = calculateScore([{ correct: true, usedHint: false, wrongAttempts: 0 }], 0);
    expect(score.cleanBonus).toBe(5);
    expect(score.score).toBe(15);
  });

  it('no otorga bonos de tiempo ni ruta limpia a una etapa incompleta', () => {
    const score = calculateScore([
      { correct: true, usedHint: false, wrongAttempts: 0 },
      { correct: false, usedHint: false, wrongAttempts: 0 },
    ], 80);
    expect(score).toMatchObject({ baseScore: 10, timeBonus: 0, cleanBonus: 0, score: 10 });
  });
});
