// api.js
export const BASE_API_URL = 'http://127.0.0.1:8000';
export const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''}`
});
