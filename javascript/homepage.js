const buttonRegionsMode = document.querySelector(".btn-regions-mode")
const regionsList = document.querySelector(".region-list")
const aboutGameButton = document.querySelector(".about-game-button")
const aboutGameModal = document.querySelector(".modal-about-game")
const closeModal = document.querySelector(".close-button")

aboutGameButton.addEventListener("click", ()=>{
    aboutGameModal.classList.add("modal-about-game-showing")
})

closeModal.addEventListener("click", ()=>{
    aboutGameModal.classList.remove("modal-about-game-showing")
})

buttonRegionsMode.addEventListener("click", ()=> {
    regionsList.classList.toggle("region-list-show")
})