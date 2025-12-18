import { BASE_API_URL, authHeaders } from './api.js';

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

  // Combinar headers
  const headers = {
    ...authHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('Sesión expirada o no autorizada.');
    const error = new Error('Sesión expirada');
    error.status = 401;
    throw error;
  }

  return response;
};

/**
 * Maneja el cierre de sesión forzado.
 * @deprecated - Se maneja en la UI ahora
 */
function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('name');
  localStorage.removeItem('user_id');
  localStorage.removeItem('profile_image_url');
  sessionStorage.removeItem('accessToken');
  window.location.href = '../pages/user-login.html';
}
