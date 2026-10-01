import { apiBaseUrl, type RankingSession } from '../services/api';
import { RACE_PROTOCOL_VERSION, type RaceIntermissionState, type RaceServerMessage } from './contract';

export interface RaceSocket {
  sendReady(ready: boolean): void;
  sendIntermission(state: RaceIntermissionState): void;
  sendAnswer(input: { eventId: string; sequence: number; countryCode: string; selectedCode: string }): void;
  requestSnapshot(): void;
  close(): void;
}

const encodeToken = (token: string): string => {
  const bytes = new TextEncoder().encode(token);
  let binary = '';
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const raceSocketUrl = (roomId: string): string => {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/race-rooms/${encodeURIComponent(roomId)}/socket`;
  url.search = '';
  return url.toString();
};

export const connectRaceSocket = (
  session: RankingSession,
  roomId: string,
  handlers: {
    onMessage: (message: RaceServerMessage) => void;
    onConnectionChange: (connected: boolean) => void;
  },
): RaceSocket => {
  const socket = new WebSocket(raceSocketUrl(roomId), ['atlas-race-v1', `auth.${encodeToken(session.accessToken)}`]);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const send = (message: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ protocol_version: RACE_PROTOCOL_VERSION, ...message }));
  };
  socket.addEventListener('open', () => {
    handlers.onConnectionChange(true);
    heartbeat = setInterval(() => send({ type: 'heartbeat', sent_at: new Date().toISOString() }), 10_000);
  });
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(String(event.data)) as RaceServerMessage;
      if (message.protocol_version === RACE_PROTOCOL_VERSION) handlers.onMessage(message);
    } catch {
      // A malformed frame cannot become local game state; the next snapshot repairs it.
      send({ type: 'snapshot' });
    }
  });
  const disconnected = () => {
    if (heartbeat) clearInterval(heartbeat);
    handlers.onConnectionChange(false);
  };
  socket.addEventListener('close', disconnected);
  socket.addEventListener('error', disconnected);
  return {
    sendReady: (ready) => send({ type: 'ready', ready }),
    sendIntermission: (state) => send({ type: 'intermission_status', state }),
    sendAnswer: ({ eventId, sequence, countryCode, selectedCode }) => send({
      type: 'answer', event_id: eventId, sequence, country_code: countryCode, selected_code: selectedCode,
    }),
    requestSnapshot: () => send({ type: 'snapshot' }),
    close: () => socket.close(1000, 'Leaving race screen'),
  };
};
