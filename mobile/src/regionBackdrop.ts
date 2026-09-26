import { getJourneyStage } from './data/journey';
import type { Country, GameConfig, RegionKey } from './types';

export type PlayRegion = RegionKey | 'World';

export const sharedPoolRegion = (pool: readonly Country[]): RegionKey | null => {
  const region = pool[0]?.region;
  if (!region || pool.some((country) => country.region !== region)) return null;
  return region;
};

/** Región que pinta el fondo de la partida. En un mix, usa el país de la pregunta actual. */
export const playRegion = (config: GameConfig, current?: RegionKey): PlayRegion => {
  if (config.mode === 'career') {
    const stage = config.contentStageId ? getJourneyStage(config.contentStageId) : undefined;
    if (stage && stage.continent !== 'World') return stage.continent;
    return 'World';
  }
  if (config.mode === 'region') return sharedPoolRegion(config.pool) ?? current ?? 'World';
  return current ?? sharedPoolRegion(config.pool) ?? 'World';
};
