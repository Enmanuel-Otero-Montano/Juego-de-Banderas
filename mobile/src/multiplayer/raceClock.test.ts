import { describe, expect, it, vi } from 'vitest';
import { RaceClock } from './raceClock';

const epoch = Date.parse('2026-10-08T18:00:00Z');
const iso = (time: number) => new Date(time).toISOString();

describe('shared race clock', () => {
  it.each([100, 300, 500, 1000])('aligns eight devices with %i ms one-way delay, regardless of wall clock and delivery time', (delay) => {
    let officialTime = 0;
    const startsAt = epoch + 10_000;
    const devices = Array.from({ length: 8 }, (_, index) => {
      const origin = index * 2345;
      const clock = new RaceClock(() => officialTime + origin);
      for (let probe = 0; probe < 5; probe++) {
        const sent = probe * 250;
        expect(clock.observe(sent + origin, sent + delay * 2 + 20 + origin,
          iso(epoch + sent + delay), iso(epoch + sent + delay + 20))).toBe(true);
      }
      return { clock, deliveredAt: 5000 + delay + index * 70 };
    });
    // Every client receives the same scheduled instant at a different time.
    for (const device of devices) {
      officialTime = device.deliveredAt;
      vi.spyOn(Date, 'now').mockReturnValue(epoch + officialTime + (device.deliveredAt % 2 ? -120_000 : 120_000));
      expect(startsAt - device.clock.now()).toBe(10_000 - officialTime);
      vi.restoreAllMocks();
    }
    officialTime = 9999;
    expect(devices.every(({ clock }) => clock.now() < startsAt)).toBe(true);
    officialTime = 10_000;
    expect(devices.map(({ clock }) => clock.now())).toEqual(Array(8).fill(startsAt));
    officialTime = 35_000; // Skipped frames / JS pause do not pause official time.
    expect(devices.map(({ clock }) => (epoch + 100_000 - clock.now()) / 1000)).toEqual(Array(8).fill(65));
  });

  it('selects the lowest network RTT and subtracts server processing', () => {
    let now = 2000;
    const clock = new RaceClock(() => now);
    clock.observe(0, 1200, iso(epoch + 100), iso(epoch + 1100));
    clock.observe(0, 1500, iso(epoch + 200), iso(epoch + 300));
    clock.observe(0, 1900, iso(epoch + 1500), iso(epoch + 1600));
    expect(clock.now()).toBe(epoch + now);
    expect(clock.uncertaintyMs).toBe(100);
    now = 62_000;
    expect(clock.ready).toBe(false);
    expect(clock.now()).toBeNaN();
  });

  it('blocks until calibrated, rejects invalid samples, and recalibrates after reconnect', () => {
    const clock = new RaceClock(() => 1000);
    expect(clock.now()).toBeNaN();
    expect(clock.observe(0, 5000, iso(epoch), iso(epoch))).toBe(false);
    expect(clock.observe(0, 100, 'invalid', iso(epoch))).toBe(false);
    expect(clock.observe(0, 100, iso(epoch + 10), iso(epoch))).toBe(false);
    for (let i = 0; i < 3; i++) clock.observe(0, 200, iso(epoch + 100), iso(epoch + 100));
    expect(clock.ready).toBe(true);
    clock.reset();
    expect(clock.now()).toBeNaN();
    for (let i = 0; i < 3; i++) clock.observe(800, 1000, iso(epoch + 10_900), iso(epoch + 10_900));
    expect(clock.now()).toBe(epoch + 11_000);
  });
});
