import { apiBaseUrl, type RankingSession } from '../services/api';
import { RaceClock } from './raceClock';
import { RACE_PROTOCOL_VERSION, type RaceIntermissionState, type RaceServerMessage } from './contract';

export interface RaceSocket {
  sendReady(ready: boolean): void;
  sendIntermission(state: RaceIntermissionState): void;
  sendAnswer(input: { roundId: string; eventId: string; sequence: number; countryCode: string; selectedCode: string }): void;
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
    clock: RaceClock;
    onClockChange: () => void;
    onMessage: (message: RaceServerMessage) => void;
    onConnectionChange: (connected: boolean) => void;
  },
): RaceSocket => {
  handlers.clock.reset();
  const probes = new Map<string, number>();
  const warmup: ReturnType<typeof setTimeout>[] = [];
  let closed = false;
  const socket = new WebSocket(raceSocketUrl(roomId), ['atlas-race-v1', `auth.${encodeToken(session.accessToken)}`]);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const send = (message: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ protocol_version: RACE_PROTOCOL_VERSION, ...message }));
  };
  const probe = () => {
    const now = performance.now();
    for (const [id, sent] of probes) if (now - sent > 4000) probes.delete(id);
    const id = crypto.randomUUID();
    probes.set(id, now);
    send({ type: 'heartbeat', probe_id: id });
    handlers.onClockChange();
  };
  socket.addEventListener('open', () => {
    handlers.onConnectionChange(true);
    probe();
    for (let index = 1; index < 5; index++) warmup.push(setTimeout(probe, index * 250));
    heartbeat = setInterval(probe, 10_000);
  });
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(String(event.data)) as RaceServerMessage;
      if (closed || message.protocol_version !== RACE_PROTOCOL_VERSION) return;
      if (message.type === 'heartbeat') {
        const sent = message.probe_id ? probes.get(message.probe_id) : undefined;
        if (sent !== undefined && message.server_received_at && message.server_time) {
          probes.delete(message.probe_id!);
          handlers.clock.observe(sent, performance.now(), message.server_received_at, message.server_time);
          handlers.onClockChange();
        }
        return;
      }
      handlers.onMessage(message);
    } catch {
      // A malformed frame cannot become local game state; the next snapshot repairs it.
      send({ type: 'snapshot' });
    }
  });
  const disconnected = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    warmup.forEach(clearTimeout);
    probes.clear();
    handlers.clock.reset();
    handlers.onClockChange();
    handlers.onConnectionChange(false);
  };
  socket.addEventListener('close', disconnected);
  socket.addEventListener('error', disconnected);
  return {
    sendReady: (ready) => send({ type: 'ready', ready }),
    sendIntermission: (state) => send({ type: 'intermission_status', state }),
    sendAnswer: ({ roundId, eventId, sequence, countryCode, selectedCode }) => send({
      type: 'answer', round_id: roundId, event_id: eventId, sequence, country_code: countryCode, selected_code: selectedCode,
    }),
    requestSnapshot: () => send({ type: 'snapshot' }),
    close: () => { disconnected(); socket.close(1000, 'Leaving race screen'); },
  };
};
