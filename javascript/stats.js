import { getScoresSummary } from './score.js';

const showLoginMessage = () => {
    const loginMessageEl = document.getElementById('login-message');
    if (loginMessageEl) {
        loginMessageEl.style.display = 'block';
    }
};

const loadUserStats = async () => {
    try {
        // Verificar si hay una sesión activa antes de hacer el fetch
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) {
            console.log('No trackable session found.');
            showLoginMessage();
            return;
        }

        const stats = await getScoresSummary(1);
        if (stats) {
            console.log('Stats received:', stats);

            const bestScore = stats.user_best?.max_score ?? '-';
            const globalRank = stats.user_positions?.global?.rank ?? '-';
            const countryRank = stats.user_positions?.country?.rank ?? '-';

            const bestScoreEl = document.getElementById('stat-best-score');
            const globalRankEl = document.getElementById('stat-global-rank');
            const countryRankEl = document.getElementById('stat-country-rank');

            if (bestScoreEl) bestScoreEl.textContent = bestScore;
            if (globalRankEl) globalRankEl.textContent = globalRank !== '-' ? `#${globalRank}` : '-';
            if (countryRankEl) countryRankEl.textContent = countryRank !== '-' ? `#${countryRank}` : '-';
        }
    } catch (error) {
        if (error.status === 401 || error.message === 'Sesión expirada') {
            console.warn('Handling expired session in stats page.');
            showLoginMessage();
        } else {
            console.error('Error loading stats:', error);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    loadUserStats();
});
