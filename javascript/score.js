// score.js
import { authenticatedFetch } from '../moduls/request.js';

/**
 * Obtiene los datos de carrera del usuario actual
 */
export const getCareerMe = () => {
  return authenticatedFetch('/career/me', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).then(r => {
    if (!r.ok) throw new Error('No se pudo obtener el perfil de carrera');
    return r.json();
  });
};

/**
 * Obtiene las estadísticas detalladas de carrera del usuario actual
 */
export const getCareerMeStats = () => {
  return authenticatedFetch('/career/me/stats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).then(r => {
    if (!r.ok) throw new Error('No se pudieron obtener las estadísticas de carrera');
    return r.json();
  });
};

/**
 * Obtiene el ranking de carrera (Leaderboard)
 * @param {Object} options - Filtros de ranking
 * @param {string} options.country - Código de país opcional
 * @param {number} options.limit - Cantidad de registros (default: 10)
 * @param {number} options.offset - Desplazamiento (default: 0)
 */
export const getCareerLeaderboard = ({ country = undefined, region = undefined, difficulty = 'normal', limit = 10, offset = 0 } = {}) => {
  const params = new URLSearchParams({
    difficulty,
    limit: limit.toString(),
    offset: offset.toString()
  });
  if (country) params.append('country', country);
  if (region) params.append('region', region);

  return authenticatedFetch(`/career/leaderboard?${params.toString()}`, {
    method: 'GET'
  }).then(r => {
    if (!r.ok) throw new Error('No se pudo obtener el ranking de carrera');
    return r.json();
  });
};



/**
 * Saves stage completion result for career mode.
 * @param {string} stageId - The ID of the stage completed
 * @param {Object} stageData - Stage completion payload
 * @returns {Promise} API response
 */
export const saveStageResult = (stageId, stageData) => {
  return authenticatedFetch(`/career/stages/${stageId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stageData)
  }).then(async r => {
    if (r.status === 422) {
      const data = await r.json();
      const err = new Error('Payload de etapa inválido');
      err.status = 422;
      err.detail = data.detail;
      throw err;
    }
    if (!r.ok) throw new Error('No se pudo guardar el progreso de la etapa');
    return r.json();
  });
};
