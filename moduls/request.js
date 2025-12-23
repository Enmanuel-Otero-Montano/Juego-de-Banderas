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
  // Construir URL completa si no es absoluta
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_API_URL}${endpoint}`;

  const token = getValidToken();

  if (!token) {
    const error = new Error('Sesión expirada');
    error.status = 401;
    throw error;
  }

  // Combinar headers
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
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
