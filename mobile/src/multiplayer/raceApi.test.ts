import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRaceRoom, joinRaceRoom, startRaceRound } from './raceApi';
import { authenticatedRequest } from '../services/api';

vi.mock('../services/api', () => ({ authenticatedRequest: vi.fn() }));

const session = { accessToken: 'access', refreshToken: 'refresh', username: 'atlas', userId: 1 };

describe('race API', () => {
  beforeEach(() => vi.mocked(authenticatedRequest).mockReset());

  it('never lets the client choose the pool when creating a room', async () => {
    vi.mocked(authenticatedRequest).mockResolvedValue({});
    await createRaceRoom(session, { scope: 'Americas', difficulty: 'hard' });
    expect(authenticatedRequest).toHaveBeenCalledWith(session, '/race-rooms', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ scope: 'Americas', difficulty: 'hard' }),
    }));
  });

  it('normalizes the invitation flow through the dedicated join endpoint', async () => {
    vi.mocked(authenticatedRequest).mockResolvedValue({});
    await joinRaceRoom(session, { code: 'ABC234' });
    expect(authenticatedRequest).toHaveBeenCalledWith(session, '/race-rooms/join', expect.objectContaining({ body: '{"code":"ABC234"}' }));
  });

  it('starts a new round inside the same room', async () => {
    vi.mocked(authenticatedRequest).mockResolvedValue({});
    await startRaceRound(session, 'room one');
    expect(authenticatedRequest).toHaveBeenCalledWith(session, '/race-rooms/room%20one/rounds', { method: 'POST' });
  });
});
