/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RaceGameScreen } from './RaceGameScreen';
import { RaceClock } from './raceClock';
import type { RaceRoom } from './contract';
import { preloadFlags } from '../components/Flag';

vi.mock('../i18n', () => ({ useI18n: () => ({ language: 'es' }) }));
vi.mock('../components/Flag', () => ({
  Flag: ({ code }: { code: string }) => <img data-code={code} />,
  preloadFlags: vi.fn(() => Promise.resolve()),
}));

const epoch = Date.parse('2026-10-08T18:00:00Z');
const room: RaceRoom = {
  id: 'room', code: 'ABC234', invite_url: 'https://example.test', status: 'round_active', scope: 'World', difficulty: 'normal',
  host_user_id: 1, current_user_id: 1, revision: 5, expires_at: '', members: [],
  current_round: { id: 'round', number: 1, status: 'countdown', starts_at: new Date(epoch + 5000).toISOString(),
    deadline_at: new Date(epoch + 95000).toISOString(), finished_at: null, finish_reason: null, winner_user_id: null,
    ruleset_version: 1, content_version: 1, participant: { progress: 0, mistakes: 0, expected_sequence: 1, discarded_codes: [], locked_until: null },
    plan: [{ country_code: 'uy', option_codes: ['uy', 'ar', 'br', 'cl'] }] },
};
let root: Root;
let container: HTMLDivElement;
let now: number;
let clock: RaceClock;
let tick: FrameRequestCallback;
const onAnswer = vi.fn();
const render = async (connected = true) => {
  await act(async () => root.render(<RaceGameScreen room={room} clock={clock} connected={connected} pending={false}
    progress={{}} onAnswer={onAnswer} onExit={() => {}} />));
};
const advance = async (time: number) => { now = time; await act(async () => tick(time)); };
const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.race-answer')];

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { tick = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.mocked(preloadFlags).mockResolvedValue(undefined);
  onAnswer.mockClear();
  now = 1000;
  clock = new RaceClock(() => now);
  for (let i = 0; i < 3; i++) clock.observe(0, 200, new Date(epoch + 100).toISOString(), new Date(epoch + 100).toISOString());
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('race screen scheduled presentation', () => {
  it('mounts the first question hidden and disabled, and reveals it at the official instant', async () => {
    await render();
    expect(preloadFlags).toHaveBeenCalledWith(['uy']);
    expect(container.querySelector('[data-code="uy"]')).not.toBeNull();
    expect(container.querySelector('main[aria-hidden="true"]')?.getAttribute('style')).toContain('visibility: hidden');
    expect(buttons().every((button) => button.disabled)).toBe(true);
    await advance(4999);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    await advance(5000);
    expect(container.querySelector('main[aria-hidden="true"]')).toBeNull();
    expect(buttons().every((button) => !button.disabled)).toBe(true);
    await act(async () => buttons()[0].click());
    expect(onAnswer).toHaveBeenCalledTimes(1);
    // Heartbeats keep the estimate fresh throughout the 90-second round.
    for (let i = 0; i < 3; i++) clock.observe(94000, 94200, new Date(epoch + 94100).toISOString(), new Date(epoch + 94100).toISOString());
    await advance(95000);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    expect(container.querySelector('.race-timer')?.textContent).toBe('0s');
  });

  it('a late resource preparation uses remaining time instead of starting a local timer', async () => {
    let finishLoading!: () => void;
    vi.mocked(preloadFlags).mockReturnValue(new Promise<void>((resolve) => { finishLoading = resolve; }));
    await render(); await advance(15000);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    await act(async () => finishLoading());
    expect(container.querySelector('.race-timer')?.textContent).toBe('80s');
    expect(buttons().every((button) => !button.disabled)).toBe(true);
  });

  it('resuming without a calibrated clock blocks answers and restores the same deadline', async () => {
    await render(); await advance(6000);
    clock.reset(); await advance(20000);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    for (let i = 0; i < 3; i++) clock.observe(19800, 20000, new Date(epoch + 19900).toISOString(), new Date(epoch + 19900).toISOString());
    await advance(20000); await render(false);
    expect(container.querySelector('.race-timer')?.textContent).toBe('75s');
    expect(buttons().every((button) => button.disabled)).toBe(true);
    await render(true);
    expect(buttons().every((button) => !button.disabled)).toBe(true);
  });
});
