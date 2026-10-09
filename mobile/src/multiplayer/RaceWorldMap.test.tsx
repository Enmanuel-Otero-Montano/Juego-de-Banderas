/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RaceWorldMap } from './RaceWorldMap';
import type { RaceMember } from './contract';

vi.mock('../i18n', () => ({ useI18n: () => ({ language: 'es' }) }));
const members: RaceMember[] = Array.from({ length: 8 }, (_, i) => ({ user_id: i + 1, seat: i + 1,
  display_name: `Player ${i + 1}`, role: 'player', ready: true, connected: true, intermission_state: 'in_lobby' }));
let root: Root;
let container: HTMLDivElement;
let resize: (entries: unknown[]) => void;
const disconnect = vi.fn();
let props: Parameters<typeof RaceWorldMap>[0];
const render = async () => act(async () => root.render(<RaceWorldMap {...props} />));
const bar = (id: number) => container.querySelector(`[data-user-id="${id}"] [role="progressbar"]`)!;
const position = (id: number) => (bar(id).parentElement as HTMLElement).style.transform;
const lane = (id: number) => (container.querySelector(`[data-user-id="${id}"]`) as HTMLElement).style.top;
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: typeof resize) { resize = callback; }
    observe() { resize([{ contentRect: { width: 360, height: 224 } }]); }
    disconnect = disconnect;
  });
  props = { members, currentUserId: 1, localProgress: 0, localSequence: 1, total: 12, progress: {}, pending: false, connected: true };
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it('uses one shared progress scale at 0, 25, 50, 75 and 100%, with eight distinct lanes', async () => {
  props.progress = Object.fromEntries([0, 3, 6, 9, 12, 6, 6, 6].map((progress, i) => [i + 1, { progress, mistakes: 0 }]));
  await render();
  expect(new Set(members.map((member) => lane(member.user_id))).size).toBe(8);
  expect(position(1)).toBe('translate3d(10px, -50%, 0)');
  expect(position(3)).toBe('translate3d(150px, -50%, 0)');
  expect(position(5)).toBe('translate3d(290px, -50%, 0)');
  expect(position(6)).toBe(position(3));
  expect(bar(5).getAttribute('aria-label')).toContain('Meta completada');
  await act(async () => resize([{ contentRect: { width: 600, height: 224 } }]));
  expect(position(3)).toBe('translate3d(270px, -50%, 0)');
});

it('retains lanes across reordered snapshots, departure and reconnection', async () => {
  await render(); const originalLane = lane(5);
  props.members = [...members].reverse().filter((member) => member.user_id !== 3);
  await render(); expect(lane(5)).toBe(originalLane);
  expect(container.querySelector('[data-user-id="3"]')).toBeNull();
  props.members = members.map((member) => ({ ...member, connected: false }));
  props.progress = { 3: { progress: 6, mistakes: 0 } };
  await render(); expect(lane(5)).toBe(originalLane);
  expect(bar(3).getAttribute('aria-valuenow')).toBe('6');
  expect(bar(3).getAttribute('aria-label')).toContain('Sin conexión');
  props.members = members; await render();
  expect(bar(3).getAttribute('aria-label')).not.toContain('Sin conexión');
  expect(bar(3).getAttribute('aria-valuenow')).toBe('6');
});

it('does not display optimistic progress, and accepts authoritative corrections and rapid broadcasts', async () => {
  props.localProgress = 5; props.localSequence = 6; await render();
  props = { ...props, localProgress: 6, pending: true };
  await render(); expect(bar(1).getAttribute('aria-valuenow')).toBe('5');
  props.pending = false; await render(); // Transport error, still no acknowledgement.
  expect(bar(1).getAttribute('aria-valuenow')).toBe('5');
  props.pending = true;
  props.progress = { 1: { progress: 6, mistakes: 0 } };
  await render(); expect(bar(1).getAttribute('aria-valuenow')).toBe('5');
  props = { ...props, pending: false, localSequence: 7 };
  await render(); expect(bar(1).getAttribute('aria-valuenow')).toBe('6');
  props = { ...props, pending: false, localProgress: 4 };
  await render(); expect(bar(1).getAttribute('aria-valuenow')).toBe('4');
  props = { ...props, pending: true, localProgress: 5 }; await render();
  expect(bar(1).getAttribute('aria-valuenow')).toBe('4'); // Old broadcast cannot undo a correction.
  props.pending = false;
  for (const progress of [3, 6, 9, 12]) {
    props.progress = { 2: { progress, mistakes: 0 } }; await render();
  }
  expect(bar(2).getAttribute('aria-valuenow')).toBe('12');
});

it('supports two players, alternate totals, local connection loss and failed avatars', async () => {
  props = { ...props, members: [{ ...members[0], avatar_url: '/missing.png' }, members[1]], total: 10,
    localProgress: 5, progress: { 2: { progress: 99, mistakes: 0 } }, connected: false };
  await render();
  expect(bar(1).getAttribute('aria-label')).toContain('Tú · 5/10 · Sin conexión');
  expect(bar(2).getAttribute('aria-valuenow')).toBe('10');
  const img = container.querySelector('img')!;
  await act(async () => img.dispatchEvent(new Event('error')));
  expect(img.style.display).toBe('none');
  expect(container.querySelector('.race-world-map__avatar')?.textContent).toBe('P');
});
