import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve('play-assets/screenshots');

await mkdir(outputDir, { recursive: true });

let devServer;
let browser;

const reachable = async () => {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
};

const ensureServer = async () => {
  if (await reachable()) return;
  if (process.env.SCREENSHOT_BASE_URL) {
    throw new Error(`No se pudo abrir SCREENSHOT_BASE_URL: ${baseUrl}`);
  }
  devServer = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    detached: true,
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await reachable()) return;
  }
  throw new Error('Vite no respondió en 30 segundos.');
};

const stopServer = () => {
  if (!devServer?.pid) return;
  try {
    process.kill(-devServer.pid, 'SIGTERM');
  } catch {
    devServer.kill('SIGTERM');
  }
};

await ensureServer();
browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({
  // Google Play recommends portrait screenshots at 9:16 and at least 1080 px.
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  locale: 'es-UY',
  colorScheme: 'light',
});
const page = await context.newPage();

const profile = {
  xp: 580,
  coins: 240,
  streak: 5,
  lastPlayedDate: null,
  sessionsCompleted: 12,
  correctAnswers: 82,
  totalAnswers: 100,
  unlockedStage: 4,
  completedStages: [1, 2, 3],
  expeditionSeen: [],
  homeCountryCode: 'uy',
  journeyRoute: [1, 2, 3, 4],
  masteredCountries: { uy: 5, ar: 4, br: 3, cl: 3, py: 3 },
  dailyResults: {},
  isPremium: false,
  soundEnabled: true,
  hapticsEnabled: true,
  campaignHearts: 13,
  displayName: 'ExploradorUY',
  rankedProfileReady: false,
};

const openHome = async () => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate((value) => {
    localStorage.setItem('atlas-flags-welcomed', '1');
    localStorage.setItem('atlas-flags-profile-v1', JSON.stringify(value));
  }, profile);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '¿A dónde viajamos hoy?' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
};

const capture = async (name) => {
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
};

try {
  await openHome();
  await capture('01-inicio.png');

  await page.getByText('Jugar ahora', { exact: true }).click();
  await page.locator('.game-screen').waitFor();
  await capture('02-desafio-diario.png');

  await openHome();
  await page.getByText('Modo viaje', { exact: true }).click();
  await page.getByRole('heading', { name: 'Tu ruta por el mundo' }).waitFor();
  await capture('03-modo-viaje.png');

  await openHome();
  await page.getByText('Por regiones', { exact: true }).click();
  await page.getByRole('heading', { name: 'Explorar por región' }).waitFor();
  await capture('04-regiones.png');

  await openHome();
  await page.getByRole('button', { name: 'Progreso' }).click();
  await page.getByRole('heading', { name: /Tu pasaporte|ExploradorUY/ }).waitFor();
  await capture('05-progreso.png');

  await openHome();
  await page.getByRole('button', { name: 'Abrir tienda' }).click();
  await page.getByRole('heading', { name: 'Pasaporte Pro' }).waitFor();
  await capture('06-atlas-pro.png');

  console.log(`Capturas creadas en ${outputDir}`);
} finally {
  await browser?.close();
  stopServer();
}
