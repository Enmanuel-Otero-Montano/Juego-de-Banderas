import { BASE_API_URL } from '../moduls/api.js';
import { authenticatedFetch } from '../moduls/request.js';


const selectCountry = document.getElementById('select-country');
const changeDataProfileFormSubmit = document.getElementById('modify-profile-form');


const getCountries = async () => {
  try {
    const resp = await fetch('https://restcountries.com/v3.1/all?fields=name', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`REST Countries ${resp.status}`);
    const countries = await resp.json();
    countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

    const fragment = document.createDocumentFragment();
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.name.common;
      option.textContent = country.name.common;
      fragment.appendChild(option);
    });
    selectCountry?.appendChild(fragment);
  } catch (e) {
    console.error('Error cargando países:', e);
  }
};


const getUserData = async () => {
  const id = localStorage.getItem('user_id');
  const endpoint = `${BASE_API_URL}/user-profile/${id}`;

  if (!id) {
    console.warn('No hay user_id en storage, redirigiendo a login…');
    return; // o window.location.href = './login.html';
  }

  try {
    const response = await authenticatedFetch(endpoint, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Error al obtener los datos del usuario');
    }

    const userData = await response.json();

    document.getElementById('full-name').value = userData.full_name || '';
    document.getElementById('select-country').value = userData.country || '';
    document.getElementById('username').value = userData.username || '';
  } catch (error) {
    console.error('Error al cargar los datos del usuario:', error.message);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  getUserData();
  getCountries();
});

changeDataProfileFormSubmit?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const loadingIndicator = document.querySelector('.loading-indicator-register');
  loadingIndicator?.classList.add('loading-indicator-register-show');

  try {
    const formData = new FormData(e.target);

    // Validar tipo de archivo de imagen
    const fileInput = document.getElementById('profile-image');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        loadingIndicator?.classList.remove('loading-indicator-register-show');
        const errorContainer = document.querySelector('.modify-profile-response');
        if (errorContainer) {
          errorContainer.textContent = 'El archivo seleccionado no es una imagen válida.';
          errorContainer.classList.add('modify-profile-response-show');
        }
        return;
      }
    }

    const resp = await authenticatedFetch('/user/profile', {
      method: 'PUT',
      body: formData,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || 'No se pudo modificar el perfil');
    }

    const data = await resp.json();
    localStorage.setItem('name', data.full_name || '');
    loadingIndicator?.classList.remove('loading-indicator-register-show');

    const successContainer = document.querySelector('.modify-profile-response');
    successContainer && (successContainer.textContent = 'Perfil modificado correctamente',
      successContainer.classList.add('modify-profile-response-show'));

    document.querySelector('.change-data-profile-submit')?.classList.add('change-data-profile-submit-hide');
    document.querySelector('.go_back_homepage')?.classList.add('go_back_homepage-show');
  } catch (err) {
    loadingIndicator?.classList.remove('loading-indicator-register-show');
    const errorContainer = document.querySelector('.modify-profile-response');
    errorContainer && (errorContainer.textContent = err.message,
      errorContainer.classList.add('modify-profile-response-show'));
    console.error('Error al modificar el perfil:', err.message);
  }
});



