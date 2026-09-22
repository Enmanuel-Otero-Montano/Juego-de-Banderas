import { describe, expect, it } from 'vitest';
import { migrateProfile, PROFILE_SCHEMA_VERSION } from './storage';

describe('migración del perfil local', () => {
  it('conserva un perfil v1 y normaliza colecciones y rangos', () => {
    const migrated = migrateProfile({
      coins: 45,
      unlockedStage: 99,
      completedStages: [1, 1, 12, 99],
      journeyRoute: [3, 3, 8, 12],
      expeditionSeen: ['ad', 'ad', 'sm'],
      campaignHearts: -4,
      journeyHistory: [
        { id: 'run-1', playedAt: '2026-09-22T10:00:00Z', stageId: 1, difficulty: 'normal', correct: 7, total: 10, score: 70 },
        { broken: true },
      ],
    });

    expect(migrated.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    expect(migrated.coins).toBe(45);
    expect(migrated.unlockedStage).toBe(13);
    expect(migrated.completedStages).toEqual([1, 12]);
    expect(migrated.journeyRoute).toEqual([3, 8]);
    expect(migrated.expeditionSeen).toEqual(['ad', 'sm']);
    expect(migrated.campaignHearts).toBe(0);
    expect(migrated.journeyHistory).toHaveLength(1);
    expect(migrated.journeyHistory[0]).toMatchObject({ accuracy: 70, passed: false });
  });

  it('recupera un perfil seguro cuando el valor no es válido', () => {
    const migrated = migrateProfile(null);
    expect(migrated.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    expect(migrated.unlockedStage).toBe(1);
    expect(migrated.completedStages).toEqual([]);
  });
});
