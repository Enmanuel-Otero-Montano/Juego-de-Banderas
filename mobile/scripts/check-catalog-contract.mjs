#!/usr/bin/env node
/**
 * Compara el catálogo vivo de mobile y del backend.
 *
 * Falla si divergen países/regiones, el orden de códigos de las etapas,
 * la temporada o los tiempos por dificultad. No usa red.
 *
 * Regenerar el artefacto en ambos repos (solo si las fuentes ya coinciden):
 *
 *   node scripts/check-catalog-contract.mjs --backend /ruta/al/backend --write
 *
 * Sin --write también exige que ambos contracts/catalog-contract.json
 * sigan iguales a esas fuentes.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobileFixture = resolve(mobileRoot, 'contracts/catalog-contract.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  let backend = process.env.CATALOG_BACKEND_ROOT || '';
  let write = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--backend') backend = args[++index] || '';
    else if (args[index] === '--write') write = true;
    else {
      console.error(`Argumento desconocido: ${args[index]}`);
      process.exit(2);
    }
  }
  return { backend, write };
};

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
};

const canonical = (value) => `${JSON.stringify(stable(value), null, 2)}\n`;

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
};

const showDiff = (leftLabel, left, rightLabel, right) => {
  const directory = mkdtempSync(resolve(tmpdir(), 'catalog-contract-'));
  const leftPath = resolve(directory, 'left.json');
  const rightPath = resolve(directory, 'right.json');
  writeFileSync(leftPath, canonical(left));
  writeFileSync(rightPath, canonical(right));
  console.error(`El contrato diverge entre ${leftLabel} y ${rightLabel}.`);
  spawnSync('diff', ['-u', '--label', leftLabel, '--label', rightLabel, leftPath, rightPath], { stdio: 'inherit' });
};

const summarize = (contract) => {
  const regionCounts = Object.entries(contract.regions)
    .map(([region, codes]) => `${region} ${codes.length}`)
    .join(', ');
  const stageCodes = contract.stages.reduce((total, stage) => total + stage.codes.length, 0);
  const times = ['easy', 'normal', 'hard']
    .map((id) => `${id} ${contract.difficulties[id].flags}/${contract.difficulties[id].seconds}s`)
    .join(', ');
  return [
    `Países: ${Object.values(contract.regions).reduce((total, codes) => total + codes.length, 0)} (${regionCounts})`,
    `Etapas: ${contract.stages.length} (${stageCodes} códigos, en orden)`,
    `Temporada: ${contract.seasonId} ruleset ${contract.rulesetVersion} content ${contract.contentVersion}`,
    `Tiempos: ${times}`,
  ].join('\n');
};

const { backend, write } = parseArgs();
if (!backend) {
  console.error('Falta el checkout del backend. Ejemplo:');
  console.error('  node scripts/check-catalog-contract.mjs --backend /ruta/al/backend');
  process.exit(2);
}

const backendRoot = resolve(backend);
const backendFixture = resolve(backendRoot, 'contracts/catalog-contract.json');

const server = await createServer({
  root: mobileRoot,
  configFile: resolve(mobileRoot, 'vite.config.ts'),
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});
let mobile;
try {
  const catalog = await server.ssrLoadModule('/src/catalogContract.ts');
  mobile = catalog.buildCatalogContract();
} finally {
  await server.close();
}
const backendContract = JSON.parse(run('python3', [resolve(backendRoot, 'scripts/export_catalog_contract.py')], backendRoot));

if (canonical(mobile) !== canonical(backendContract)) {
  showDiff('mobile', mobile, 'backend', backendContract);
  process.exit(1);
}

const text = canonical(mobile);
if (write) {
  mkdirSync(dirname(mobileFixture), { recursive: true });
  mkdirSync(dirname(backendFixture), { recursive: true });
  writeFileSync(mobileFixture, text);
  writeFileSync(backendFixture, text);
}

const fixtures = [
  ['mobile/contracts/catalog-contract.json', mobileFixture],
  ['backend/contracts/catalog-contract.json', backendFixture],
];
for (const [label, path] of fixtures) {
  let committed;
  try {
    committed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`No se pudo leer ${label}. Regeneralo con --write cuando las fuentes coincidan.`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
  if (canonical(committed) !== text) {
    showDiff(label, committed, 'fuentes', mobile);
    console.error('Regenerá ambos artefactos con: node scripts/check-catalog-contract.mjs --backend <backend> --write');
    process.exit(1);
  }
}

console.log('Contrato de catálogos alineado.');
console.log(summarize(mobile));
