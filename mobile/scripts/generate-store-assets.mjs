import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

function ensureRgbaPng(filePath) {
  const result = spawnSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(filePath)}).convert("RGBA")
im.save(${JSON.stringify(filePath)}, "PNG")
`], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'No se pudo convertir el icono a PNG RGBA');
  }
}

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const outputDir = path.resolve('play-assets');
await mkdir(outputDir, { recursive: true });

const dataUrl = async (file, mime) => {
  const data = await readFile(path.resolve(file));
  return `data:${mime};base64,${data.toString('base64')}`;
};

const [icon, manrope, dmSans] = await Promise.all([
  dataUrl('assets/icon-only.png', 'image/png'),
  dataUrl('node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2', 'font/woff2'),
  dataUrl('node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2', 'font/woff2'),
]);

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  const iconPage = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await iconPage.setContent(`
    <style>*{box-sizing:border-box}html,body{margin:0;width:512px;height:512px;overflow:hidden;background:transparent}img{width:512px;height:512px;display:block}</style>
    <img src="${icon}" alt="">
  `, { waitUntil: 'load' });
  const iconPath = path.join(outputDir, 'icon-512.png');
  await iconPage.screenshot({ path: iconPath, omitBackground: true });
  ensureRgbaPng(iconPath);

  const featurePage = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await featurePage.setContent(`
    <style>
      @font-face{font-family:Manrope;src:url(${manrope}) format('woff2');font-weight:800}
      @font-face{font-family:DMSans;src:url(${dmSans}) format('woff2');font-weight:500}
      *{box-sizing:border-box}html,body{margin:0;width:1024px;height:500px;overflow:hidden}
      body{position:relative;display:flex;align-items:center;padding:46px 70px;background:radial-gradient(circle at 18% 20%,#1d7b60 0,transparent 34%),linear-gradient(125deg,#083d31 0%,#0b5743 58%,#07372d 100%);color:#fff}
      body:before,body:after{content:'';position:absolute;border:1px solid #f4cc5b55;border-radius:50%}
      body:before{width:420px;height:420px;left:-135px;top:142px}body:after{width:250px;height:250px;right:-70px;top:-95px}
      .icon{position:relative;width:360px;height:360px;object-fit:contain;filter:drop-shadow(0 24px 34px #001d1766)}
      .copy{position:relative;margin-left:58px;max-width:500px}.eyebrow{font:800 16px Manrope,sans-serif;letter-spacing:.19em;color:#f4c84d;margin:0 0 13px}
      h1{font:800 47px/1.02 Manrope,sans-serif;letter-spacing:-.04em;margin:0 0 17px}p{font:500 25px/1.3 DMSans,sans-serif;color:#edf8f3;margin:0 0 28px}
      .facts{display:flex;gap:10px;flex-wrap:wrap}.facts span{font:500 15px DMSans,sans-serif;padding:10px 14px;border:1px solid #ffffff35;border-radius:999px;background:#ffffff13;color:#fff}
    </style>
    <img class="icon" src="${icon}" alt="">
    <section class="copy"><div class="eyebrow">TU PASAPORTE AL MUNDO</div><h1>Banderas, Países<br>y Regiones</h1><p>Aprendé el mundo,<br>bandera a bandera.</p><div class="facts"><span>195 países</span><span>12 etapas</span><span>Juego sin conexión</span></div></section>
  `, { waitUntil: 'load' });
  await featurePage.screenshot({ path: path.join(outputDir, 'feature-graphic-1024x500.png') });
  console.log(`Icono y gráfico de funciones creados en ${outputDir}`);
} finally {
  await browser.close();
}
