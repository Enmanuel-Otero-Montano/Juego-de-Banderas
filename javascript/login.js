import { BASE_API_URL } from '../moduls/api.js';

const formSubmitLogin = document.getElementById('login-form')

const sendNewVerification = (email) => {
    // Ojo: el backend espera un string JSON (p.ej. '"user@dominio.com"')
    return fetch(`${BASE_API_URL}/resend-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email)
    })
    .then(response => {
      if (!response.ok) throw new Error('Error al reenviar el correo de verificación');
      return response.json();
    });
  };
  

formSubmitLogin.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetch(`${BASE_API_URL}/login`, {
      method: 'POST',
      body: formData
    }).then(async response => {
        // Primero verifica si la respuesta es correcta (código 2xx)
        if (!response.ok) {
            // Si la respuesta no es correcta, convierte el error en JSON
            const errorData = await response.json()
            throw errorData;
        }
        return response.json(); // Si la respuesta es correcta, la convierte en JSON
    }).then(data => {
        const token = data.access_token;
        const name = data.full_name
        const user_id = data.user_id
        const profile_image_url = data.profile_image_url
        
        // Aquí puedes almacenar el token en localStorage, redirigir al usuario, etc.
        // Por ejemplo:
        const successLoginContainer = document.querySelector('.login-message-response');
        if (successLoginContainer) {
            successLoginContainer.textContent = "Inicio de sesión exitoso. Redirigiendo a la página principal...";
            successLoginContainer.classList.add("login-message-response-show")
        }
        try {
            localStorage.setItem('accessToken', token);
        } catch (e) {
            sessionStorage.setItem('accessToken', token);
        }
        localStorage.setItem('profile_image_url', profile_image_url);
        localStorage.setItem('name', name);
        localStorage.setItem('user_id', user_id);
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2900);
    }).catch((errorData) => {
        console.log('login error:', errorData);
      
        // Tu backend devuelve { error, message, path }
        // donde "message" puede ser un string o un objeto { message, email }
        const raw = errorData?.message;
        const message = typeof raw === 'string' ? raw : raw?.message;
        const email   = typeof raw === 'object' ? raw?.email : undefined;
      
        const errorContainer = document.querySelector('.login-message-response');
        if (!errorContainer) return;
      
        if (message === 'Usuario no verificado') {
          errorContainer.textContent = "Cuenta no verificada. Presiona el botón para enviar un nuevo token de verificación a tu correo. Una vez verificado, podrás iniciar sesión.";
          const buttonRequestVerification = document.querySelector('.btn-request-verification');
          const buttonLoginSubmit = document.querySelector('.login-submit');
          buttonLoginSubmit?.classList.add('login-submit-hide');
          buttonRequestVerification?.classList.remove('btn-request-verification-hide');
      
          buttonRequestVerification?.addEventListener('click', () => {
            sendNewVerification(email)
              .then(() => alert('Te enviamos un nuevo correo de verificación.'))
              .catch(err => {
                console.error(err);
                alert('No se pudo reenviar el correo de verificación.');
              });
          }, { once: true });
        } else if (message === 'Usuario o contraseña incorrectos') {
          errorContainer.textContent = message;
        } else {
          errorContainer.textContent = message || 'Error al iniciar sesión';
        }
      
        errorContainer.classList.add("login-message-response-show");
    });        
});