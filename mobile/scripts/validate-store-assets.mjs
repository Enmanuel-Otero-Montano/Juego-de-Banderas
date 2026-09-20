import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('play-assets');
const errors = [];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const listing = readFileSync(path.resolve('PLAY_STORE_LISTING.md'), 'utf8');
const section = (title) => listing.match(new RegExp(`## ${title}\\n\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1].trim() || '';
const listingFields = [
  ['Nombre', section('Nombre'), 30],
  ['Descripción breve', section('Descripción breve'), 80],
  ['Descripción completa', section('Descripción completa'), 4000],
];

for (const [name, value, maxLength] of listingFields) {
  const length = Array.from(value).length;
  if (!value) errors.push(`PLAY_STORE_LISTING.md: falta ${name.toLowerCase()}`);
  if (length > maxLength) errors.push(`PLAY_STORE_LISTING.md: ${name} tiene ${length} caracteres; el máximo es ${maxLength}`);
}

function inspectPng(relativePath) {
  const absolutePath = path.join(root, relativePath);
  let bytes;
  try {
    bytes = readFileSync(absolutePath);
  } catch {
    errors.push(`${relativePath}: falta el archivo`);
    return null;
  }

  if (bytes.length < 29 || !bytes.subarray(0, 8).equals(pngSignature) || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    errors.push(`${relativePath}: no es un PNG válido`);
    return null;
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
    size: statSync(absolutePath).size,
  };
}

function validate(relativePath, expected) {
  const image = inspectPng(relativePath);
  if (!image) return;
  if (image.width !== expected.width || image.height !== expected.height) {
    errors.push(`${relativePath}: mide ${image.width}x${image.height}; debe medir ${expected.width}x${expected.height}`);
  }
  if (image.bitDepth !== 8 || !expected.colorTypes.includes(image.colorType)) {
    errors.push(`${relativePath}: profundidad o tipo de color PNG incompatible con Play Store`);
  }
  if (image.size > expected.maxBytes) {
    errors.push(`${relativePath}: pesa ${(image.size / 1024 / 1024).toFixed(2)} MB; supera el límite permitido`);
  }
}

validate('icon-512.png', {
  width: 512,
  height: 512,
  colorTypes: [6],
  maxBytes: 1024 * 1024,
});
validate('feature-graphic-1024x500.png', {
  width: 1024,
  height: 500,
  colorTypes: [2],
  maxBytes: 15 * 1024 * 1024,
});

let screenshots = [];
try {
  screenshots = readdirSync(path.join(root, 'screenshots'))
    .filter((file) => file.endsWith('.png'))
    .sort();
} catch {
  errors.push('screenshots/: falta la carpeta de capturas');
}

if (screenshots.length < 2 || screenshots.length > 8) {
  errors.push(`screenshots/: contiene ${screenshots.length} PNG; Play Store admite entre 2 y 8 por dispositivo`);
}
for (const screenshot of screenshots) {
  validate(path.join('screenshots', screenshot), {
    width: 1080,
    height: 1920,
    colorTypes: [2],
    maxBytes: 8 * 1024 * 1024,
  });
}

if (errors.length) {
  console.error(`Recursos de Play Store inválidos (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const fieldLengths = listingFields.map(([name, value]) => `${name}: ${Array.from(value).length}`).join(', ');
console.log(`Ficha validada (${fieldLengths}); icono, gráfico destacado y ${screenshots.length} capturas válidos.`);
