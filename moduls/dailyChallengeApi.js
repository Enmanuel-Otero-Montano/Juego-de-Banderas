import { BASE_API_URL, authHeaders } from './api.js';

export const getAnonId = () => {
    let anonId = localStorage.getItem('anon_id');
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem('anon_id', anonId);
    }
    return anonId;
};

const buildHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['X-Anonymous-Id'] = getAnonId();
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

export const apiFlagUrl = (revealLevel = 0) => {
    return `${BASE_API_URL}/daily-challenge/today/flag?reveal_level=${revealLevel}`;
};
