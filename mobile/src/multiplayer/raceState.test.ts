import { describe, expect, it } from 'vitest';
import type { RaceRoom } from './contract';
import { initialRaceState, raceReducer } from './raceState';

const room: RaceRoom = {
  id: 'room-1', code: 'ABC234', invite_url: 'https://example.com/race/token', status: 'round_active',
  scope: 'World', difficulty: 'normal', host_user_id: 1, current_user_id: 1, revision: 4,
  expires_at: '2026-10-01T12:00:00Z',
  members: [
    { user_id: 1, display_name: 'Atlas', seat: 1, role: 'host', ready: false, connected: true, intermission_state: 'in_lobby' },
    { user_id: 2, display_name: 'Luna', seat: 2, role: 'player', ready: false, connected: true, intermission_state: 'in_lobby' },
  ],
  current_round: {
    id: 'round-1', number: 1, status: 'running', starts_at: '2026-10-01T10:00:00Z', deadline_at: '2026-10-01T10:01:30Z',
    finished_at: null, finish_reason: null, winner_user_id: null, ruleset_version: 1, content_version: 1,
    participant: { progress: 0, mistakes: 0, expected_sequence: 1, discarded_codes: [], locked_until: null },
    plan: [{ country_code: 'uy', option_codes: ['ar', 'uy', 'br', 'cl'] }],
  },
};

describe('raceReducer', () => {
  it('advances optimistically and then applies the authoritative answer', () => {
    const initial = initialRaceState(room);
    const optimistic = raceReducer(initial, { type: 'answer_sent', eventId: 'event-1', selectedCode: 'uy', correct: true });
    expect(optimistic.room?.current_round?.participant?.progress).toBe(1);
    expect(optimistic.pendingEventId).toBe('event-1');

    const confirmed = raceReducer(optimistic, { type: 'message', message: {
      type: 'answer_result', protocol_version: 1, revision: 5, event_id: 'event-1', correct: true,
      progress: 1, mistakes: 0, expected_sequence: 2, discarded_codes: [], locked_until: null,
    } });
    expect(confirmed.pendingEventId).toBeNull();
    expect(confirmed.room?.current_round?.participant?.expected_sequence).toBe(2);
  });

  it('closes the whole screen as soon as race_finished arrives', () => {
    const finished = raceReducer(initialRaceState(room), { type: 'message', message: {
      type: 'race_finished', protocol_version: 1, revision: 7, reason: 'completed', winner_user_id: 2,
      standings: [
        { rank: 1, user_id: 2, display_name: 'Luna', progress: 12, mistakes: 0, finished_at: '2026-10-01T10:00:40Z' },
        { rank: 2, user_id: 1, display_name: 'Atlas', progress: 11, mistakes: 1, finished_at: null },
      ],
    } });
    expect(finished.room?.status).toBe('waiting');
    expect(finished.room?.current_round?.winner_user_id).toBe(2);
    expect(finished.room?.current_round?.standings?.[0].display_name).toBe('Luna');
  });

  it('shows a neutral intermission state to the rest of the lobby', () => {
    const changed = raceReducer(initialRaceState({ ...room, status: 'waiting' }), { type: 'message', message: {
      type: 'player_intermission_changed', protocol_version: 1, revision: 8, user_id: 2, state: 'ad_break',
    } });
    expect(changed.room?.members[1].intermission_state).toBe('ad_break');
  });
});
