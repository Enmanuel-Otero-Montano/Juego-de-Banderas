import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.staging');
if (!existsSync(envPath)) {
  console.error('Falta mobile/.env.staging. Copiá .env.staging.example y completá la URL de staging.');
  process.exit(1);
}

const config = Object.fromEntries(
  readFileSync(envPath, 'utf8').split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    }),
);

const errors = [];
const apiUrl = config.VITE_API_URL || '';
try {
  const parsed = new URL(apiUrl);
  if (parsed.protocol !== 'https:') errors.push('VITE_API_URL debe usar HTTPS');
  if (/localhost|127\.0\.0\.1|replace-me|example\.(com|net|org)|\.example$/i.test(parsed.hostname)) {
    errors.push('VITE_API_URL todavía contiene un host local o placeholder');
  }
} catch {
  errors.push('VITE_API_URL no es una URL válida');
}
if (config.VITE_RACE_MODE_ENABLED !== 'true') {
  errors.push('VITE_RACE_MODE_ENABLED debe ser true en staging');
}
if (!/^\d+$/.test(config.ANDROID_VERSION_CODE || '') || Number(config.ANDROID_VERSION_CODE) < 1) {
  errors.push('ANDROID_VERSION_CODE debe ser un entero positivo');
}
if (!/^\d+\.\d+\.\d+$/.test(config.ANDROID_VERSION_NAME || '')) {
  errors.push('ANDROID_VERSION_NAME debe usar X.Y.Z');
}
for (const key of ['VITE_ADMOB_REWARDED_ID', 'VITE_ADMOB_INTERSTITIAL_ID']) {
  const value = config[key];
  if (value && !/^ca-app-pub-\d{16}\/\d{10}$/.test(value)) errors.push(`${key} tiene formato inválido`);
}
if (config.VITE_REVENUECAT_ANDROID_KEY && !/^goog_[A-Za-z0-9]+$/.test(config.VITE_REVENUECAT_ANDROID_KEY)) {
  errors.push('VITE_REVENUECAT_ANDROID_KEY tiene formato inválido');
}

if (errors.length) {
  console.error(`Staging bloqueado por ${errors.length} problema(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Staging validado para ${new URL(apiUrl).host}.`);
