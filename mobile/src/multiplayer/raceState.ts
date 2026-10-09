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
    const current = state.room?.current_round;
    if (!state.room || (action.round.revision !== undefined && action.round.revision < state.revision) ||
      (current && action.round.number <= current.number)) return state;
    return { ...state, room: withRound(state.room, action.round), revision: action.round.revision ?? state.revision,
      pendingEventId: null, progress: {}, dismissedResultId: null, error: null };
  }
  if (action.type === 'dismiss_result') return { ...state, dismissedResultId: action.roundId };
  if (action.type === 'answer_sent') {
    const room = state.room;
    const round = room?.current_round;
    const participant = round?.participant;
    if (!room || !round || !participant || state.pendingEventId || !['countdown', 'running'].includes(round.status)) return state;
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
  const current = state.room?.current_round;
  // A room revision orders snapshots, but an answer ack can arrive after a
  // newer progress event for somebody else. Match that ack by round + event.
  const matchingAck = message.type === 'answer_result' && message.event_id === state.pendingEventId;
  if ((message.revision || 0) < state.revision && !matchingAck) return state;
  if (message.round_id && message.round_id !== current?.id) return state;
  const revision = Math.max(state.revision, message.revision || 0);
  if ((message.type === 'snapshot' || message.type === 'lobby_state') && message.room) {
    const incoming = message.room.current_round;
    if (current && incoming && (incoming.number < current.number ||
      (incoming.id === current.id && ['finished', 'expired', 'cancelled'].includes(current.status) &&
        ['countdown', 'running'].includes(incoming.status)))) return state;
    if (message.revision === state.revision && state.pendingEventId && incoming?.id === current?.id &&
      incoming?.participant?.expected_sequence === current?.participant?.expected_sequence) return state;
    return { ...state, room: message.room, revision, pendingEventId: null,
      progress: incoming?.id !== current?.id ? {} : state.progress, error: null };
  }
  if (message.type === 'countdown' && message.round && state.room) {
    if (current && message.round.number <= current.number) return state;
    return { ...state, room: withRound(state.room, message.round), revision, pendingEventId: null,
      progress: {}, dismissedResultId: null, error: null };
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
    if (!['countdown', 'running'].includes(state.room.current_round.status) ||
      (message.expected_sequence ?? 0) < participant.expected_sequence ||
      (state.pendingEventId && !matchingAck)) return state;
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
