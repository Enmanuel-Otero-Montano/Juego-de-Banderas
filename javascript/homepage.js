const options = document.querySelector(".options")
const optionsContainer = document.querySelector(".options-container")

options.addEventListener("click", ()=>{
    options.classList.toggle("options-active")
    optionsContainer.classList.toggle("options-container-show")
})