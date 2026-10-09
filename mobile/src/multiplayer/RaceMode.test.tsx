/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { RaceMode } from './RaceMode';
import { connectRaceSocket } from './raceSocket';
import { getRaceRoom } from './raceApi';
import { preloadFlags } from '../components/Flag';
import type { RaceRoom } from './contract';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/app', () => ({ App: {} }));
vi.mock('../services/api', () => ({ ApiError: class extends Error {} }));
vi.mock('../services/monetization', () => ({ shouldShowInterstitial: () => false, monetization: {} }));
vi.mock('../components/Flag', () => ({ preloadFlags: vi.fn() }));
vi.mock('./raceApi', () => ({ getRaceRoom: vi.fn() }));
vi.mock('./raceSocket', () => ({ connectRaceSocket: vi.fn() }));
vi.mock('./RaceCreateScreen', () => ({ RaceCreateScreen: () => null }));
vi.mock('./RaceResultsScreen', () => ({ RaceResultsScreen: () => null }));
vi.mock('./RaceGameScreen', () => ({ RaceGameScreen: () => null }));
vi.mock('./RaceLobbyScreen', () => ({ RaceLobbyScreen: ({ prepared, connected }: { prepared: boolean; connected: boolean }) =>
  <button disabled={!prepared || !connected}>Listo</button> }));

it('requires resource and clock preparation, and recalibrates after background without reconnecting there', async () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  let visible = true;
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visible ? 'visible' : 'hidden');
  let finishLoading!: () => void;
  vi.mocked(preloadFlags).mockReturnValue(new Promise<void>((resolve) => { finishLoading = resolve; }));
  const room: RaceRoom = { id: 'room', code: 'ABC234', invite_url: '', status: 'waiting', scope: 'World', difficulty: 'normal',
    host_user_id: 1, current_user_id: 1, revision: 1, expires_at: '', current_round: null, members: [] };
  vi.mocked(getRaceRoom).mockResolvedValue(room);
  const transports: Array<{ close: ReturnType<typeof vi.fn> }> = [];
  vi.mocked(connectRaceSocket).mockImplementation((_session, _room, handlers) => {
    handlers.clock.reset();
    const transport = { sendReady: vi.fn(), sendAnswer: vi.fn(), sendIntermission: vi.fn(), requestSnapshot: vi.fn(),
      close: vi.fn(() => handlers.onConnectionChange(false)) };
    transports.push(transport);
    return transport;
  });
  localStorage.setItem('atlas-flags-active-race-room-v1:1', 'room');
  const container = document.createElement('div'); const root = createRoot(container);
  try {
    await act(async () => root.render(<RaceMode session={{ accessToken: 'test', refreshToken: 'test', username: 'one', userId: 1 }}
      isPremium pendingInviteToken={null} onConsumeInvite={() => {}} onBack={() => {}} onAccount={() => {}} onRoundCompleted={() => 1} />));
    const handlers = vi.mocked(connectRaceSocket).mock.calls[0][2];
    await act(async () => handlers.onConnectionChange(true));
    await act(async () => {
      const now = performance.now();
      for (let i = 0; i < 3; i++) handlers.clock.observe(now - 200, now, new Date(100000).toISOString(), new Date(100000).toISOString());
      handlers.onClockChange();
    });
    expect(container.querySelector('button')?.disabled).toBe(true);
    await act(async () => finishLoading());
    expect(container.querySelector('button')?.disabled).toBe(false);
    visible = false;
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(transports[0].close).toHaveBeenCalled();
    expect(handlers.clock.ready).toBe(false);
    await act(async () => vi.advanceTimersByTime(5000));
    expect(connectRaceSocket).toHaveBeenCalledTimes(1);
    visible = true;
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(connectRaceSocket).toHaveBeenCalledTimes(2);
    expect(container.querySelector('button')?.disabled).toBe(true);
  } finally {
    await act(async () => root.unmount());
    localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks();
  }
});
