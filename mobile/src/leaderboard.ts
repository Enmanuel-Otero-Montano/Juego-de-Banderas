export type LeaderboardScope = 'world' | 'country' | 'region';

export const leaderboardContextTitle = (
  scope: LeaderboardScope,
  labels: { world: string; country?: string; region?: string },
): string => {
  if (scope === 'country') return labels.country || labels.world;
  if (scope === 'region') return labels.region || labels.world;
  return labels.world;
};

export const leaderboardEntryShowsCountry = (scope: LeaderboardScope): boolean => scope !== 'country';
