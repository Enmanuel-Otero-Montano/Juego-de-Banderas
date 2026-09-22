import { BASE_API_URL, authHeaders } from './api.js';

export const getAnonId = () => {
    let anonId = localStorage.getItem('anon_id');
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem('anon_id', anonId);
    }
    return anonId;
};

export const buildHeaders = (isJson = true) => {
    const headers = {};
    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }

    // Always include Anonymous ID
    headers['X-Anonymous-Id'] = getAnonId();

    // Add Authorization if token exists
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const apiGetToday = async () => {
    const response = await fetch(`${BASE_API_URL}/daily-challenge/today?t=${Date.now()}`, {
        headers: buildHeaders()
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
};

export const apiSubmitGuess = async (guess) => {
    const response = await fetch(`${BASE_API_URL}/daily-challenge/today/guess`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ guess })
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
};

export const apiFlagUrl = () => {
    return `${BASE_API_URL}/daily-challenge/today/flag`;
};

export const apiGetFlagBlob = async () => {
    const response = await fetch(`${apiFlagUrl()}?t=${Date.now()}`, {
        headers: buildHeaders(false)
    });
    if (!response.ok) {
        throw new Error(`Error loading flag: ${response.status}`);
    }
    return response.blob();
};
