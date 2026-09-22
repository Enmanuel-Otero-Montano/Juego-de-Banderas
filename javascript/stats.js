import { getCareerMeStats } from './score.js';

const showLoginMessage = () => {
    const loginMessageEl = document.getElementById('login-message');
    if (loginMessageEl) {
        loginMessageEl.style.display = 'block';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch (e) {
        return '-';
    }
};

const loadUserStats = async () => {
    const container = document.getElementById('stats-container');

    try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) {
            showLoginMessage();
            return;
        }

        // Feedback de carga visual sin destruir los elementos internos
        if (container) container.style.opacity = '0.5';

        const stats = await getCareerMeStats();

        if (container) container.style.opacity = '1';

        if (stats) {
            console.log('Career stats received:', stats);

            // A) Stage
            const highestStage = stats.highest_stage_reached ?? '-';
            const totalStages = stats.stages_total ?? '12';
            const stageEl = document.getElementById('stat-highest-stage');
            if (stageEl) stageEl.textContent = `${highestStage}/${totalStages}`;

            // B) Max Score
            const maxScoreEl = document.getElementById('stat-max-score');
            if (maxScoreEl) maxScoreEl.textContent = stats.max_score ?? '0';

            // C) Last Played
            const lastPlayedEl = document.getElementById('stat-last-played');
            if (lastPlayedEl) {
                if (stats.last_played) {
                    lastPlayedEl.innerHTML = `Etapa ${stats.last_played.stage_id}<br>${formatDate(stats.last_played.played_at)}`;
                } else {
                    lastPlayedEl.textContent = 'Sin partidas aún';
                }
            }

            // D) Rank
            const rankEl = document.getElementById('stat-leaderboard-rank');
            if (rankEl) {
                if (stats.leaderboard_rank) {
                    rankEl.textContent = `#${stats.leaderboard_rank}`;
                } else {
                    rankEl.textContent = 'Sin ranking aun';
                    rankEl.style.fontSize = '0.9rem';
                    rankEl.style.fontWeight = 'normal';
                }
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        if (container) {
            container.style.opacity = '1';
            // Mensaje de error discreto o alert
        }
        if (error.status === 401 || error.message === 'Sesión expirada') {
            showLoginMessage();
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    loadUserStats();
});
