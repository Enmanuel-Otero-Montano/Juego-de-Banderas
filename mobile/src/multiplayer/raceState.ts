import type { RaceRoom, RaceRound, RaceServerMessage } from './contract';

export interface RaceState {
  room: RaceRoom | null;
  connected: boolean;
  revision: number;
  progress: Record<number, { progress: number; mistakes: number }>;
  pendingEventId: string | null;
  dismissedResultId: string | null;
  error: string | null;
}

export const initialRaceState = (room: RaceRoom | null = null): RaceState => ({
  room,
  connected: false,
  revision: room?.revision || 0,
  progress: {},
  pendingEventId: null,
  dismissedResultId: null,
  error: null,
});

export type RaceAction =
  | { type: 'connection'; connected: boolean }
  | { type: 'message'; message: RaceServerMessage }
  | { type: 'round_started'; round: RaceRound }
  | { type: 'answer_sent'; eventId: string; selectedCode: string; correct: boolean }
  | { type: 'dismiss_result'; roundId: string }
  | { type: 'error'; message: string };

const withRound = (room: RaceRoom, round: RaceRound): RaceRoom => ({ ...room, status: 'round_active', current_round: round });

export const raceReducer = (state: RaceState, action: RaceAction): RaceState => {
  if (action.type === 'connection') return { ...state, connected: action.connected };
  if (action.type === 'error') return { ...state, error: action.message, pendingEventId: null };
  if (action.type === 'round_started') {
    return state.room ? { ...state, room: withRound(state.room, action.round), dismissedResultId: null, error: null } : state;
  }
  if (action.type === 'dismiss_result') return { ...state, dismissedResultId: action.roundId };
  if (action.type === 'answer_sent') {
    const room = state.room;
    const round = room?.current_round;
    const participant = round?.participant;
    if (!room || !round || !participant) return state;
    return {
      ...state,
      pendingEventId: action.eventId,
      room: withRound(room, {
        ...round,
        participant: action.correct
          ? { ...participant, progress: Math.min(participant.progress + 1, round.plan?.length || 12), discarded_codes: [] }
          : { ...participant, discarded_codes: [...participant.discarded_codes, action.selectedCode] },
      }),
    };
  }

  const message = action.message;
  const revision = Math.max(state.revision, message.revision || 0);
  if ((message.type === 'snapshot' || message.type === 'lobby_state') && message.room) {
    return { ...state, room: message.room, revision, pendingEventId: null, error: null };
  }
  if (message.type === 'countdown' && message.round && state.room) {
    return { ...state, room: withRound(state.room, message.round), revision, progress: {}, dismissedResultId: null, error: null };
  }
  if (message.type === 'progress' && message.participants) {
    return {
      ...state,
      revision,
      progress: Object.fromEntries(message.participants.map((item) => [item.user_id, { progress: item.progress, mistakes: item.mistakes }])),
    };
  }
  if (message.type === 'player_intermission_changed' && message.user_id && message.state && state.room) {
    return {
      ...state,
      revision,
      room: { ...state.room, members: state.room.members.map((member) => member.user_id === message.user_id
        ? { ...member, intermission_state: message.state! }
        : member) },
    };
  }
  if (message.type === 'answer_result' && state.room?.current_round?.participant) {
    const participant = state.room.current_round.participant;
    return {
      ...state,
      revision,
      pendingEventId: null,
      room: withRound(state.room, {
        ...state.room.current_round,
        participant: {
          ...participant,
          progress: message.progress ?? participant.progress,
          mistakes: message.mistakes ?? participant.mistakes,
          expected_sequence: message.expected_sequence ?? participant.expected_sequence,
          discarded_codes: message.discarded_codes ?? participant.discarded_codes,
          locked_until: message.locked_until ?? null,
        },
      }),
    };
  }
  if (message.type === 'race_finished' && state.room?.current_round) {
    return {
      ...state,
      revision,
      pendingEventId: null,
      room: {
        ...state.room,
        status: 'waiting',
        current_round: {
          ...state.room.current_round,
          status: message.reason === 'timeout' ? 'expired' : 'finished',
          finish_reason: message.reason || 'completed',
          winner_user_id: message.winner_user_id ?? null,
          standings: message.standings || [],
        },
      },
    };
  }
  if (message.type === 'error') return { ...state, revision, error: message.message || message.code || 'Race error', pendingEventId: null };
  return { ...state, revision };
};
