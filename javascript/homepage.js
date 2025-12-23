import { BASE_API_URL } from '../moduls/api.js';
import { authenticatedFetch } from '../moduls/request.js';
import { track } from '../moduls/analytics.js';
import { getValidToken } from '../moduls/session.js';

function isUserlogged() {
  const buttonRegionsMode = document.querySelector(".btn-regions-mode");
  const regionsList = document.querySelector(".region-list");
  const aboutGameButton = document.querySelector(".about-game-button");
  const loginGameButton = document.querySelector(".login-game-button");
  const aboutGameModal = document.querySelector(".modal-about-game");
  const loginGameModal = document.querySelector(".modal-login");
  const closeModal = document.querySelector(".close-button");
  const profileButton = document.querySelector('.profile-button');

  const token = getValidToken();

  if (token) {
    track('login_state', { state: 'logged_in' });
    // Si no existe el botón de perfil en esta página, salir sin romper
    if (!profileButton) return;

    profileButton.classList.add('profile-button-show');

    authenticatedFetch(`/user/${localStorage.getItem('user_id')}/profile_image`, {
      method: 'GET'
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al obtener la imagen del perfil');
        return r.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('profile-img');
        profileButton.appendChild(img);
        profileButton.classList.add('profile-button-show-with-image');
      })
      .catch(err => {
        console.error('Error al obtener la imagen del perfil:', err);
        const name = localStorage.getItem('name') || '';
        const parts = name.trim().split(/\s+/);
        profileButton.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]) : (name[0] || '?');
        profileButton.classList.remove('profile-button-show-with-image');
      });
  } else {
    track('login_state', { state: 'logged_out' });
    // No logueado
    loginGameButton?.classList.add('login-game-button-show');
  }

  // Listeners con optional chaining para no reventar si faltan nodos:
  aboutGameButton?.addEventListener("click", () => {
    aboutGameModal?.classList.add("modal-about-game-showing");
  });

  closeModal?.addEventListener("click", () => {
    aboutGameModal?.classList.remove("modal-about-game-showing");
  });

  buttonRegionsMode?.addEventListener("click", () => {
    regionsList?.classList.toggle("region-list-show");
  });
}

document.addEventListener('DOMContentLoaded', isUserlogged);

// Tutorial Button Handler
document.addEventListener('DOMContentLoaded', () => {
  const tutorialButton = document.querySelector('.tutorial-button');
  if (tutorialButton) {
    tutorialButton.addEventListener('click', async () => {
      // Import and trigger onboarding manually
      const { showOnboardingManual } = await import('./onboarding.js');
      showOnboardingManual();
    });
  }
});

// Cookie Banner Logic
document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('accept-cookies');

  if (!localStorage.getItem('cookiesAccepted')) {
    cookieBanner.style.display = 'flex';
  }

  acceptBtn?.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieBanner.style.display = 'none';
  });
});
