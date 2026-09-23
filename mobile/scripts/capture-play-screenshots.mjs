import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const assetLocale = process.env.PLAY_ASSET_LOCALE || 'es';
const locales = {
  es: {
    browserLocale: 'es-UY', language: 'es', outputDir: 'play-assets/screenshots', displayName: 'ExploradorUY',
    home: '¿A dónde viajamos hoy?', playNow: 'Jugar ahora', journey: 'Modo viaje', route: 'Tu ruta por el mundo',
    regions: 'Por regiones', regionsTitle: 'Explorar por región', progress: 'Progreso', store: 'Abrir tienda', storeTitle: 'Pasaporte Pro',
  },
  en: {
    browserLocale: 'en-US', language: 'en', outputDir: 'play-assets/localized/en-US/screenshots', displayName: 'ExplorerUS',
    home: 'Where should we travel today?', playNow: 'Play now', journey: 'Journey mode', route: 'Your route around the world',
    regions: 'By region', regionsTitle: 'Explore by region', progress: 'Progress', store: 'Open store', storeTitle: 'Pro Passport',
  },
  pt: {
    browserLocale: 'pt-BR', language: 'pt', outputDir: 'play-assets/localized/pt-BR/screenshots', displayName: 'ExploradorBR',
    home: 'Para onde vamos viajar hoje?', playNow: 'Jogar agora', journey: 'Modo viagem', route: 'Sua rota pelo mundo',
    regions: 'Por regiões', regionsTitle: 'Explorar por região', progress: 'Progresso', store: 'Abrir loja', storeTitle: 'Passaporte Pro',
  },
};
const copy = locales[assetLocale];
if (!copy) throw new Error(`PLAY_ASSET_LOCALE inválido: ${assetLocale}`);
const outputDir = path.resolve(copy.outputDir);

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
  locale: copy.browserLocale,
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
  displayName: copy.displayName,
  rankedProfileReady: false,
};

const openHome = async () => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(({ value, language }) => {
    localStorage.setItem('atlas-flags-welcomed', '1');
    localStorage.setItem('atlas-flags-language-v1', language);
    localStorage.setItem('atlas-flags-profile-v1', JSON.stringify(value));
  }, { value: profile, language: copy.language });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: copy.home }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
};

const capture = async (name) => {
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
};

try {
  await openHome();
  await capture('01-inicio.png');

  await page.getByText(copy.playNow, { exact: true }).click();
  await page.locator('.game-screen').waitFor();
  await capture('02-desafio-diario.png');

  await openHome();
  await page.getByText(copy.journey, { exact: true }).click();
  await page.getByRole('heading', { name: copy.route }).waitFor();
  await capture('03-modo-viaje.png');

  await openHome();
  await page.getByText(copy.regions, { exact: true }).click();
  await page.getByRole('heading', { name: copy.regionsTitle }).waitFor();
  await capture('04-regiones.png');

  await openHome();
  await page.getByRole('button', { name: copy.progress }).click();
  await page.getByRole('heading', { name: copy.displayName }).waitFor();
  await capture('05-progreso.png');

  await openHome();
  await page.getByRole('button', { name: copy.store }).click();
  await page.getByRole('heading', { name: copy.storeTitle }).waitFor();
  await capture('06-atlas-pro.png');

  console.log(`Capturas creadas en ${outputDir}`);
} finally {
  await browser?.close();
  stopServer();
}
