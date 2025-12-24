// score.js
import { BASE_API_URL, authHeaders } from '../moduls/api.js';
import { authenticatedFetch } from '../moduls/request.js';

/**
 * Guarda la puntuación del usuario actual
 * @param {number} score - Puntuación a guardar
 */
export const saveScore = (score, metadata = {}) => {
  const payload = {
    score: Number.parseInt(score, 10) || 0,
    ...metadata
  };

  console.log('Sending score payload:', payload);

  return authenticatedFetch('/scores/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(r => {
      // Si el backend devuelve 422, lanzamos un error con una propiedad especial para identificarlo
      if (r.status === 422) {
        const err = new Error('Datos de puntuación inválidos');
        err.status = 422;
        throw err;
      }
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

  return authenticatedFetch(`/scores/?${params.toString()}`, {
    method: 'GET'
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
  const params = new URLSearchParams({
    limit: limit.toString()
  });

  return authenticatedFetch(`/scores/summary?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(r => {
      if (!r.ok) throw new Error('No se pudo obtener el resumen de puntuaciones');
      return r.json();
    });
};

/**
 * Obtiene la mejor puntuación del usuario actual
 */
export const getUserBestScore = () => {
  return authenticatedFetch('/scores/me/best', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(r => {
      if (!r.ok) throw new Error('No se pudo obtener la mejor puntuación');
      return r.json();
    });
};