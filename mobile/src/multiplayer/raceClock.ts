/** Maps server UTC to a local monotonic clock; never reads the device wall clock. */
export class RaceClock {
  private samples: Array<{ at: number; offset: number; rtt: number }> = [];
  constructor(private readonly monotonicNow: () => number = () => performance.now()) {}

  reset() { this.samples = []; }

  observe(sent: number, received: number, serverReceived: string, serverSent: string): boolean {
    const t1 = Date.parse(serverReceived);
    const t2 = Date.parse(serverSent);
    const elapsed = received - sent;
    const processing = t2 - t1;
    const rtt = elapsed - processing;
    if (![sent, received, t1, t2].every(Number.isFinite) || processing < 0 || rtt < 0 || elapsed > 4000) return false;
    this.samples = this.samples.filter((sample) => received - sample.at < 60_000);
    this.samples.push({ at: received, offset: (t1 + t2 - sent - received) / 2, rtt });
    this.samples = this.samples.slice(-12);
    return true;
  }

  get ready(): boolean { return this.freshSamples().length >= 3; }
  private freshSamples() { return this.samples.filter((sample) => this.monotonicNow() - sample.at < 60_000); }
  get uncertaintyMs(): number {
    return Math.min(...this.freshSamples().map((sample) => sample.rtt)) / 2;
  }
  now(): number {
    const samples = this.freshSamples();
    if (samples.length < 3) return NaN;
    const best = samples.reduce((a, b) => a.rtt <= b.rtt ? a : b);
    return this.monotonicNow() + best.offset;
  }
}
