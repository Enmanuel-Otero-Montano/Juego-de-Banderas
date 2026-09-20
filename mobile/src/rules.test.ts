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
    const score = calculateScore([
      { correct: true, usedHint: false, wrongAttempts: 0 },
      { correct: true, usedHint: false, wrongAttempts: 1 },
      { correct: true, usedHint: true, wrongAttempts: 0 },
    ], 76);
    expect(score).toMatchObject({ baseScore: 17, timeBonus: 5, cleanBonus: 0, score: 22, hintsUsed: 1, mistakes: 1 });
  });

  it('otorga ruta limpia solo sin pistas ni errores', () => {
    const score = calculateScore([{ correct: true, usedHint: false, wrongAttempts: 0 }], 0);
    expect(score.cleanBonus).toBe(5);
    expect(score.score).toBe(15);
  });
});
