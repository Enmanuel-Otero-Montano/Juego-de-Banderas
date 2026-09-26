import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shareResult, shareWasCanceled } from './shareResult';

const native = vi.hoisted(() => ({ value: false }));
const share = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.value },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share },
}));

describe('compartir resultado', () => {
  beforeEach(() => {
    native.value = false;
    share.mockReset();
    share.mockResolvedValue(undefined);
  });

  it('abre la hoja del sistema en Android con el texto actual y sin enlace', async () => {
    native.value = true;
    const text = 'Banderas, Países y Regiones · 2026-09-26\n🟩🟥\n1/2 banderas · ¿Puedes superarme?';

    await shareResult('Banderas, Países y Regiones', text);

    expect(share).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledWith({
      title: 'Banderas, Países y Regiones',
      text,
      dialogTitle: 'Banderas, Países y Regiones',
    });
    expect(share.mock.calls[0][0]).not.toHaveProperty('url');
  });

  it('en la web usa Web Share y, si no existe, el portapapeles', async () => {
    const webShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: webShare });
    await shareResult('Banderas', 'texto');
    expect(webShare).toHaveBeenCalledWith({ title: 'Banderas', text: 'texto' });
    expect(share).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await shareResult('Banderas', 'texto');
    expect(writeText).toHaveBeenCalledWith('texto');
  });

  it('trata como cancelación cerrar la hoja', () => {
    expect(shareWasCanceled(new DOMException('The user aborted a request.', 'AbortError'))).toBe(true);
    expect(shareWasCanceled(new Error('Share canceled'))).toBe(true);
    expect(shareWasCanceled(new Error('Share failed'))).toBe(false);
  });
});
