import type { Country, LocaleCode, PlayerProfile, RegionKey } from '../types';
import { shuffle } from '../game';
import { countries } from './countries';

export interface JourneyStage {
  id: number;
  title: string;
  label: string;
  emoji: string;
  focus: string;
  codes: string[];
  continent: RegionKey | 'World';
  difficulty: 1 | 2 | 3;
}

export const journeyStages: JourneyStage[] = [
  { id: 1, title: 'Rumbo al sur', label: 'América del Sur', emoji: '🌎', focus: 'Primeros pasos', continent: 'Americas', difficulty: 1, codes: ['ar','br','uy','cl','pe','bo','py','co','ve','ec','gy','sr'] },
  { id: 2, title: 'Del norte al Caribe', label: 'América', emoji: '🌴', focus: 'Norte, centro e islas', continent: 'Americas', difficulty: 1, codes: ['us','ca','mx','cu','jm','pa','cr','do','gt','bs','ni','ht'] },
  { id: 3, title: 'Clásicos europeos', label: 'Europa', emoji: '🏛️', focus: 'Occidente europeo', continent: 'Europe', difficulty: 1, codes: ['es','pt','fr','de','it','gb','ie','nl','be','ch','lu','li'] },
  { id: 4, title: 'Norte y este', label: 'Europa', emoji: '❄️', focus: 'Del Báltico al Mediterráneo', continent: 'Europe', difficulty: 2, codes: ['no','se','fi','dk','is','pl','cz','at','gr','ua','ee','lv'] },
  { id: 5, title: 'Gigantes de Asia', label: 'Asia', emoji: '🌏', focus: 'Las más reconocibles', continent: 'Asia', difficulty: 1, codes: ['cn','jp','kr','kp','in','pk','bd','id','ph','vn','kz','mn'] },
  { id: 6, title: 'Sudeste e Himalaya', label: 'Asia', emoji: '🏔️', focus: 'Nuevos horizontes', continent: 'Asia', difficulty: 2, codes: ['th','my','sg','kh','la','mm','np','bt','lk','mv','bn','tl'] },
  { id: 7, title: 'Oriente próximo', label: 'Asia', emoji: '🕌', focus: 'Colores y símbolos', continent: 'Asia', difficulty: 2, codes: ['sa','ae','qa','il','jo','lb','iq','ir','tr','cy','om','kw'] },
  { id: 8, title: 'Puertas de África', label: 'África', emoji: '🌍', focus: 'Norte, oeste y sur', continent: 'Africa', difficulty: 1, codes: ['eg','ma','dz','tn','ly','za','ng','gh','ke','et','gm','sl'] },
  { id: 9, title: 'Centro y este', label: 'África', emoji: '🦒', focus: 'La dificultad aumenta', continent: 'Africa', difficulty: 2, codes: ['sn','ci','cm','ug','tz','rw','sd','ss','so','mg','bi','er'] },
  { id: 10, title: 'África austral', label: 'África', emoji: '🌅', focus: 'Domina el continente', continent: 'Africa', difficulty: 3, codes: ['ao','mz','zm','zw','na','bw','cd','cg','ga','mu','mw','ls'] },
  { id: 11, title: 'Islas del Pacífico', label: 'Oceanía', emoji: '🌊', focus: 'Banderas insulares', continent: 'Oceania', difficulty: 2, codes: ['au','nz','fj','pg','sb','ws','to','vu','ki','fm','tv','mh'] },
  { id: 12, title: 'Cruce de fronteras', label: 'Mundo', emoji: '🌐', focus: 'El reto final', continent: 'World', difficulty: 3, codes: ['hn','sv','ro','hu','ml','ne','pw','nr','by','tg','al','sk'] },
];

type JourneyStageText = Pick<JourneyStage, 'title' | 'label' | 'focus'>;

const translatedStages: Record<LocaleCode, JourneyStageText[]> = {
  es: journeyStages.map(({ title, label, focus }) => ({ title, label, focus })),
  en: [
    { title: 'Heading south', label: 'South America', focus: 'First steps' },
    { title: 'From the north to the Caribbean', label: 'Americas', focus: 'North, Central America, and islands' },
    { title: 'European classics', label: 'Europe', focus: 'Western Europe' },
    { title: 'North and east', label: 'Europe', focus: 'From the Baltic to the Mediterranean' },
    { title: 'Giants of Asia', label: 'Asia', focus: 'The most recognizable' },
    { title: 'Southeast Asia and the Himalayas', label: 'Asia', focus: 'New horizons' },
    { title: 'The Middle East', label: 'Asia', focus: 'Colors and symbols' },
    { title: 'Gateways to Africa', label: 'Africa', focus: 'North, west, and south' },
    { title: 'Central and eastern Africa', label: 'Africa', focus: 'The difficulty increases' },
    { title: 'Southern Africa', label: 'Africa', focus: 'Master the continent' },
    { title: 'Pacific islands', label: 'Oceania', focus: 'Island flags' },
    { title: 'Crossing borders', label: 'World', focus: 'The final challenge' },
  ],
  pt: [
    { title: 'Rumo ao sul', label: 'América do Sul', focus: 'Primeiros passos' },
    { title: 'Do norte ao Caribe', label: 'Américas', focus: 'Norte, centro e ilhas' },
    { title: 'Clássicos europeus', label: 'Europa', focus: 'Europa Ocidental' },
    { title: 'Norte e leste', label: 'Europa', focus: 'Do Báltico ao Mediterrâneo' },
    { title: 'Gigantes da Ásia', label: 'Ásia', focus: 'As mais reconhecíveis' },
    { title: 'Sudeste Asiático e Himalaia', label: 'Ásia', focus: 'Novos horizontes' },
    { title: 'Oriente Médio', label: 'Ásia', focus: 'Cores e símbolos' },
    { title: 'Portas da África', label: 'África', focus: 'Norte, oeste e sul' },
    { title: 'Centro e leste', label: 'África', focus: 'A dificuldade aumenta' },
    { title: 'África Austral', label: 'África', focus: 'Domine o continente' },
    { title: 'Ilhas do Pacífico', label: 'Oceania', focus: 'Bandeiras insulares' },
    { title: 'Cruzando fronteiras', label: 'Mundo', focus: 'O desafio final' },
  ],
};

export const getJourneyStageText = (stage: JourneyStage, language: LocaleCode): JourneyStageText =>
  translatedStages[language][stage.id - 1];

const regionalStageIds = journeyStages.filter((stage) => stage.id < 12).map((stage) => stage.id);

export const getHomeStageId = (country: Country): number => {
  const existing = journeyStages.slice(0, 11).find((stage) => stage.codes.includes(country.code));
  if (existing) return existing.id;
  if (country.region === 'Americas') return country.subregion === 'South America' ? 1 : 2;
  if (country.region === 'Europe') return /Northern|Eastern/.test(country.subregion) ? 4 : 3;
  if (country.region === 'Asia') {
    if (country.subregion === 'Western Asia') return 7;
    return /South-Eastern|Central/.test(country.subregion) ? 6 : 5;
  }
  if (country.region === 'Africa') {
    if (/Middle|Eastern/.test(country.subregion)) return 9;
    if (/Southern/.test(country.subregion)) return 10;
    return 8;
  }
  return 11;
};

export const getJourneyRoute = (profile: PlayerProfile): number[] => {
  const home = countries.find((country) => country.code === profile.homeCountryCode);
  if (!home) return [];
  const homeStageId = getHomeStageId(home);
  const stored = (profile.journeyRoute || []).filter((id, index, route) => regionalStageIds.includes(id) && route.indexOf(id) === index);
  return stored[0] === homeStageId ? stored : [homeStageId];
};

const getSwap = (profile: PlayerProfile) => {
  const home = countries.find((country) => country.code === profile.homeCountryCode);
  if (!home) return null;
  const homeStageId = getHomeStageId(home);
  const originalStage = journeyStages.find((stage) => stage.codes.includes(home.code));
  if (originalStage?.id === homeStageId) return null;
  const displacedCode = journeyStages[homeStageId - 1].codes.at(-1)!;
  return { homeCode: home.code, homeStageId, originalStageId: originalStage?.id, displacedCode };
};

export const getJourneyStagePool = (stageId: number, profile: PlayerProfile): Country[] => {
  const codes = [...journeyStages[stageId - 1].codes];
  const swap = getSwap(profile);
  if (swap && stageId === swap.homeStageId) codes[codes.indexOf(swap.displacedCode)] = swap.homeCode;
  if (swap?.originalStageId === stageId) codes[codes.indexOf(swap.homeCode)] = swap.displacedCode;
  const codeSet = new Set(codes);
  return countries.filter((country) => codeSet.has(country.code));
};

export const getJourneyExpeditionCountries = (profile: PlayerProfile): Country[] => {
  const coreCodes = new Set(journeyStages.flatMap((stage) => getJourneyStagePool(stage.id, profile).map((country) => country.code)));
  return countries.filter((country) => !coreCodes.has(country.code));
};

export const getExpeditionPool = (profile: PlayerProfile): Country[] => {
  const expedition = getJourneyExpeditionCountries(profile);
  const seen = new Set(profile.expeditionSeen || []);
  const unseen = shuffle(expedition.filter((country) => !seen.has(country.code)));
  const refill = shuffle(expedition.filter((country) => seen.has(country.code)));
  return [...unseen, ...refill].slice(0, 10);
};

export const getNextRouteChoices = (profile: PlayerProfile): JourneyStage[] => {
  const route = getJourneyRoute(profile);
  if (!route.length) return [];
  const remaining = journeyStages.filter((stage) => stage.id < 12 && !route.includes(stage.id));
  if (remaining.length < 2) return remaining;
  const pairIndex = Math.floor((route.length - 1) / 2);
  const targetDifficulty = ([1, 1, 2, 2, 3] as const)[Math.min(pairIndex, 4)];
  const lastContinent = journeyStages[route.at(-1)! - 1].continent;
  const destinationsAwayFromLast = remaining.filter((stage) => stage.continent !== lastContinent);
  const candidates = destinationsAwayFromLast.length >= 2 ? destinationsAwayFromLast : remaining;
  const hasIntercontinentalPair = candidates.some((stage, index) => candidates.slice(index + 1).some((other) => other.continent !== stage.continent));
  const visits = new Map<string, number>();
  route.forEach((id) => {
    const continent = journeyStages[id - 1].continent;
    visits.set(continent, (visits.get(continent) || 0) + 1);
  });

  let best: [JourneyStage, JourneyStage] = [candidates[0], candidates[1]];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const a = candidates[first];
      const b = candidates[second];
      if (hasIntercontinentalPair && a.continent === b.continent) continue;
      const score = Math.abs(a.difficulty - b.difficulty) * 9
        + (Math.abs(a.difficulty - targetDifficulty) + Math.abs(b.difficulty - targetDifficulty)) * 4
        + (a.continent === b.continent ? 14 : 0)
        + (a.continent === lastContinent ? 3 : 0)
        + (b.continent === lastContinent ? 3 : 0)
        + (visits.get(a.continent) || 0)
        + (visits.get(b.continent) || 0)
        + (a.id + b.id) / 100;
      if (score < bestScore) {
        bestScore = score;
        best = [a, b];
      }
    }
  }
  return best;
};
