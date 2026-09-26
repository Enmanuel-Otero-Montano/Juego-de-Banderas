import { describe, expect, it } from 'vitest';
import { countries } from './data/countries';
import { playRegion, sharedPoolRegion } from './regionBackdrop';
import type { GameConfig } from './types';

const config = (partial: Partial<GameConfig>): GameConfig => ({
  mode: 'quick',
  title: 'Prueba',
  subtitle: '',
  pool: countries,
  questionCount: 10,
  ...partial,
});

describe('fondo por región', () => {
  it('usa la región común del mazo en el modo por regiones', () => {
    const americas = countries.filter((country) => country.region === 'Americas');
    expect(sharedPoolRegion(americas)).toBe('Americas');
    expect(playRegion(config({ mode: 'region', pool: americas }))).toBe('Americas');
  });

  it('en una ronda mixta sigue la región de la pregunta actual', () => {
    expect(sharedPoolRegion(countries)).toBeNull();
    expect(playRegion(config({ mode: 'quick' }), 'Africa')).toBe('Africa');
    expect(playRegion(config({ mode: 'daily' }))).toBe('World');
  });

  it('en Viaje usa el continente de la etapa y Mundo cuando la etapa mezcla regiones', () => {
    expect(playRegion(config({ mode: 'career', contentStageId: 1, pool: [] }))).toBe('Americas');
    expect(playRegion(config({ mode: 'career', contentStageId: 11, pool: [] }))).toBe('Oceania');
    expect(playRegion(config({ mode: 'career', contentStageId: 12, pool: [] }), 'Europe')).toBe('World');
    expect(playRegion(config({ mode: 'career', pool: [] }))).toBe('World');
  });
});
