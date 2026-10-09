/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { RaceLobbyScreen } from './RaceLobbyScreen';
import type { RaceRoom } from './contract';
vi.mock('../i18n', () => ({ useI18n: () => ({ language: 'es' }) }));
vi.mock('../services/api', () => ({ apiBaseUrl: 'https://example.test' }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));

it('blocks readiness and host start until resources and clock are ready', async () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const onReady = vi.fn();
  const room: RaceRoom = { id: 'room', code: 'ABC234', invite_url: '', status: 'waiting', scope: 'World', difficulty: 'normal',
    host_user_id: 1, current_user_id: 1, revision: 4, expires_at: '', current_round: null,
    members: [1, 2].map((user_id) => ({ user_id, display_name: 'Player', seat: user_id, role: user_id === 1 ? 'host' : 'player',
      connected: true, ready: true, intermission_state: 'in_lobby' })) };
  const render = async (prepared: boolean) => act(async () => root.render(<RaceLobbyScreen room={room} prepared={prepared}
    connected busy={false} error={null} onReady={onReady} onStart={() => {}} onUpdate={() => {}} onLeave={() => {}} />));
  await render(false);
  expect([...container.querySelectorAll<HTMLButtonElement>('.race-lobby-actions button')].every((button) => button.disabled)).toBe(true);
  await render(true);
  expect([...container.querySelectorAll<HTMLButtonElement>('.race-lobby-actions button')].every((button) => !button.disabled)).toBe(true);
  await act(async () => root.unmount());
});
