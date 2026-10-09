import { afterEach, describe, expect, it, vi } from 'vitest';
import { RaceClock } from './raceClock';
import { connectRaceSocket } from './raceSocket';
vi.mock('../services/api', () => ({ apiBaseUrl: 'https://example.test' }));

class FakeSocket extends EventTarget {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 1;
  sent: Array<Record<string, unknown>> = [];
  constructor() { super(); FakeSocket.instances.push(this); }
  send(raw: string) { this.sent.push(JSON.parse(raw)); }
  close() { this.readyState = 3; this.dispatchEvent(new Event('close')); }
  message(data: unknown) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })); }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); FakeSocket.instances = []; });

describe('race transport synchronization', () => {
  it('uses correlated probes, ignores duplicates and resets on connection loss', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('WebSocket', FakeSocket);
    const clock = new RaceClock();
    const handlers = { clock, onClockChange: vi.fn(), onMessage: vi.fn(), onConnectionChange: vi.fn() };
    const transport = connectRaceSocket({ accessToken: 'test', refreshToken: 'test', username: 'one' }, 'room', handlers);
    const ws = FakeSocket.instances[0];
    ws.dispatchEvent(new Event('open'));
    const reply = (index: number) => ({ type: 'heartbeat', protocol_version: 1, revision: 99,
      probe_id: ws.sent[index].probe_id,
      server_received_at: new Date(1_000_000 + performance.now() - 50).toISOString(),
      server_time: new Date(1_000_000 + performance.now() - 50).toISOString() });
    vi.advanceTimersByTime(100);
    const first = reply(0);
    ws.message(first); ws.message(first); ws.message(first);
    expect(clock.ready).toBe(false);
    vi.advanceTimersByTime(250); ws.message(reply(1));
    vi.advanceTimersByTime(250); ws.message(reply(2));
    expect(clock.ready).toBe(true);
    expect(clock.now()).toBe(1_000_600);
    expect(handlers.onMessage).not.toHaveBeenCalled();
    transport.sendAnswer({ roundId: 'round-1', eventId: 'event', sequence: 1, countryCode: 'uy', selectedCode: 'uy' });
    expect(ws.sent.at(-1)).toMatchObject({ round_id: 'round-1', sequence: 1 });
    transport.close();
    expect(clock.ready).toBe(false);
    const count = ws.sent.length;
    vi.advanceTimersByTime(20_000);
    expect(ws.sent).toHaveLength(count);
    ws.message({ type: 'snapshot', protocol_version: 1, revision: 100 });
    expect(handlers.onMessage).not.toHaveBeenCalled();
  });
});
