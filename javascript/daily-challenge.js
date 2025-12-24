import { apiGetToday, apiSubmitGuess, apiFlagUrl } from '../moduls/dailyChallengeApi.js';
import { track } from '../moduls/analytics.js';
import { SHOW_ADS } from '../moduls/api.js';

// DOM Elements
const dateEl = document.getElementById('daily-date');
const canvas = document.getElementById('flag-canvas');
const ctx = canvas.getContext('2d');
const loadingSpinner = document.getElementById('loading-spinner');
const attemptsGrid = document.getElementById('attempts-grid');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-guess');
const messageArea = document.getElementById('message-area');
const suggestionsList = document.getElementById('country-suggestions');
const shareButton = document.getElementById('share-result');

// Modal Elements
const modal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalAnswer = document.getElementById('correct-country');
const modalShare = document.getElementById('modal-share');
const modalClose = document.getElementById('modal-close');

// Game State
let gameState = {
    date: null,
    attempts: 0,
    maxAttempts: 6,
    status: 'playing', // playing, won, lost
    revealLevel: 0,
};

let flagImage = new Image();

// --- AdSense Logic ---
const initAds = () => {
    if (SHOW_ADS) {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'flex';
        });
    }
};

initAds();

// --- Initialization ---

const init = async () => {
    try {
        track('daily_open', { date: new Date().toISOString().split('T')[0] });

        // 1. Fetch Today's Challenge Data from Backend
        const data = await apiGetToday();
        gameState.date = data.date;
        gameState.attempts = data.attempts_used;
        gameState.status = data.status; // 'playing', 'solved', 'failed'
        gameState.revealLevel = data.reveal_level || data.attempts_used;
        gameState.shareText = data.share_text;

        dateEl.textContent = gameState.date;

        // 2. Setup UI
        renderAttempts();
        if (gameState.status === 'solved' || gameState.status === 'failed') {
            endGame(gameState.status === 'solved', data.correct_answer);
        }

        // 3. Load Flag Image
        flagImage.crossOrigin = "Anonymous";
        flagImage.src = apiFlagUrl(gameState.revealLevel);
        flagImage.onload = () => {
            loadingSpinner.classList.add('hidden');
            console.log(ctx);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(flagImage, 0, 0, canvas.width, canvas.height);
        };
        flagImage.onerror = () => {
            loadingSpinner.textContent = "Error cargando imagen.";
        };

        // 4. Load Autocomplete Suggestions
        loadSuggestions();

    } catch (err) {
        console.error(err);
        dateEl.textContent = "Error de conexión";
        messageArea.textContent = "No se pudo cargar el desafío.";
        messageArea.classList.add('message-error');
    }
};

// --- Pixelation Logic ---

const drawPixelated = (level) => {
    // Backend now handles pixelation, just reload the image with the new level
    loadingSpinner.classList.remove('hidden');
    flagImage.src = apiFlagUrl(level);
};

// --- Initializing Autocomplete ---

const loadSuggestions = async () => {
    try {
        const resp = await fetch('https://restcountries.com/v3.1/all?fields=name');
        if (!resp.ok) return;
        const countries = await resp.json();
        const names = countries.map(c => c.name.common).sort();

        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            suggestionsList.appendChild(option);
        });
    } catch (e) {
        console.warn('Autocomplete fetch failed', e);
    }
};

// --- Game Logic ---

const handleGuess = async () => {
    const guess = guessInput.value.trim();
    if (!guess) return;

    submitButton.disabled = true;
    messageArea.textContent = "Verificando...";
    messageArea.className = 'message-area';

    try {
        // Optimistic UI update (optional, but safer to wait for backend here)
        const result = await apiSubmitGuess(guess);
        console.log(result, "result");
        gameState.attempts = result.attempts_used;
        gameState.status = result.status;
        gameState.revealLevel = result.reveal_level;
        gameState.shareText = result.share_text;

        renderAttempts();
        drawPixelated(gameState.revealLevel);
        guessInput.value = '';

        track('daily_guess', {
            date: gameState.date,
            attempt: gameState.attempts,
            result: result.correct ? 'correct' : 'wrong'
        });

        if (result.correct || gameState.status === 'solved') {
            let answer = result.correct_answer;
            if (!answer && gameState.status === 'solved') {
                // Try to get answer from result or current state if missing
                answer = result.correct_answer || { name: guess }; // Fallback
            }
            endGame(true, answer || result.correct_answer);
        } else if (gameState.status === 'failed') {
            let answer = result.correct_answer;
            if (!answer) {
                try {
                    // Fallback: result from guess might not have the answer, 
                    // but getting "today" state again should have it for a finished game.
                    // Wait a bit to ensure backend state is propagated if needed
                    await new Promise(r => setTimeout(r, 500));
                    const textData = await apiGetToday();
                    console.log(textData, "textData");
                    answer = textData.correct_answer;
                } catch (err) {
                    console.error("Fallback fetch failed", err);
                }
            }
            endGame(false, answer);
        } else {
            messageArea.textContent = "Incorrecto. ¡Intenta de nuevo!";
            messageArea.classList.add('message-error');
            setTimeout(() => {
                messageArea.textContent = "";
                messageArea.classList.remove('message-error');
            }, 2000);
        }

    } catch (err) {
        console.error(err);
        messageArea.textContent = "Error al enviar respuesta.";
        messageArea.classList.add('message-error');
    } finally {
        if (!submitButton.classList.contains('hidden')) {
            submitButton.disabled = false;
            guessInput.focus();
        }
    }
};

const renderAttempts = () => {
    attemptsGrid.innerHTML = '';
    for (let i = 0; i < gameState.maxAttempts; i++) {
        const box = document.createElement('div');
        box.classList.add('attempt-box');
        if (i < gameState.attempts) {
            // Logic for past attempts coloring could be complex (yellow/green) 
            // but requirements just say "reveal pixels". 
            // We'll mark used attempts as generic 'used' (red-ish) unless it's the winning one.
            // Since backend might not return history of exact guesses, we simplify:
            // if won, last used is green.
            if (gameState.status === 'solved' && i === gameState.attempts - 1) {
                box.classList.add('correct');
            } else {
                box.classList.add('used');
            }
        }
        attemptsGrid.appendChild(box);
    }
};

const endGame = (won, answer) => {
    guessInput.disabled = true;
    submitButton.disabled = true;
    submitButton.classList.add('hidden');
    shareButton.classList.remove('hidden');

    track('daily_complete', {
        date: gameState.date,
        status: won ? 'won' : 'lost',
        attempts: gameState.attempts
    });
    // Show Modal
    modalTitle.textContent = won ? "¡Felicidades!" : "¡Se acabaron los intentos!";
    modalTitle.style.color = won ? "var(--text-color)" : "red";
    modalAnswer.innerHTML = `<strong>${answer.name || 'Desconocido'}</strong>`;

    // Slight delay to allow last frame draw
    setTimeout(() => {
        modal.classList.remove('hidden');
    }, 1000);
};

// --- Share Logic ---

const shareResult = async () => {
    const text = gameState.shareText || `Desafío de Banderas ${gameState.date}\n${gameState.status === 'solved' ? gameState.attempts : 'X'}/6`;

    track('daily_share', { date: gameState.date });

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Desafío Diario de Banderas',
                text: text
            });
        } catch (e) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = shareButton.textContent;
            shareButton.textContent = "¡Copiado!";
            modalShare.textContent = "¡Copiado!";
            setTimeout(() => {
                shareButton.textContent = originalText;
                modalShare.textContent = "Compartir";
            }, 2000);
        } catch (e) {
            console.error('Clipboard failed');
            alert('No se pudo copiar al portapapeles.');
        }
    }
};

// --- Event Listeners ---

submitButton.addEventListener('click', handleGuess);
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
});

shareButton.addEventListener('click', shareResult);
modalShare.addEventListener('click', shareResult);
modalClose.addEventListener('click', () => modal.classList.add('hidden'));

// Start
document.addEventListener('DOMContentLoaded', init);
