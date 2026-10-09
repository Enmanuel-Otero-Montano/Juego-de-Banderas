import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

// Optional: run the same checks inside an already launched debuggable Capacitor app.
const androidSerial = process.env.RACE_ANDROID_SERIAL;
const adb = (...args) => execFileSync('adb', ['-s', androidSerial, ...args], { encoding: 'utf8' }).trim();
const output = path.resolve('test-artifacts/race-map', androidSerial ? 'android' : '.');
await mkdir(output, { recursive: true });
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/race-map.tsx"></script></body></html>';
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [{
  name: 'race-map-fixture',
  configureServer(vite) {
    vite.middlewares.use('/race-map-fixture', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml('/race-map-fixture', html));
    });
  },
}] });
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}/race-map-fixture`;
let forwardPort;
const serverPort = server.httpServer.address().port;
let browser;
let page;
let originalUrl;
try {
  if (androidSerial) {
    const pid = adb('shell', 'pidof', 'com.enmanuelotero.atlasflags');
    assert.ok(pid, 'Launch the debug Capacitor app before running the Android checks');
    adb('reverse', `tcp:${serverPort}`, `tcp:${serverPort}`);
    forwardPort = adb('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
  }
  browser = androidSerial
    ? await chromium.connectOverCDP(`http://127.0.0.1:${forwardPort}`, { noDefaults: true })
    : await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true });
  page = androidSerial ? browser.contexts()[0].pages()[0]
    : await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-UY' });
  originalUrl = page.url();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const results = [];
  const settle = async () => {
    await page.waitForTimeout(280);
    await page.waitForFunction(() => [...document.querySelectorAll('.race-world-map__runner')].every((element) =>
      element.getAnimations().every((animation) => animation.playState === 'finished')));
  };
  const update = async (config) => { await page.evaluate((value) => window.raceFixture.update(value), config); await settle(); };
  async function geometry(name) {
    const metrics = await page.evaluate(() => {
      const rect = (element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const map = rect(document.querySelector('.race-world-map'));
      const track = rect(document.querySelector('.race-world-map__lanes'));
      const bars = [...document.querySelectorAll('[role="progressbar"]')].map((element) => ({ ...rect(element), value: +element.getAttribute('aria-valuenow') }));
      return { map, track, bars, slot: rect(document.querySelector('.race-world-map-slot')), header: rect(document.querySelector('.race-game-header')), question: rect(document.querySelector('.race-question > p')),
        flag: rect(document.querySelector('.race-question .flag')), answers: rect(document.querySelector('.race-answer-grid')),
        shell: rect(document.querySelector('.app-shell')), horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        scrollHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight };
    });
    assert.ok(Math.abs(metrics.map.y - metrics.header.bottom - 5) < 1, `${name}: header gap`);
    assert.ok(Math.abs(metrics.question.y - metrics.slot.bottom - 18) < 1, `${name}: question gap`);
    assert.ok(Math.abs(metrics.map.width - metrics.shell.width) < 1, `${name}: full width`);
    assert.ok(metrics.answers.y >= metrics.flag.bottom + 14, `${name}: answers clear flag`);
    assert.equal(metrics.horizontalOverflow, false, `${name}: horizontal overflow`);
    for (const [i, bar] of metrics.bars.entries()) {
      assert.ok(bar.y >= metrics.map.y && bar.bottom <= metrics.map.bottom, `${name}: vertical clip`);
      assert.ok(bar.x >= metrics.map.x && bar.right <= metrics.map.right, `${name}: horizontal clip`);
      const centerY = metrics.track.y + (i + .5) / metrics.bars.length * metrics.track.height;
      assert.ok(Math.abs(bar.y + bar.height / 2 - centerY) < 1, `${name}: even lane distribution`);
      if (i) assert.ok(bar.y - metrics.bars[i - 1].bottom >= 2, `${name}: tied players overlap`);
      const expected = metrics.track.x + 10 + bar.value / 12 * (metrics.track.width - bar.width - 20);
      assert.ok(Math.abs(bar.x - expected) < 1, `${name}: progress alignment ${i}: ${bar.x} vs ${expected}`);
    }
    results.push({ name, ...metrics });
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  }
  await page.goto(url);
  await page.locator('main[aria-hidden="false"] .race-answer:not(:disabled)').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const layouts = androidSerial ? [['native-two', 0, 0, 2], ['native-eight', 0, 0, 8]] : [
    ['two-360x800', 360, 800, 2], ['eight-360x800', 360, 800, 8],
    ...Array.from({ length: 7 }, (_, i) => [`players-${i + 2}-390x844`, 390, 844, i + 2]),
    ['four-320x568', 320, 568, 4], ['five-320x568', 320, 568, 5],
    ['eight-390x844', 390, 844, 8],
    ['eight-320x568', 320, 568, 8], ['four-360x640', 360, 640, 4], ['eight-360x640', 360, 640, 8],
    ['two-412x915', 412, 915, 2], ['eight-412x915', 412, 915, 8],
    ['four-landscape-740x360', 740, 360, 4], ['eight-landscape-740x360', 740, 360, 8],
  ];
  for (const [name, width, height, count] of layouts) {
    if (!androidSerial) await page.setViewportSize({ width, height });
    await update({ count }); await geometry(name);
  }
  // At each viewport, varying the map/player count must not shift the question, flag or answers.
  for (const result of results) {
    const peers = results.filter((peer) => peer.shell.width === result.shell.width && peer.viewportHeight === result.viewportHeight);
    for (const peer of peers) {
      for (const block of ['question', 'flag', 'answers']) {
        assert.ok(Math.abs(peer[block].y - result[block].y) < 1, `${result.name} / ${peer.name}: ${block} stays anchored`);
      }
    }
  }
  if (!androidSerial) {
    const tiers = results.filter((result) => result.name.startsWith('players-'));
    const compact = tiers.slice(0, 3).map((result) => result.map.height);
    const expanded = tiers.slice(3).map((result) => result.map.height);
    assert.ok(compact.every((height) => height === compact[0]), '2–4 players share the compact height');
    assert.ok(expanded.every((height) => height === expanded[0]), '5–8 players share the expanded height');
    assert.ok(compact[0] < expanded[0], 'Compact map must actually be smaller');
    assert.ok(tiers.every((result) => result.answers.y === tiers[0].answers.y), 'Answer grid stays anchored');
    const shortFive = results.find((result) => result.name === 'five-320x568');
    const shortEight = results.find((result) => result.name === 'eight-320x568');
    assert.equal(shortFive.map.height, shortEight.map.height, '5–8 players share the minimum height too');
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await update({ values: Array(8).fill(6) }); await geometry('eight-tied');
  // Each update interrupts the CSS transition. The final target must settle without a queue.
  for (const value of [0, 3, 6, 9, 12]) {
    await page.evaluate((progress) => window.raceFixture.update({ values: Array(8).fill(progress) }), value);
    await page.waitForTimeout(25);
  }
  await settle(); await geometry('eight-finished');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await update({ values: [6, 3, 0, 9, 12, 6, 3, 9] });
  assert.equal(await page.locator('.race-world-map__runner').first().evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
  await update({ offline: true }); await geometry('eight-offline');
  assert.equal(await page.locator('.race-answer:disabled').count(), 4);
  await update({ offline: false });
  await page.locator('.race-answer').first().click();
  assert.equal(await page.evaluate(() => document.body.dataset.answered), 'true');
  await page.locator('.race-game-header button').click();
  assert.equal(await page.evaluate(() => document.body.dataset.exited), 'true');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'measurements.json'), JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} layouts, shared scale, ties, rapid updates, reduced motion, connection and controls. Screenshots: ${output}`);
} finally {
  if (androidSerial) {
    if (page && originalUrl) {
      await page.emulateMedia({ reducedMotion: null });
      await page.goto(originalUrl);
    }
    try { adb('reverse', '--remove', `tcp:${serverPort}`); } catch { /* Setup may have failed. */ }
    if (forwardPort) adb('forward', '--remove', `tcp:${forwardPort}`);
  }
  await browser?.close();
  await server.close();
}
