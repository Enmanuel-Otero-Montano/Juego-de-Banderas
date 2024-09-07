const buttonRegionsMode = document.querySelector(".btn-regions-mode")
const regionsList = document.querySelector(".region-list")
const aboutGameButton = document.querySelector(".about-game-button")
const loginGameButton = document.querySelector(".login-game-button")
const aboutGameModal = document.querySelector(".modal-about-game")
const loginGameModal = document.querySelector(".modal-login")
const closeModal = document.querySelector(".close-button")
const profileButton = document.querySelector('.profile-button')

const isUserlogged = ()=> {
    if (localStorage.getItem('accessToken') !== null) {
        profileButton.classList.add('profile-button-show')
        fetch(`http://127.0.0.1:8000/user/${localStorage.getItem('user_id')}/profile_image`, {
        }).then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la imagen del perfil');
            }
            return response.blob()
        }).then(blob => {
            console.log(blob)
            const url = URL.createObjectURL(blob);
            const newElement = document.createElement('img');
            newElement.src = url;
            newElement.classList.add('profile-img');
            profileButton.appendChild(newElement);
        }).catch(error => {
            console.error('Error al obtener la imagen del perfil:', error);
            const name = localStorage.getItem('name');
            const nameParts = name.split(' ');
            if (nameParts.length > 1) {
                profileButton.textContent = nameParts[0][0] + nameParts[1][0];
            } else {
                profileButton.textContent = name[0];
            }
        })
    }else {
        loginGameButton.classList.add('login-game-button-show')
    }
}

document.addEventListener('DOMContentLoaded', isUserlogged())

aboutGameButton.addEventListener("click", ()=>{
    aboutGameModal.classList.add("modal-about-game-showing")
})

closeModal.addEventListener("click", ()=>{
    aboutGameModal.classList.remove("modal-about-game-showing")
})

buttonRegionsMode.addEventListener("click", ()=> {
    regionsList.classList.toggle("region-list-show")
})