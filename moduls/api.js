// api.js
const API_CONFIG = {
  development: 'http://127.0.0.1:8000',
  production: 'https://api.tu-dominio-prod.com' // TODO: Cambiar por la URL real de producción
};

const isDevelopment = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const ENVIRONMENT = isDevelopment() ? 'development' : 'production';
export const SHOW_ADS = !isDevelopment();
export const BASE_API_URL = isDevelopment() ? API_CONFIG.development : API_CONFIG.production;

// Analytics Config
export const ANALYTICS_ENABLED = true;
export const ANALYTICS_PROVIDER = 'ga4'; // 'ga4' | 'umami' | 'none'
export const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''}`
});
