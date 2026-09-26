import { describe, expect, it } from 'vitest';
import { feedbackTone } from './feedback';

describe('tono de acierto y fallo', () => {
  it('mantiene el tono grave y sube solo un poco su volumen', () => {
    const success = feedbackTone(true);
    const fail = feedbackTone(false);

    expect(success).toEqual({ frequency: 620, gain: 0.08, seconds: 0.18 });
    expect(fail.frequency).toBe(190);
    expect(fail.seconds).toBe(success.seconds);
    expect(fail.gain).toBe(0.1);
    expect(fail.gain).toBeGreaterThan(success.gain);
    expect(fail.gain).toBeLessThan(success.gain * 2);
  });
});
