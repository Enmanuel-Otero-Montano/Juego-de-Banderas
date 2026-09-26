import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCatalogContract } from './catalogContract';

const contractPath = resolve(dirname(fileURLToPath(import.meta.url)), '../contracts/catalog-contract.json');

describe('contrato de catálogos', () => {
  it('coincide con el artefacto compartido con el backend', () => {
    const committed = JSON.parse(readFileSync(contractPath, 'utf8'));
    expect(buildCatalogContract()).toEqual(committed);
  });
});
