import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteRankingAccount, resendVerificationEmail } from './api';

describe('cliente de cuentas', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
});
