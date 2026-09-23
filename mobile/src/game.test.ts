import { describe, expect, it } from 'vitest';
import { countries, getCapitalName, getCountryName } from './data/countries';
import { getHomeStageId, getJourneyExpeditionCountries, getJourneyStagePool, getJourneyStageText, getNextRouteChoices, journeyStages } from './data/journey';
import { buildQuestions, completeSession, millisecondsUntilNextLocalDay } from './game';
import { initialProfile } from './storage';
import type { AnswerRecord, GameConfig } from './types';

const dailyConfig: GameConfig = {
  mode: 'daily',
  title: 'Desafío diario',
  subtitle: '',
  pool: countries,
  questionCount: 7,
  seed: '2026-09-11',
};

describe('catálogo de países', () => {
  it('incluye los 195 estados usados por el juego', () => {
    expect(countries).toHaveLength(195);
    expect(countries.find((country) => country.code === 'uy')?.name).toBe('Uruguay');
  });

  it('localiza los nombres de países en los tres idiomas', () => {
    const germany = countries.find((country) => country.code === 'de')!;
    expect(getCountryName(germany, 'es')).toBe('Alemania');
    expect(getCountryName(germany, 'en')).toBe('Germany');
    expect(getCountryName(germany, 'pt')).toBe('Alemanha');
  });

  it('localiza los nombres de capitales que cambian según el idioma', () => {
    const china = countries.find((country) => country.code === 'cn')!;
    expect(getCapitalName(china, 'es')).toBe('Pekín');
    expect(getCapitalName(china, 'en')).toBe('Beijing');
    expect(getCapitalName(china, 'pt')).toBe('Pequim');
  });

  it('localiza el contenido de las etapas', () => {
    expect(getJourneyStageText(journeyStages[0], 'es').title).toBe('Rumbo al sur');
    expect(getJourneyStageText(journeyStages[0], 'en').title).toBe('Heading south');
    expect(getJourneyStageText(journeyStages[0], 'pt').title).toBe('Rumo ao sul');
  });

  it('usa salidas seguras ante una etapa o traducción inválida', () => {
    expect(getJourneyStagePool(99, initialProfile)).toEqual([]);
    expect(getJourneyStageText({ ...journeyStages[0], id: 99 }, 'en')).toEqual({
      title: 'Rumbo al sur',
      label: 'América del Sur',
      focus: 'Primeros pasos',
    });
  });
});

describe('generador de preguntas', () => {
  it('es determinista para el desafío diario', () => {
    const first = buildQuestions(dailyConfig).map((question) => question.answer.code);
    const second = buildQuestions(dailyConfig).map((question) => question.answer.code);
    expect(first).toEqual(second);
  });

  it('crea cuatro opciones únicas e incluye la respuesta', () => {
    for (const question of buildQuestions(dailyConfig)) {
      expect(new Set(question.options.map((country) => country.code)).size).toBe(4);
      expect(question.options.some((country) => country.code === question.answer.code)).toBe(true);
    }
  });
});

describe('cambio de día', () => {
  it('programa el refresco del desafío diario para la próxima medianoche local', () => {
    expect(millisecondsUntilNextLocalDay(new Date(2026, 8, 23, 23, 59, 30))).toBe(30_000);
    expect(millisecondsUntilNextLocalDay(new Date(2026, 8, 23, 0, 0, 0))).toBe(86_400_000);
  });
});

describe('progreso', () => {
  const records: AnswerRecord[] = Array.from({ length: 10 }, (_, index) => ({
    questionId: String(index),
    countryCode: countries[index].code,
    correct: index < 8,
    usedHint: false,
    wrongAttempts: 0,
    elapsedSeconds: 4,
  }));

  it('no desbloquea una etapa con respuestas pendientes', () => {
    const config: GameConfig = { ...dailyConfig, mode: 'career', stageId: 1, seed: undefined, questionCount: 10 };
    const result = completeSession({ ...initialProfile }, config, records, '2026-09-11');
    expect(result.profile.unlockedStage).toBe(1);
    expect(result.profile.completedStages).not.toContain(1);
    expect(result.reward.newStageUnlocked).toBe(false);
    expect(result.profile.journeyHistory[0]).toMatchObject({ accuracy: 80, passed: false, stageId: 1 });
  });

  it('desbloquea una etapa al resolver todas las banderas', () => {
    const config: GameConfig = { ...dailyConfig, mode: 'career', stageId: 1, seed: undefined, questionCount: 10 };
    const perfect = records.map((record) => ({ ...record, correct: true }));
    const result = completeSession({ ...initialProfile }, config, perfect, '2026-09-11');
    expect(result.profile.unlockedStage).toBe(2);
    expect(result.profile.completedStages).toContain(1);
    expect(result.reward.newStageUnlocked).toBe(true);
    expect(result.profile.journeyHistory[0]).toMatchObject({ accuracy: 100, passed: true, stageId: 1 });
  });

  it('restablece los corazones al fallar una etapa de viaje', () => {
    const config: GameConfig = { ...dailyConfig, mode: 'career', stageId: 1, seed: undefined, questionCount: 10 };
    const failed = records.map((record, index) => ({ ...record, correct: index < 2 }));
    const result = completeSession({ ...initialProfile, campaignHearts: 0 }, config, failed, '2026-09-11');
    expect(result.profile.campaignHearts).toBe(15);
    expect(result.profile.unlockedStage).toBe(1);
  });

  it('no permite repetir la recompensa diaria', () => {
    const first = completeSession({ ...initialProfile }, dailyConfig, records.slice(0, 7), '2026-09-11');
    const second = completeSession(first.profile, dailyConfig, records.slice(0, 7), '2026-09-11');
    expect(second.reward.xp).toBe(0);
    expect(second.reward.coins).toBe(0);
  });

  it('abre la expedición global al superar la etapa 12', () => {
    const config: GameConfig = { ...dailyConfig, mode: 'career', stageId: 12, seed: undefined, questionCount: 10 };
    const perfect = records.map((record) => ({ ...record, correct: true }));
    const result = completeSession({ ...initialProfile, unlockedStage: 12 }, config, perfect, '2026-09-11');
    expect(result.profile.unlockedStage).toBe(13);
    expect(result.profile.completedStages).toContain(12);
    expect(result.reward.newStageUnlocked).toBe(true);
  });

  it('registra las banderas vistas en la expedición sin duplicarlas', () => {
    const config: GameConfig = { ...dailyConfig, mode: 'career', stageId: 13, seed: undefined, questionCount: 10 };
    const result = completeSession({ ...initialProfile, unlockedStage: 13, expeditionSeen: [records[0].countryCode] }, config, records, '2026-09-11');
    expect(result.profile.expeditionSeen).toHaveLength(10);
    expect(new Set(result.profile.expeditionSeen).size).toBe(10);
  });
});

describe('ruta personalizada', () => {
  it('empieza en la región del país elegido', () => {
    const uruguay = countries.find((country) => country.code === 'uy')!;
    const japan = countries.find((country) => country.code === 'jp')!;
    expect(getHomeStageId(uruguay)).toBe(1);
    expect(getHomeStageId(japan)).toBe(5);
  });

  it('incluye un país externo sin duplicar y conserva la división 144/51', () => {
    const andorra = countries.find((country) => country.code === 'ad')!;
    const profile = { ...initialProfile, homeCountryCode: andorra.code, journeyRoute: [getHomeStageId(andorra)] };
    const core = journeyStages.flatMap((stage) => getJourneyStagePool(stage.id, profile));
    expect(core).toHaveLength(144);
    expect(new Set(core.map((country) => country.code)).size).toBe(144);
    expect(core.some((country) => country.code === 'ad')).toBe(true);
    expect(getJourneyExpeditionCountries(profile)).toHaveLength(51);
  });

  it('mueve al bloque regional un país que antes estaba en la etapa final', () => {
    const honduras = countries.find((country) => country.code === 'hn')!;
    const profile = { ...initialProfile, homeCountryCode: honduras.code, journeyRoute: [getHomeStageId(honduras)] };
    const core = journeyStages.flatMap((stage) => getJourneyStagePool(stage.id, profile));
    expect(getJourneyStagePool(2, profile).some((country) => country.code === 'hn')).toBe(true);
    expect(new Set(core.map((country) => country.code)).size).toBe(144);
  });

  it('ofrece dos destinos de continentes diferentes en la primera bifurcación', () => {
    const profile = { ...initialProfile, homeCountryCode: 'uy', journeyRoute: [1], unlockedStage: 2 };
    const choices = getNextRouteChoices(profile);
    expect(choices).toHaveLength(2);
    expect(choices[0].continent).not.toBe(choices[1].continent);
    expect(choices.every((stage) => stage.continent !== 'Americas')).toBe(true);
  });

  it('construye para cualquier origen una ruta con los 11 bloques regionales una sola vez', () => {
    for (const country of countries) {
      let profile = { ...initialProfile, homeCountryCode: country.code, journeyRoute: [getHomeStageId(country)], unlockedStage: 2 };
      while (profile.journeyRoute.length < 11) {
        const choices = getNextRouteChoices(profile);
        profile = { ...profile, journeyRoute: [...profile.journeyRoute, ...choices.map((stage) => stage.id)] };
      }
      expect(profile.journeyRoute).toHaveLength(11);
      expect(new Set(profile.journeyRoute).size).toBe(11);
    }
  });
});
