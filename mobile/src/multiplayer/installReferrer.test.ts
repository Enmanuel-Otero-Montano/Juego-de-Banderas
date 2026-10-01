/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ enabled: false }));
const plugin = vi.hoisted(() => ({ getPendingRaceInvite: vi.fn() }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.enabled },
  registerPlugin: vi.fn(() => plugin),
}));

import { clearPendingRaceInvite, readPendingRaceInvite, savePendingRaceInvite } from './installReferrer';

const token = 'abcdefghijklmnopqrstuvwxyzABCDEF1234567890_-';

describe('install referrer de Carrera', () => {
  beforeEach(() => {
    localStorage.clear();
    native.enabled = false;
    plugin.getPendingRaceInvite.mockReset();
  });

  it('conserva una invitación válida mientras el usuario instala o inicia sesión', async () => {
    savePendingRaceInvite(token);
    expect(await readPendingRaceInvite()).toBe(token);

    savePendingRaceInvite('token inválido');
    expect(await readPendingRaceInvite()).toBe(token);
  });

  it('recupera el token de Google Play una sola vez después de consumirlo', async () => {
    native.enabled = true;
    plugin.getPendingRaceInvite.mockResolvedValue({ token });

    expect(await readPendingRaceInvite()).toBe(token);
    clearPendingRaceInvite(token);
    expect(await readPendingRaceInvite()).toBeNull();
    expect(plugin.getPendingRaceInvite).toHaveBeenCalledTimes(2);
  });

  it('ignora referrers ausentes o manipulados', async () => {
    native.enabled = true;
    plugin.getPendingRaceInvite.mockResolvedValue({ token: '../not-an-invite' });
    expect(await readPendingRaceInvite()).toBeNull();
  });
});
