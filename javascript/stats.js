import { getScoresSummary } from './score.js';

const loadUserStats = async () => {
    try {
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
        console.error('Error loading stats:', error);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    loadUserStats();
});
