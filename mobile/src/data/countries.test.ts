import { describe, expect, it } from 'vitest';
import { countries, getCountryName } from './countries';

describe('nombres de países', () => {
  it('usa el nombre curado si DisplayNames no está disponible', () => {
    const country = countries.find((item) => item.code === 'de');
    expect(country).toBeDefined();

    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames');
    Object.defineProperty(Intl, 'DisplayNames', { configurable: true, value: undefined });
    try {
      expect(getCountryName(country!, 'en')).toBe(country!.name);
    } finally {
      if (descriptor) Object.defineProperty(Intl, 'DisplayNames', descriptor);
    }
  });
});
