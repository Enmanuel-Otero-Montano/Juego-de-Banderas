import { countries } from './data/countries';
import { journeyStages } from './data/journey';
import { rankingContract } from './ranking';
import { difficultyRules } from './rules';
import type { Difficulty, RegionKey } from './types';

const REGION_ORDER: RegionKey[] = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export interface CatalogDifficulty {
  flags: number;
  seconds: number;
}

export interface CatalogStage {
  id: number;
  codes: string[];
}

/** Instantánea comparable del catálogo que el ranking comparte con el backend. */
export interface CatalogContract {
  seasonId: string;
  rulesetVersion: number;
  contentVersion: number;
  difficulties: Record<Difficulty, CatalogDifficulty>;
  regions: Record<RegionKey, string[]>;
  stages: CatalogStage[];
}

const sortCodes = (codes: string[]): string[] =>
  [...codes].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

const assertUnique = (codes: string[], label: string): void => {
  const seen = new Set<string>();
  const duplicates = codes.filter((code) => {
    if (seen.has(code)) return true;
    seen.add(code);
    return false;
  });
  if (duplicates.length) {
    throw new Error(`${label} repeats codes: ${[...new Set(duplicates)].join(', ')}`);
  }
};

export const buildCatalogContract = (): CatalogContract => {
  const seen = new Set<string>();
  const grouped = new Map<RegionKey, string[]>();
  for (const region of REGION_ORDER) grouped.set(region, []);

  for (const country of countries) {
    const code = country.code.toLowerCase();
    if (!REGION_ORDER.includes(country.region)) {
      throw new Error(`Unsupported region for ${code}: ${country.region}`);
    }
    if (seen.has(code)) throw new Error(`Duplicate country code: ${code}`);
    seen.add(code);
    grouped.get(country.region)?.push(code);
  }

  const regions = Object.fromEntries(
    REGION_ORDER.map((region) => [region, sortCodes(grouped.get(region) ?? [])]),
  ) as Record<RegionKey, string[]>;

  const difficultyKeys = Object.keys(difficultyRules);
  if (difficultyKeys.length !== DIFFICULTIES.length || DIFFICULTIES.some((id) => !difficultyRules[id])) {
    throw new Error(`Difficulties must be exactly ${DIFFICULTIES.join(', ')}`);
  }

  const stages = [...journeyStages]
    .sort((left, right) => left.id - right.id)
    .map((stage) => {
      const codes = stage.codes.map((code) => code.toLowerCase());
      assertUnique(codes, `Stage ${stage.id}`);
      const missing = codes.filter((code) => !seen.has(code));
      if (missing.length) throw new Error(`Stage ${stage.id} uses codes outside the catalog: ${missing.join(', ')}`);
      return { id: stage.id, codes };
    });

  return {
    seasonId: rankingContract.seasonId,
    rulesetVersion: rankingContract.rulesetVersion,
    contentVersion: rankingContract.contentVersion,
    difficulties: {
      easy: { flags: difficultyRules.easy.questionCount, seconds: difficultyRules.easy.durationSeconds },
      normal: { flags: difficultyRules.normal.questionCount, seconds: difficultyRules.normal.durationSeconds },
      hard: { flags: difficultyRules.hard.questionCount, seconds: difficultyRules.hard.durationSeconds },
    },
    regions,
    stages,
  };
};
