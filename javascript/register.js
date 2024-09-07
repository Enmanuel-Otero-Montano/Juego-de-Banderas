const formSubmitRegister = document.getElementById('register-form')


formSubmitRegister.addEventListener('submit', function(event) {
    event.preventDefault()

    const formData = new FormData(event.target)
    const loadingIndicator = document.querySelector('.loading-indicator-register');
    loadingIndicator.classList.add('loading-indicator-register-show');
    console.log(formData.get('profile-image'))
    const jsonData = {
        username: formData.get('username'),
        full_name: formData.get('full-name'),
        email: formData.get('email'),
        password: formData.get('password'),
        profile_picture: formData.get('profile-image'),
        // Añadir más campos si es necesario
    };
    console.log(formData)
    fetch('http://127.0.0.1:8000/register', {
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