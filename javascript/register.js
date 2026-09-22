import { BASE_API_URL } from '../moduls/api.js';

const formSubmitRegister = document.getElementById('register-form')
const buttonTogglePassword = document.getElementById('toggle-password-text')


formSubmitRegister.addEventListener('submit', function(event) {
    event.preventDefault()

    const formData = new FormData(event.target)
    const loadingIndicator = document.querySelector('.loading-indicator-register');
    loadingIndicator.classList.add('loading-indicator-register-show');
    
    console.log(formData)
    fetch(`${BASE_API_URL}/register`, {
        method: 'POST',
        body: formData,
    }).then(async response => {
        if (!response.ok){
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Register failed');
        }
        return response.json(); // Si la respuesta es correcta, la convierte en JSON
    }).then(data => {
        loadingIndicator.classList.remove('loading-indicator-register-show');
        console.log('Registro exitoso:', data);
        location.href = "../pages/successful-registration.html"
    }).catch(error => {
        loadingIndicator.classList.remove('loading-indicator-register-show');
        console.error('Error en el registro de usuario:', error.message)
        const errorContainer = document.querySelector('.register-response');
        if (errorContainer) {
            errorContainer.textContent = error.message;
            errorContainer.classList.add("register-response-show")
        }
    })
})

buttonTogglePassword.addEventListener('click', function() {
    const passwordInput = document.getElementById('password')
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'
        buttonTogglePassword.textContent = 'Ocultar'
    } else {
        passwordInput.type = 'password'
        buttonTogglePassword.textContent = 'Mostrar'
    }
})