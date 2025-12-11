// score.js
import { BASE_API_URL, authHeaders } from '../moduls/api.js';

/**
 * Guarda la puntuación del usuario actual
 * @param {number} score - Puntuación a guardar
 */
export const saveScore = (score) => {
  const headers = {
    ...authHeaders(),
    'Content-Type': 'application/json'
  };
  return fetch(`${BASE_API_URL}/scores/`, {  // <-- Cambio de endpoint
    method: 'POST',
    headers,
    body: JSON.stringify({ score: Number.parseInt(score, 10) || 0 })
  })
  .then(r => {
    if (!r.ok) throw new Error('No se pudo guardar la puntuación');
    return r.json();
  });
};

/**
 * Obtiene rankings según el scope especificado
 * @param {Object} options - Opciones de consulta
 * @param {string} options.scope - Tipo de ranking: 'global', 'user', 'country', 'region'
 * @param {number} options.limit - Cantidad de registros (default: 10)
 * @param {number} options.offset - Desplazamiento para paginación (default: 0)
 * @param {number} options.userId - ID del usuario (requerido si scope='user')
 * @param {string} options.countryCode - Código de país (requerido si scope='country')
 * @param {string} options.region - Nombre de región (requerido si scope='region')
 */
export const getScores = ({ 
  scope = 'global', 
  limit = 10, 
  offset = 0,
  userId = null,
  countryCode = null,
  region = null
} = {}) => {
  const params = new URLSearchParams({
    scope,
    limit: limit.toString(),
    offset: offset.toString()
  });

  // Agregar parámetros opcionales según el scope
  if (scope === 'user' && userId) {
    params.append('user_id', userId.toString());
  }
  if (scope === 'country' && countryCode) {
    params.append('country_code', countryCode);
  }
  if (scope === 'region' && region) {
    params.append('region', region);
  }

  return fetch(`${BASE_API_URL}/scores/?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders()
  })
  .then(r => {
    if (!r.ok) throw new Error('No se pudieron obtener las puntuaciones');
    return r.json();
  });
};

/**
 * Obtiene el top 10 global
 */
export const getGlobalTop = (limit = 10) => {
  return getScores({ scope: 'global', limit });
};

/**
 * Obtiene el top del usuario actual
 */
export const getUserTop = (userId, limit = 10) => {
  return getScores({ scope: 'user', userId, limit });
};

/**
 * Obtiene el top de un país específico
 */
export const getCountryTop = (countryCode, limit = 10) => {
  return getScores({ scope: 'country', countryCode, limit });
};

/**
 * Obtiene el top de una región específica
 */
export const getRegionTop = (region, limit = 10) => {
  return getScores({ scope: 'region', region, limit });
};

/**
 * Obtiene un resumen completo de todos los rankings para el usuario actual
 * Incluye: global, país, región y mejores scores personales
 */
export const getScoresSummary = (limit = 10) => {
  const headers = {
    ...authHeaders(),
    'Content-Type': 'application/json'
  };
  
  const params = new URLSearchParams({
    limit: limit.toString()
  });

  return fetch(`${BASE_API_URL}/scores/summary?${params.toString()}`, {
    method: 'GET',
    headers
  })
  .then(r => {
    if (!r.ok) throw new Error('No se pudo obtener el resumen de puntuaciones');
    return r.json();
  });
};