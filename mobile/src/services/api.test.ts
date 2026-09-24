import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completePendingRankingAttempt, deleteRankingAccount, queueCareerSelection, requestPasswordReset, resendVerificationEmail, startPendingRankingAttempt, updateRankingProfile } from './api';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('cliente de cuentas', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  it('acepta correctamente una respuesta 204 al eliminar la cuenta', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteRankingAccount({ accessToken: 'token-de-prueba', username: 'atlas' })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/users/me',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer token-de-prueba' }),
      }),
    );
  });

  it('envía el correo de revalidación como JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ msg: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    await resendVerificationEmail('atlas@example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/resend-verification-email',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '"atlas@example.com"',
      }),
    );
  });

  it('solicita la recuperación de contraseña como JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ msg: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    await requestPasswordReset('atlas@example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/password-reset/request',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '"atlas@example.com"',
      }),
    );
  });

  it('envía sólo el país y deja que el servidor derive la región', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ranked_profile_ready: true }));
    vi.stubGlobal('fetch', fetchMock);

    await updateRankingProfile(
      { accessToken: 'token-de-prueba', username: 'atlas' },
      { displayName: 'Capitana Atlas', country: 'UY' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/career/profile',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ display_name: 'Capitana Atlas', country: 'UY' }),
      }),
    );
  });

  it('corta una solicitud que supera los 15 segundos', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      const pending = deleteRankingAccount({ accessToken: 'token-de-prueba', username: 'atlas' });
      const rejected = expect(pending).rejects.toThrow('El servidor tardó demasiado en responder');
      await vi.advanceTimersByTimeAsync(15_000);
      await rejected;
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('persiste un evento fallido y lo publica antes de completar el intento', async () => {
    const session = { accessToken: 'token-de-prueba', username: 'atlas' };
    startPendingRankingAttempt(session, 'attempt-1');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')));

    await expect(queueCareerSelection(session, 'attempt-1', {
      eventId: 'event-1', sequence: 1, countryCode: 'uy', selectedCode: 'uy',
    })).resolves.toBe(false);
    expect(localStorage.getItem('atlas-flags-ranking-outbox-v1')).toContain('event-1');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ sequence: 1 }))
      .mockResolvedValueOnce(Response.json({ ranked: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(completePendingRankingAttempt(session, 'attempt-1')).resolves.toBe(true);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://127.0.0.1:8000/career/attempts/attempt-1/events',
      'http://127.0.0.1:8000/career/attempts/attempt-1/complete',
    ]);
    expect(localStorage.getItem('atlas-flags-ranking-outbox-v1')).toBe('[]');
  });
});
