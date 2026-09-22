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

  buttonRegionsMode?.addEventListener("click", () => {
    regionsList?.classList.toggle("region-list-show");
  });

  // Side Menu Logic
  const hmHome = document.querySelector('.hamburger-menu-home');
  const sideMenu = document.querySelector('.side-menu-container');
  const sideOverlay = document.querySelector('.side-menu-overlay');
  const sideClose = document.querySelector('.side-menu-close');

  const aboutGameTrigger = document.querySelector(".about-game-trigger");
  const tutorialTrigger = document.querySelector(".tutorial-trigger");

  const toggleMenu = (show) => {
    if (show) {
      sideMenu?.classList.add('open');
      sideOverlay?.classList.remove('hidden'); // Ensure access
      setTimeout(() => sideOverlay?.classList.add('open'), 10); // Fade in
    } else {
      sideMenu?.classList.remove('open');
      sideOverlay?.classList.remove('open');
      setTimeout(() => sideOverlay?.classList.add('hidden'), 300); // Fade out then hide
    }
  };

  hmHome?.addEventListener('click', () => toggleMenu(true));
  sideClose?.addEventListener('click', () => toggleMenu(false));
  sideOverlay?.addEventListener('click', () => toggleMenu(false));

  aboutGameTrigger?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu(false);
    aboutGameModal?.classList.add("modal-about-game-showing");
  });

  closeModal?.addEventListener("click", () => {
    aboutGameModal?.classList.remove("modal-about-game-showing");
  });

  tutorialTrigger?.addEventListener('click', async (e) => {
    e.preventDefault();
    toggleMenu(false);
    const { showOnboardingManual } = await import('./onboarding.js');
    showOnboardingManual();
  });
}

document.addEventListener('DOMContentLoaded', isUserlogged);

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
