import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const source = await readFile(path.resolve('assets/icon-only.png'));
const icon = `data:image/png;base64,${source.toString('base64')}`;
const densities = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};
const launcherSizes = {
  ldpi: 36,
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  for (const [density, size] of Object.entries(densities)) {
    const directory = path.resolve(`android/app/src/main/res/mipmap-${density}`);
    await mkdir(directory, { recursive: true });
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`
      <style>
        html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
        body{display:grid;place-items:center}img{display:block;width:72%;height:72%;object-fit:contain}
      </style>
      <img src="${icon}" alt="">
    `, { waitUntil: 'load' });
    await page.screenshot({
      path: path.join(directory, 'ic_launcher_foreground.png'),
      omitBackground: true,
    });
    await page.close();
  }

  for (const [density, size] of Object.entries(launcherSizes)) {
    const directory = path.resolve(`android/app/src/main/res/mipmap-${density}`);
    await mkdir(directory, { recursive: true });
    for (const [file, radius] of [['ic_launcher.png', '22%'], ['ic_launcher_round.png', '50%']]) {
      const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      await page.setContent(`
        <style>
          html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
          img{display:block;width:100%;height:100%;object-fit:cover;border-radius:${radius}}
        </style>
        <img src="${icon}" alt="">
      `, { waitUntil: 'load' });
      await page.screenshot({ path: path.join(directory, file), omitBackground: true });
      await page.close();
    }
  }
  console.log('Iconos heredados y capas adaptativas de Android regenerados con la marca de Atlas.');
} finally {
  await browser.close();
}
