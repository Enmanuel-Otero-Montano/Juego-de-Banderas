import { apiGetToday, apiSubmitGuess, apiGetFlagBlob } from '../moduls/dailyChallengeApi.js';
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
const modalShareNative = document.getElementById('modal-share-native');
const shareButtonsContainer = document.getElementById('fallback-share-buttons');
const shareTextPreview = document.getElementById('share-text-preview');
const hintsArea = document.getElementById('hints-area');
const hintsList = document.getElementById('hints-list');
const shareButton = document.getElementById('share-result'); // Keep this for the main UI button if needed, or remove if unused. It was used in line 45 HTML.

// Modal Elements
const modal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalAnswer = document.getElementById('correct-country');
const modalClose = document.getElementById('modal-close');

// Game State
let gameState = {
    date: null,
    attempts: 0,
    maxAttempts: 6,
    status: 'playing', // playing, solved, failed
    revealLevel: 0,
    hints: [],
    shareUrl: '',
    shareText: ''
};

let flagImage = new Image();
let currentFlagUrl = null;

// --- Canvas Sizing ---
const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (flagImage.complete && flagImage.src) {
        drawOnCanvas();
    }
};

const drawOnCanvas = () => {
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(flagImage, 0, 0, canvas.width, canvas.height);
};

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
        if (data.max_attempts) gameState.maxAttempts = data.max_attempts;
        gameState.date = data.date;
        gameState.attempts = data.attempts_used;
        gameState.status = data.status; // 'playing', 'solved', 'failed'
        gameState.revealLevel = data.reveal_level || data.attempts_used;
        gameState.hints = data.hints_unlocked || [];
        gameState.shareText = data.share_text;
        gameState.shareUrl = data.share_url;

        dateEl.textContent = gameState.date;

        // 2. Setup UI
        canvas.classList.remove('canvas-clear');
        resizeCanvas();
        renderAttempts();
        renderHints();
        if (gameState.status === 'solved' || gameState.status === 'failed') {
            endGame(gameState.status === 'solved', data.correct_answer);
        }

        // 3. Load Flag Image
        await loadFlagAndDraw();

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

const loadFlagAndDraw = async () => {
    loadingSpinner.classList.remove('hidden');
    try {
        const blob = await apiGetFlagBlob();
        const objectUrl = URL.createObjectURL(blob);

        // Clean up previous URL to avoid leaks
        if (currentFlagUrl) {
            URL.revokeObjectURL(currentFlagUrl);
        }
        currentFlagUrl = objectUrl;

        flagImage.onload = () => {
            loadingSpinner.classList.add('hidden');
            drawOnCanvas();
        };
        flagImage.src = objectUrl;
    } catch (err) {
        console.error("Flag load failed", err);
        loadingSpinner.textContent = "Error al cargar bandera.";
    }
};

const drawPixelated = () => {
    loadFlagAndDraw();
};

const hintIcons = {
    'Continente': '🧭',
    'Hemisferio': '🌍',
    'Subregión': '🗺️',
    'Región': '🗺️',
    'Idioma': '🗣️',
    'Moneda': '💰',
    'Población': '👥',
    'Continente/Región': '🧭'
};

const renderHints = () => {
    if (!gameState.hints || gameState.hints.length === 0) {
        hintsArea.classList.add('hidden');
        return;
    }

    hintsArea.classList.remove('hidden');
    hintsList.innerHTML = '';

    gameState.hints.forEach(hint => {
        const li = document.createElement('li');
        li.className = 'hint-item';

        // Match icon by exact title or if title includes any of the keys
        let icon = 'ℹ️';
        for (const [key, val] of Object.entries(hintIcons)) {
            if (hint.title === key || hint.title.includes(key)) {
                icon = val;
                break;
            }
        }

        li.innerHTML = `<span class="hint-icon">${icon}</span> <strong>${hint.title}:</strong> ${hint.value}`;
        hintsList.appendChild(li);
    });
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
        gameState.shareText = result.share_text || gameState.shareText;
        gameState.shareUrl = result.share_url || gameState.shareUrl;

        if (result.hints_unlocked) {
            gameState.hints = result.hints_unlocked;
        }

        renderAttempts();
        renderHints();
        loadFlagAndDraw();
        guessInput.value = '';

        track('daily_guess', {
            date: gameState.date,
            attempt: gameState.attempts,
            result: result.is_correct ? 'correct' : 'wrong'
        });

        if (result.is_correct || gameState.status === 'solved') {
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
    // Main UI share button can be shown if needed, but we focus on modal
    if (shareButton) shareButton.classList.remove('hidden');

    track('daily_complete', {
        date: gameState.date,
        status: won ? 'won' : 'lost',
        attempts: gameState.attempts
    });

    // Populate Modal
    modalTitle.textContent = won ? "¡Felicidades!" : "¡Se acabaron los intentos!";
    modalTitle.style.color = won ? "var(--text-color)" : "red";

    if (won) {
        canvas.classList.add('canvas-clear');
        drawOnCanvas();
    }

    // Ensure answer is an object or handle string
    const countryName = typeof answer === 'string' ? answer : (answer?.name || 'Desconocido');
    modalAnswer.textContent = countryName;

    // Prepare Share Text
    const shareText = gameState.shareText || `Desafío de Banderas ${gameState.date}\n${won ? gameState.attempts : 'X'}/${gameState.maxAttempts}`;
    const shareUrl = gameState.shareUrl || window.location.origin + window.location.pathname + "?utm_source=share";

    const fullShareText = shareText.includes(shareUrl) ? shareText : `${shareText}\n${shareUrl}`;
    shareTextPreview.value = fullShareText;

    // Show/Hide Share Buttons based on capabilities
    if (navigator.share) {
        modalShareNative.classList.remove('hidden');
        shareButtonsContainer.classList.add('hidden');
    } else {
        modalShareNative.classList.add('hidden');
        shareButtonsContainer.classList.remove('hidden');
        setupShareLinks(fullShareText, shareUrl);
    }

    // Slight delay to allow last frame draw
    setTimeout(() => {
        modal.classList.remove('hidden');
    }, 1000);
};

const setupShareLinks = (text, url) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    // Update hrefs
    document.getElementById('share-wa').href = `https://wa.me/?text=${encodedText}`;
    document.getElementById('share-x').href = `https://twitter.com/intent/tweet?text=${encodedText}`;
    document.getElementById('share-tg').href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    document.getElementById('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
};

const handleNativeShare = async () => {
    // For native share, we pass text and URL separately to avoid duplication in some share sheets
    const shareText = gameState.shareText || `Desafío de Banderas ${gameState.date}\n${gameState.status === 'solved' ? gameState.attempts : 'X'}/${gameState.maxAttempts}`;
    const shareUrl = gameState.shareUrl || window.location.origin + window.location.pathname + "?utm_source=share";

    track('daily_share', { platform: 'native', date: gameState.date });

    try {
        await navigator.share({
            title: 'Desafío Diario de Banderas',
            text: shareText,
            url: shareUrl
        });
    } catch (e) {
        console.log('Share canceled/failed, showing fallbacks');
        modalShareNative.classList.add('hidden');
        shareButtonsContainer.classList.remove('hidden');
        setupShareLinks(text, shareUrl);
    }
};

const handleCopy = async () => {
    const text = shareTextPreview.value;
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById('modal-copy-btn');
        const original = btn.textContent;
        btn.textContent = "✅";
        setTimeout(() => btn.textContent = original, 2000);
        track('daily_share', { platform: 'copy', date: gameState.date });
    } catch (e) {
        console.error('Copy failed', e);
    }
};

// --- Event Listeners ---

submitButton.addEventListener('click', handleGuess);
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
});

window.addEventListener('resize', resizeCanvas);

// UI Share Button (outside modal) - triggers modal
if (shareButton) {
    shareButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
}

// Modal Actions
modalShareNative.addEventListener('click', handleNativeShare);
document.getElementById('modal-copy-btn').addEventListener('click', handleCopy);
modalClose.addEventListener('click', () => modal.classList.add('hidden'));

// Track Manual Shares
['share-wa', 'share-x', 'share-tg', 'share-fb'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        track('daily_share', { platform: id.replace('share-', ''), date: gameState.date });
    });
});

// Start
document.addEventListener('DOMContentLoaded', init);


