import { BASE_API_URL } from './api.js';
import { getValidToken, clearSession } from './session.js';

/**
 * Realiza una petición fetch autenticada.
 * Si recibe un 401 (Unauthorized), cierra sesión y redirige al login.
 * 
 * @param {string} endpoint - URL relativa o absoluta (si empieza con http).
 * @param {Object} options - Opciones para fetch (method, headers, body, etc).
 * @returns {Promise<Response>} - Promesa con la respuesta fetch.
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  // 1. Construcción segura de la URL y validación de origen
  // Nota: BASE_API_URL puede o no tener slash final, new URL() lo maneja bien.
  const base = new URL(BASE_API_URL);
  const finalUrl = new URL(endpoint, base);

  // Validar estrictamente el origen (evitar enviar token a terceros)
  if (finalUrl.origin !== base.origin) {
    const error = new Error(`Security Error: Request to external origin blocked (${finalUrl.origin})`);
    error.status = 403;
    throw error;
  }

  // 2. Obtener token SOLO si el origen es confiable
  const token = getValidToken();

  if (!token) {
    const error = new Error('Sesión expirada');
    error.status = 401;
    throw error;
  }

  // 3. Combinar headers
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  // 4. Ejecutar fetch usando la URL validada
  const response = await fetch(finalUrl.toString(), {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('Sesión expirada o no autorizada.');
    clearSession();
    const error = new Error('Sesión expirada');
    error.status = 401;
    throw error;
  }

  return response;
};
