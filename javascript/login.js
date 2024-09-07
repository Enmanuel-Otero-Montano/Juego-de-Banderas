const formSubmitLogin = document.getElementById('login-form')

const sendNewVerification = (email)=> {
    console.log(JSON.stringify({email: email}), "JSON.stringify({user})")
    fetch('http://127.0.0.1:8000/resend-verification-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: email
    }).then(response => {
        if (!response.ok) {
            throw new Error('Error al reenviar el correo de verificación');
        }
        return response.json();
    }).then(data => {
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('No se pudo reenviar el correo de verificación.');
    });
}

formSubmitLogin.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetch('http://127.0.0.1:8000/login', {
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
        localStorage.setItem('accessToken', token);
        localStorage.setItem('profile_image_url', profile_image_url);
        localStorage.setItem('name', name);
        localStorage.setItem('user_id', user_id);
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2900);
    }).catch(errorData => {
        // Aquí manejas el error (caso de fallo)
        console.log(errorData)
        error_response = errorData.detail
        
        // Puedes mostrar un mensaje de error en la interfaz
        const errorContainer = document.querySelector('.login-message-response');
        if (errorContainer) {
            if (error_response.message == 'Usuario no verificado') {
                errorContainer.textContent = "Cuenta no verificada. Presiona el botón para enviar un nuevo token de verificación a tu correo. Una vez verificado, podrás iniciar sesión.";
                const buttonRequestVerification = document.querySelector('.btn-request-verification');
                const buttonLoginSubmit = document.querySelector('.login-submit');
                buttonLoginSubmit.classList.add('login-submit-hide')
                buttonRequestVerification.classList.remove('btn-request-verification-hide')
    
                buttonRequestVerification.addEventListener('click', () => {
                    let responseSendNewVerification = sendNewVerification(error_response.email)
                    console.log(responseSendNewVerification, "responseSendNewVerification")
                })
            }else if (error_response.message == 'Usuario o contraseña incorrectos') {
                errorContainer.textContent = error_response.message;
            }
            errorContainer.classList.add("login-message-response-show")
        }
    });
});