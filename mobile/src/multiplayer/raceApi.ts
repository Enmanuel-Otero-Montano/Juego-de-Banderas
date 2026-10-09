import { authenticatedRequest, type RankingSession } from '../services/api';
import type { RaceDifficulty, RaceRoom, RaceRound, RaceScope } from './contract';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const createRaceRoom = (
  session: RankingSession,
  input: { scope: RaceScope; difficulty: RaceDifficulty },
): Promise<RaceRoom> => authenticatedRequest(session, '/race-rooms', {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify(input),
});

export const joinRaceRoom = (
  session: RankingSession,
  invitation: { code: string } | { token: string },
): Promise<RaceRoom> => authenticatedRequest(session, '/race-rooms/join', {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify(invitation),
});

export const getRaceRoom = (session: RankingSession, roomId: string): Promise<RaceRoom> =>
  authenticatedRequest(session, `/race-rooms/${encodeURIComponent(roomId)}`);

export const updateRaceRoom = (
  session: RankingSession,
  roomId: string,
  input: { scope?: RaceScope; difficulty?: RaceDifficulty },
): Promise<RaceRoom> => authenticatedRequest(session, `/race-rooms/${encodeURIComponent(roomId)}`, {
  method: 'PATCH',
  headers: jsonHeaders,
  body: JSON.stringify(input),
});

export const leaveRaceRoom = (session: RankingSession, roomId: string): Promise<void> =>
  authenticatedRequest(session, `/race-rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST' });

export const startRaceRound = (session: RankingSession, roomId: string, expectedRevision?: number): Promise<RaceRound> =>
  authenticatedRequest(session, `/race-rooms/${encodeURIComponent(roomId)}/rounds`, {
    method: 'POST', ...(expectedRevision === undefined ? {} : {
      headers: jsonHeaders, body: JSON.stringify({ expected_revision: expectedRevision }),
    }),
  });
