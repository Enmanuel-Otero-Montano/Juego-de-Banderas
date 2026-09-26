import rawCountries from 'world-countries';
import populationRows from 'country-json/src/country-by-population.json';
import { localeTags } from '../i18n';
import type { Country, LocaleCode, RegionKey } from '../types';

const playableRegions = new Set<RegionKey>(['Americas', 'Europe', 'Asia', 'Africa', 'Oceania']);

type RawCountry = (typeof rawCountries)[number];
const populationByName = new Map(
  (populationRows as Array<{ country: string; population: number }>).map((row) => [row.country, row.population]),
);
// country-json usa nombres históricos para estas nueve entradas; este mapa
// explícito conserva el cruce por ISO sin una petición de red en tiempo real.
const populationByCode: Record<string, number> = {
  cd: 84068091, cg: 5244363, cz: 10629928, fj: 883483, fm: 112640,
  st: 211028, tl: 1267972, tr: 82319724, va: 825,
};
const modernSpanishNames: Record<string, string> = {
  sz: 'Esuatini',
  tr: 'Turquía',
  ci: 'Costa de Marfil',
  cv: 'Cabo Verde',
  tl: 'Timor Oriental',
};

// Curated starter tiers. Analytics can later refine these labels without ever
// changing the simple 10 / 5 / 2 score shown to players.
const familiarCodes = new Set([
  'ar','au','at','be','br','ca','cl','cn','co','cr','cu','dk','eg','fi','fr','de','gr','in','ie','it','jp','kr','mx','nl','nz','no','pe','pt','za','es','se','ch','tr','gb','us','uy','ve','ma','ng','th','ph','id','sa','ae','il','pk','pl','ua','ru','ke','gh','nz',
]);
const expertCodes = new Set([
  'ad','ag','bb','bh','bi','bn','bw','cv','cy','dj','dm','er','fj','fm','ga','gm','gd','gq','gw','ki','km','kn','kw','lc','li','ls','lu','lv','mh','ml','mt','mu','mv','na','nr','pw','qa','rw','sb','sc','sl','sm','sn','so','sr','st','sz','td','tg','to','tv','vu','ws',
]);

const recognitionFor = (code: string): Country['recognition'] =>
  familiarCodes.has(code) ? 'familiar' : expertCodes.has(code) ? 'expert' : 'intermediate';

const isPlayable = (country: RawCountry): boolean =>
  Boolean(country.unMember || country.cca2 === 'PS' || country.cca2 === 'VA') &&
  playableRegions.has(country.region as RegionKey) &&
  Boolean(country.cca2 && country.capital?.[0]);

export const countries: Country[] = rawCountries
  .filter(isPlayable)
  .map((country) => ({
    code: country.cca2.toLowerCase(),
    code3: country.cca3,
    name: modernSpanishNames[country.cca2.toLowerCase()] || country.translations.spa?.common || country.name.common,
    capital: country.capital?.[0] || '—',
    region: country.region as RegionKey,
    subregion: country.subregion || country.region,
    population: populationByCode[country.cca2.toLowerCase()] || populationByName.get(country.name.common) || 0,
    recognition: recognitionFor(country.cca2.toLowerCase()),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

export const regionLabels: Record<RegionKey, string> = {
  Americas: 'América',
  Europe: 'Europa',
  Asia: 'Asia',
  Africa: 'África',
  Oceania: 'Oceanía',
};

export const regionMeta: Record<RegionKey, { emoji: string; accent: string; description: string }> = {
  Americas: { emoji: '🌎', accent: '#E16D3D', description: '35 países · de Canadá a la Patagonia' },
  Europe: { emoji: '🏛️', accent: '#5C7CFA', description: '45 países · historia y diversidad' },
  Asia: { emoji: '🌏', accent: '#D39A23', description: '47 países · el continente más grande' },
  Africa: { emoji: '🌍', accent: '#27A36A', description: '54 países · un mosaico de culturas' },
  Oceania: { emoji: '🌊', accent: '#14A3A8', description: '14 países · islas del Pacífico' },
};

export const getRegionCountries = (region: RegionKey) => countries.filter((country) => country.region === region);

export const getCountryByCode = (code: string | null | undefined): Country | undefined =>
  code ? countries.find((country) => country.code === code.toLowerCase()) : undefined;

const displayNames = new Map<LocaleCode, Intl.DisplayNames>();

export const getCountryName = (country: Country, language: LocaleCode): string => {
  if (typeof Intl.DisplayNames !== 'function') return country.name;
  try {
    let names = displayNames.get(language);
    if (!names) {
      names = new Intl.DisplayNames([localeTags[language]], { type: 'region' });
      displayNames.set(language, names);
    }
    return names.of(country.code.toUpperCase()) || country.name;
  } catch {
    return country.name;
  }
};

const localizedCapitals: Record<Exclude<LocaleCode, 'en'>, Record<string, string>> = {
  es: {
    at: 'Viena', az: 'Bakú', be: 'Bruselas', bg: 'Sofía', ch: 'Berna', ci: 'Yamusukro',
    cn: 'Pekín', cz: 'Praga', de: 'Berlín', dk: 'Copenhague', eg: 'El Cairo', ee: 'Tallin',
    et: 'Adís Abeba', ge: 'Tiflis', gr: 'Atenas', id: 'Yakarta', ie: 'Dublín', in: 'Nueva Delhi',
    is: 'Reikiavik', it: 'Roma', jp: 'Tokio', jo: 'Amán', kh: 'Nom Pen', kp: 'Pionyang',
    kr: 'Seúl', lb: 'Beirut', lk: 'Sri Jayawardenepura Kotte', lt: 'Vilna', ly: 'Trípoli',
    ma: 'Rabat', mm: 'Naipyidó', mn: 'Ulán Bator', mv: 'Malé', np: 'Katmandú', nl: 'Ámsterdam',
    no: 'Oslo', om: 'Mascate', pl: 'Varsovia', pt: 'Lisboa', ro: 'Bucarest', ru: 'Moscú',
    sa: 'Riad', se: 'Estocolmo', si: 'Liubliana', sy: 'Damasco', tr: 'Ankara', gb: 'Londres',
    us: 'Washington D. C.', uz: 'Taskent', va: 'Ciudad del Vaticano', vn: 'Hanói', ye: 'Saná',
  },
  pt: {
    at: 'Viena', az: 'Baku', be: 'Bruxelas', bg: 'Sófia', ch: 'Berna', ci: 'Yamoussoukro',
    cn: 'Pequim', cz: 'Praga', de: 'Berlim', dk: 'Copenhague', eg: 'Cairo', ee: 'Tallinn',
    et: 'Adis Abeba', ge: 'Tbilisi', gr: 'Atenas', id: 'Jacarta', ie: 'Dublin', in: 'Nova Délhi',
    is: 'Reykjavik', it: 'Roma', jp: 'Tóquio', jo: 'Amã', kh: 'Phnom Penh', kp: 'Pyongyang',
    kr: 'Seul', lb: 'Beirute', lk: 'Sri Jayawardenepura Kotte', lt: 'Vilnius', ly: 'Trípoli',
    ma: 'Rabat', mm: 'Nepiedó', mn: 'Ulan Bator', mv: 'Malé', np: 'Catmandu', nl: 'Amsterdã',
    no: 'Oslo', om: 'Mascate', pl: 'Varsóvia', pt: 'Lisboa', ro: 'Bucareste', ru: 'Moscou',
    sa: 'Riade', se: 'Estocolmo', si: 'Liubliana', sy: 'Damasco', tr: 'Ancara', gb: 'Londres',
    us: 'Washington, D.C.', uz: 'Tashkent', va: 'Cidade do Vaticano', vn: 'Hanói', ye: 'Sana',
  },
  fr: {
    at: 'Vienne', az: 'Bakou', be: 'Bruxelles', bg: 'Sofia', ch: 'Berne', ci: 'Yamoussoukro',
    cn: 'Pékin', cz: 'Prague', de: 'Berlin', dk: 'Copenhague', eg: 'Le Caire', ee: 'Tallinn',
    et: 'Addis-Abeba', ge: 'Tbilissi', gr: 'Athènes', id: 'Jakarta', ie: 'Dublin', in: 'New Delhi',
    is: 'Reykjavik', it: 'Rome', jp: 'Tokyo', jo: 'Amman', kh: 'Phnom Penh', kp: 'Pyongyang',
    kr: 'Séoul', lb: 'Beyrouth', lk: 'Sri Jayawardenepura Kotte', lt: 'Vilnius', ly: 'Tripoli',
    ma: 'Rabat', mm: 'Naypyidaw', mn: 'Oulan-Bator', mv: 'Malé', np: 'Katmandou', nl: 'Amsterdam',
    no: 'Oslo', om: 'Mascate', pl: 'Varsovie', pt: 'Lisbonne', ro: 'Bucarest', ru: 'Moscou',
    sa: 'Riyad', se: 'Stockholm', si: 'Ljubljana', sy: 'Damas', tr: 'Ankara', gb: 'Londres',
    us: 'Washington, D.C.', uz: 'Tachkent', va: 'Cité du Vatican', vn: 'Hanoï', ye: 'Sanaa',
  },
  de: {
    at: 'Wien', az: 'Baku', be: 'Brüssel', bg: 'Sofia', ch: 'Bern', ci: 'Yamoussoukro',
    cn: 'Peking', cz: 'Prag', de: 'Berlin', dk: 'Kopenhagen', eg: 'Kairo', ee: 'Tallinn',
    et: 'Addis Abeba', ge: 'Tiflis', gr: 'Athen', id: 'Jakarta', ie: 'Dublin', in: 'Neu-Delhi',
    is: 'Reykjavík', it: 'Rom', jp: 'Tokio', jo: 'Amman', kh: 'Phnom Penh', kp: 'Pjöngjang',
    kr: 'Seoul', lb: 'Beirut', lk: 'Sri Jayawardenepura Kotte', lt: 'Vilnius', ly: 'Tripolis',
    ma: 'Rabat', mm: 'Naypyidaw', mn: 'Ulan-Bator', mv: 'Malé', np: 'Kathmandu', nl: 'Amsterdam',
    no: 'Oslo', om: 'Maskat', pl: 'Warschau', pt: 'Lissabon', ro: 'Bukarest', ru: 'Moskau',
    sa: 'Riad', se: 'Stockholm', si: 'Ljubljana', sy: 'Damaskus', tr: 'Ankara', gb: 'London',
    us: 'Washington, D.C.', uz: 'Taschkent', va: 'Vatikanstadt', vn: 'Hanoi', ye: 'Sanaa',
  },
};

export const getCapitalName = (country: Country, language: LocaleCode): string =>
  language === 'en' ? country.capital : localizedCapitals[language][country.code] || country.capital;

export const formatPopulation = (population: number, language: LocaleCode = 'es'): string =>
  population > 0
    ? new Intl.NumberFormat(localeTags[language], { notation: 'compact', maximumFractionDigits: 1 }).format(population)
    : ({ es: 'población sin datos', en: 'population unavailable', pt: 'população indisponível', fr: 'population indisponible', de: 'Bevölkerung nicht verfügbar' })[language];
