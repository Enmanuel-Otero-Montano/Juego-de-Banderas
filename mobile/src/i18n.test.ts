import { describe, expect, it } from 'vitest';
import { dictionaries, resolveLocale } from './i18n';
import type { LocaleCode } from './types';

const keys = Object.keys(dictionaries.es) as Array<keyof typeof dictionaries.es>;

describe('francés', () => {
  it('arranca en francés si el teléfono está en francés y no hay idioma guardado', () => {
    expect(resolveLocale(null, 'fr-FR')).toBe('fr');
    expect(resolveLocale(null, 'fr')).toBe('fr');
    expect(resolveLocale('es', 'fr-FR')).toBe('es');
    expect(resolveLocale('fr', 'es-UY')).toBe('fr');
  });

  it('traduce la interfaz cuando el inglés también lo hace', () => {
    const pending = keys.filter((key) => dictionaries.en[key] !== dictionaries.es[key] && dictionaries.fr[key] === dictionaries.es[key]);
    expect(pending).toEqual([]);
  });

  it('cubre el diccionario en los cuatro idiomas', () => {
    (Object.keys(dictionaries) as LocaleCode[]).forEach((language) => {
      expect(Object.keys(dictionaries[language])).toEqual(keys);
    });
    expect(dictionaries.fr['home.title']).toBe('Où voyageons-nous aujourd’hui ?');
    expect(dictionaries.fr['settings.language']).toBe('Langue');
    expect(dictionaries.fr['career.routeTitle']).toBe('Ton parcours à travers le monde');
  });
});

describe('alemán', () => {
  it('arranca en alemán si el teléfono está en alemán y no hay idioma guardado', () => {
    expect(resolveLocale(null, 'de-DE')).toBe('de');
    expect(resolveLocale(null, 'de-AT')).toBe('de');
    expect(resolveLocale('es', 'de-DE')).toBe('es');
    expect(resolveLocale('de', 'es-UY')).toBe('de');
  });

  it('traduce la interfaz cuando el inglés también lo hace', () => {
    const sameAsSpanish = new Set<keyof typeof dictionaries.es>(['region.Europe']);
    const pending = keys.filter((key) => dictionaries.en[key] !== dictionaries.es[key] && dictionaries.de[key] === dictionaries.es[key] && !sameAsSpanish.has(key));
    expect(pending).toEqual([]);
  });

  it('cubre el diccionario en los cinco idiomas', () => {
    (Object.keys(dictionaries) as LocaleCode[]).forEach((language) => {
      expect(Object.keys(dictionaries[language])).toEqual(keys);
    });
    expect(dictionaries.de['home.title']).toBe('Wohin reisen wir heute?');
    expect(dictionaries.de['settings.language']).toBe('Sprache');
    expect(dictionaries.de['career.routeTitle']).toBe('Deine Route um die Welt');
  });
});
