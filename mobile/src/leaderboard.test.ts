import { describe, expect, it } from 'vitest';
import { getCountryByCode, getCountryName } from './data/countries';
import { leaderboardContextTitle, leaderboardEntryShowsCountry } from './leaderboard';

describe('presentación del ranking por ubicación', () => {
  const labels = { world: 'Mundo', region: 'América', country: 'Argentina' };

  it.each([
    ['world', 'Mundo'],
    ['region', 'América'],
    ['country', 'Argentina'],
  ] as const)('usa el encabezado contextual para %s', (scope, expected) => {
    expect(leaderboardContextTitle(scope, labels)).toBe(expected);
  });

  it('oculta el país repetido solamente en Mi país', () => {
    expect(leaderboardEntryShowsCountry('country')).toBe(false);
    expect(leaderboardEntryShowsCountry('region')).toBe(true);
    expect(leaderboardEntryShowsCountry('world')).toBe(true);
  });

  it('resuelve a nombre localizado los códigos en mayúsculas devueltos por la API', () => {
    const country = getCountryByCode('UY');
    expect(country).toBeDefined();
    expect(getCountryName(country!, 'es')).toBe('Uruguay');
  });
});
