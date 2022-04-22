const options = document.querySelector(".options")
const optionsContainer = document.querySelector(".options-container")
const aboutGameButton = document.querySelector(".about-game-button")
const aboutGameModal = document.querySelector(".modal-about-game")
const closeModal = document.querySelector(".close-button")

options.addEventListener("click", ()=>{
    options.classList.toggle("options-active")
    optionsContainer.classList.toggle("options-container-show")
})

aboutGameButton.addEventListener("click", ()=>{
    aboutGameModal.classList.add("modal-about-game-showing")
})

closeModal.addEventListener("click", ()=>{
    aboutGameModal.classList.remove("modal-about-game-showing")
})