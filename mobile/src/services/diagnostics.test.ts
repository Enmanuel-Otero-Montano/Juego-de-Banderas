import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DIAGNOSTICS_RING_LIMIT,
  DIAGNOSTICS_STORAGE_KEY,
  appendDiagnostic,
  purchaseOutcome,
  recordCrash,
  recordDiagnostic,
} from './diagnostics';

const secretEmail = 'jugador@example.com';
const secretToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
const secretRefresh = 'refresh_token=opaco-de-sesion-123456';
const answerSequence = 'UY,AR,BR,CL,DE';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('diagnósticos locales', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  it('descarta email, token y secuencias de respuesta', () => {
    const ring = appendDiagnostic([], {
      type: 'crash',
      name: 'TypeError',
      message: `Fallo de ${secretEmail} con ${secretToken} y ${secretRefresh}. Respuestas ${answerSequence}`,
      stack: `at play (https://app.example/game.js?token=${secretToken}&email=${secretEmail}:12:3)`,
      email: secretEmail,
      token: secretToken,
      refresh: secretRefresh,
      selectedCodes: answerSequence.split(','),
      userId: 42,
    }, 10);

    const serialized = JSON.stringify(ring);
    expect(serialized).not.toContain(secretEmail);
    expect(serialized).not.toContain(secretToken);
    expect(serialized).not.toContain('opaco-de-sesion');
    expect(serialized).not.toContain(answerSequence);
    expect(serialized).not.toContain('userId');
    expect(serialized).not.toContain('selectedCodes');
    expect(ring[0]?.event).toEqual({
      type: 'crash',
      name: 'TypeError',
      message: expect.stringContaining('[email]'),
      stack: 'at play (https://app.example/game.js',
    });
    expect(ring[0]?.event).toMatchObject({
      message: expect.not.stringContaining('?'),
    });
  });

  it('trunca mensaje y stack', () => {
    const ring = appendDiagnostic([], {
      type: 'crash',
      name: 'RangeError',
      message: 'm'.repeat(400),
      stack: 's'.repeat(900),
    }, 1);
    const event = ring[0]?.event;
    expect(event?.type).toBe('crash');
    if (event?.type !== 'crash') throw new Error('shape');
    expect(event.message).toHaveLength(160);
    expect(event.stack).toHaveLength(480);
  });

  it('conserva sólo los últimos eventos del anillo', () => {
    let ring: unknown[] = [];
    for (let index = 0; index < DIAGNOSTICS_RING_LIMIT + 5; index += 1) {
      ring = appendDiagnostic(ring, { type: 'session_start', mode: 'daily' }, index);
    }
    expect(ring).toHaveLength(DIAGNOSTICS_RING_LIMIT);
    expect(ring[0]).toMatchObject({ at: 5, event: { type: 'session_start', mode: 'daily' } });
    expect(ring.at(-1)).toMatchObject({ at: DIAGNOSTICS_RING_LIMIT + 4 });
  });

  it('rechaza eventos fuera del shape cerrado', () => {
    expect(appendDiagnostic([], { type: 'session_start', mode: 'ranked', email: secretEmail }, 1)).toEqual([]);
    expect(appendDiagnostic([], { type: 'purchase', result: 'receipt', receipt: 'abc' }, 1)).toEqual([]);
    expect(appendDiagnostic([], { type: 'ad_unavailable', format: 'banner' }, 1)).toEqual([]);
    expect(appendDiagnostic([], { type: 'custom', note: secretEmail }, 1)).toEqual([]);
    expect(appendDiagnostic([], {
      type: 'ranking_publish_failed',
      code: secretEmail,
      reason: `detalle ${secretEmail} ${answerSequence}`,
      payload: { events: [answerSequence] },
    }, 3)).toEqual([{
      at: 3,
      event: {
        type: 'ranking_publish_failed',
        code: 'unknown',
        reason: 'detalle [email] [sequence]',
      },
    }]);
    expect(appendDiagnostic([], { type: 'offering_missing', offeringId: 'secret' }, 4)).toEqual([
      { at: 4, event: { type: 'offering_missing' } },
    ]);
    expect(appendDiagnostic([], { type: 'purchase', result: 'cancel' }, 5)[0]?.event).toEqual({
      type: 'purchase',
      result: 'cancel',
    });
    expect(appendDiagnostic([], { type: 'restore', result: 'success' }, 6)[0]?.event).toEqual({
      type: 'restore',
      result: 'success',
    });
    expect(appendDiagnostic([], { type: 'ad_unavailable', format: 'interstitial' }, 7)[0]?.event).toEqual({
      type: 'ad_unavailable',
      format: 'interstitial',
    });
    expect(appendDiagnostic([], { type: 'abandon', mode: 'career' }, 8)[0]?.event).toEqual({
      type: 'abandon',
      mode: 'career',
    });
    expect(appendDiagnostic([], { type: 'session_complete', mode: 'quick' }, 9)[0]?.event).toEqual({
      type: 'session_complete',
      mode: 'quick',
    });
  });

  it('persiste el anillo aparte de la outbox de ranking', () => {
    localStorage.setItem('atlas-flags-ranking-outbox-v1', '[{"attemptId":"keep"}]');
    recordDiagnostic({
      type: 'session_start',
      mode: 'region',
      email: secretEmail,
      accessToken: secretToken,
    });
    recordCrash(new Error(`caida ${secretEmail}`));

    const saved = localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) || '';
    expect(saved).toContain('session_start');
    expect(saved).toContain('region');
    expect(saved).not.toContain(secretEmail);
    expect(saved).not.toContain(secretToken);
    expect(saved).not.toContain('accessToken');
    expect(localStorage.getItem('atlas-flags-ranking-outbox-v1')).toBe('[{"attemptId":"keep"}]');
    expect(JSON.parse(saved)).toHaveLength(2);
  });

  it('clasifica la cancelación de compra sin leer el recibo', () => {
    expect(purchaseOutcome({ userCancelled: true, message: secretEmail })).toBe('cancel');
    expect(purchaseOutcome({ code: '1', underlyingErrorMessage: secretToken })).toBe('cancel');
    expect(purchaseOutcome({ readableErrorCode: 'PURCHASE_CANCELLED_ERROR' })).toBe('cancel');
    expect(purchaseOutcome(new Error('network'))).toBe('error');
  });
});
