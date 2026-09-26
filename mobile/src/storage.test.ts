import { describe, expect, it, vi } from 'vitest';
import { initialProfile, migrateProfile, PROFILE_SCHEMA_VERSION, resetLocalProgress, saveProfile } from './storage';

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
    expect(migrated.journeyProgress.normal).toEqual({ unlockedStage: 2, completedStages: [1] });
    expect(migrated.journeyProgress.easy.unlockedStage).toBe(1);
    expect(migrated.journeyProgress.hard.unlockedStage).toBe(1);
    expect(migrated.journeyRoute).toEqual([3, 8]);
    expect(migrated.expeditionSeen).toEqual(['ad', 'sm']);
    expect(migrated.campaignHearts).toBe(0);
    expect(migrated.journeyHistory).toHaveLength(1);
    expect(migrated.journeyHistory[0]).toMatchObject({ accuracy: 70, passed: false });
  });

  it('recupera un perfil seguro cuando el valor no es válido', () => {
    const migrated = migrateProfile(null);
    expect(migrated.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    expect(migrated.journeyProgress.normal).toEqual({ unlockedStage: 1, completedStages: [] });
    expect(migrated.selectedJourneyDifficulty).toBe('normal');
  });

  it('separa el avance heredado según la dificultad de cada etapa aprobada', () => {
    const migrated = migrateProfile({
      unlockedStage: 3,
      completedStages: [1, 2],
      journeyHistory: [
        { id: 'easy-1', playedAt: '2026-09-22T10:00:00Z', stageId: 1, difficulty: 'easy', correct: 8, total: 8, score: 80 },
        { id: 'easy-2', playedAt: '2026-09-22T11:00:00Z', stageId: 2, difficulty: 'easy', correct: 8, total: 8, score: 80 },
      ],
    });

    expect(migrated.journeyProgress.easy).toEqual({ unlockedStage: 3, completedStages: [1, 2] });
    expect(migrated.journeyProgress.hard.unlockedStage).toBe(1);
    expect(migrated.selectedJourneyDifficulty).toBe('easy');
  });

  it('reinicia la partida y conserva identidad, preferencias y compra', () => {
    const reset = resetLocalProgress({
      ...initialProfile,
      xp: 80,
      coins: 10,
      streak: 2,
      sessionsCompleted: 6,
      homeCountryCode: 'uy',
      journeyRoute: [1, 3],
      masteredCountries: { ar: 2 },
      campaignHearts: 2,
      isPremium: true,
      soundEnabled: false,
      hapticsEnabled: true,
      displayName: 'Atlas',
      rankedProfileReady: true,
    });

    expect(reset.xp).toBe(0);
    expect(reset.coins).toBe(initialProfile.coins);
    expect(reset.streak).toBe(0);
    expect(reset.sessionsCompleted).toBe(0);
    expect(reset.journeyRoute).toEqual([]);
    expect(reset.masteredCountries).toEqual({});
    expect(reset.campaignHearts).toBe(initialProfile.campaignHearts);
    expect(reset.journeyProgress.normal).toEqual({ unlockedStage: 1, completedStages: [] });
    expect(reset.homeCountryCode).toBe('uy');
    expect(reset.isPremium).toBe(true);
    expect(reset.soundEnabled).toBe(false);
    expect(reset.hapticsEnabled).toBe(true);
    expect(reset.displayName).toBe('Atlas');
    expect(reset.rankedProfileReady).toBe(true);
  });

  it('informa si el almacenamiento local rechaza el guardado', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new Error('Quota exceeded'); },
    });
    expect(saveProfile(initialProfile)).toBe(false);
    vi.unstubAllGlobals();
  });
});
