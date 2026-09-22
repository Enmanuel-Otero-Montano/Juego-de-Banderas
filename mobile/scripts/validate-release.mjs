import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.production');
if (!existsSync(envPath)) {
  console.error('Falta mobile/.env.production. Copiá .env.production.example y completalo.');
  process.exit(1);
}

const parseEnv = (source) => Object.fromEntries(
  source.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
      return [key, value];
    }),
);

const config = { ...parseEnv(readFileSync(envPath, 'utf8')), ...process.env };
const errors = [];
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 20 || (nodeMajor === 20 && nodeMinor < 19)) {
  errors.push(`Node.js ${process.versions.node}: la release requiere Node.js 20.19 o posterior`);
}
const required = [
  'VITE_API_URL',
  'VITE_ADMOB_APP_ID',
  'VITE_ADMOB_REWARDED_ID',
  'VITE_ADMOB_INTERSTITIAL_ID',
  'VITE_REVENUECAT_ANDROID_KEY',
  'VITE_REVENUECAT_ENTITLEMENT',
  'ANDROID_VERSION_CODE',
  'ANDROID_VERSION_NAME',
  'PLAY_PRIVACY_POLICY_URL',
  'PLAY_ACCOUNT_DELETION_URL',
];

for (const key of required) {
  if (!config[key]) errors.push(`${key}: falta el valor`);
}

const productionUrl = (key) => {
  const value = config[key] || '';
  if (!value.startsWith('https://')) errors.push(`${key}: debe usar HTTPS`);
  if (/localhost|127\.0\.0\.1|tu-dominio|example\.com/i.test(value)) {
    errors.push(`${key}: todavía contiene un dominio de ejemplo o local`);
  }
};

productionUrl('VITE_API_URL');
productionUrl('PLAY_PRIVACY_POLICY_URL');
productionUrl('PLAY_ACCOUNT_DELETION_URL');

if (!/^ca-app-pub-\d{16}~\d{10}$/.test(config.VITE_ADMOB_APP_ID || '')) {
  errors.push('VITE_ADMOB_APP_ID: formato inválido');
}
for (const key of ['VITE_ADMOB_REWARDED_ID', 'VITE_ADMOB_INTERSTITIAL_ID']) {
  if (!/^ca-app-pub-\d{16}\/\d{10}$/.test(config[key] || '')) errors.push(`${key}: formato inválido`);
}
if (Object.values(config).some((value) => String(value).includes('3940256099942544'))) {
  errors.push('No se pueden publicar IDs oficiales de prueba de AdMob.');
}
if (!/^goog_[A-Za-z0-9]+$/.test(config.VITE_REVENUECAT_ANDROID_KEY || '')) {
  errors.push('VITE_REVENUECAT_ANDROID_KEY: debe ser la clave pública Android de RevenueCat (goog_…).');
}
if (!/^\d+$/.test(config.ANDROID_VERSION_CODE || '') || Number(config.ANDROID_VERSION_CODE) < 1) {
  errors.push('ANDROID_VERSION_CODE: debe ser un entero positivo.');
}
if (!/^\d+\.\d+\.\d+$/.test(config.ANDROID_VERSION_NAME || '')) {
  errors.push('ANDROID_VERSION_NAME: debe usar el formato X.Y.Z.');
}

const keystoreConfigPath = resolve(process.cwd(), 'android/keystore.properties');
if (!existsSync(keystoreConfigPath)) {
  errors.push('android/keystore.properties: falta la configuración de firma');
} else {
  const signing = parseEnv(readFileSync(keystoreConfigPath, 'utf8'));
  for (const key of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
    if (!signing[key] || /replace-me|cambiar|completar/i.test(signing[key])) {
      errors.push(`android/keystore.properties: ${key} falta o conserva un placeholder`);
    }
  }
  if (signing.storeFile) {
    const storeFile = isAbsolute(signing.storeFile)
      ? signing.storeFile
      : resolve(process.cwd(), 'android/app', signing.storeFile);
    if (!existsSync(storeFile)) errors.push('android/keystore.properties: storeFile no existe');
  }
}

if (errors.length) {
  console.error(`Release bloqueado por ${errors.length} problema(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Configuración de producción validada.');
