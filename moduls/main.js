const nextRegion = document.querySelector(".button-next-region")
const buttonNext = document.querySelector(".button-next")
const buttonCheck = document.querySelector(".button-check")
const centerFlag = document.querySelector(".flags-center")
const flagsContainer = document.querySelector(".flags-container")
const listOfNames = document.querySelector(".section-names__list")
const dropFlagLeft = document.querySelector(".drop-flag-left")
const dropFlagCenter = document.querySelector(".drop-flag-center")
const dropFlagRight = document.querySelector(".drop-flag-right")
const howToPlayModal = document.querySelector(".modal-how-to-play")
const closeModal = document.querySelector(".close-button")
const howToPlay = document.querySelector(".how-to-play")
const leftHeart = document.querySelector(".left-heart")
const rightHeart = document.querySelector(".right-heart")
const currentPoints = document.querySelector(".current-points")

console.log(location.href)

let currentRegion//En esta variable será un array con los países de América del Sur.
let flagIndex//Variable para guarda un numero aleatorio entre el 0 y el último índice del array de banderas de América del Sur.

let leftSideFlag
let rightSideFlag

let selectedName

const callCountry = async ()=> {//Función que hace la solicitud a la API de los países de América.
    const result =  fetch("https://restcountries.com/v3.1/region/ame")
    const country = await result
    return country.json()
}

const saveCountriesInArray = async ()=> {
    const america = await callCountry()//Llamada a la función que hace la solicitud.
    if(location.href === `${location.protocol}//${location.host}/Juego-de-Banderas/pages/south-america/south-america.html`){
        currentRegion = america.filter(element => element.subregion == "South America")
    }else if(location.pathname === `${location.protocol}//${location.host}/pages/central-north-america-caribbean/central-north-america-caribbean.html`){
        const caribbean = america.filter(element => element.name.common == "Cuba" || element.name.common == "Dominican Republic" || element.name.common == "Haiti" || element.name.common == "Bahamas" || element.name.common == "Jamaica" || element.name.common == "Puerto Rico" || element.name.common == "Trinidad and Tobago")
        const centralAndNorthAmerica = america.filter(element => element.subregion == "Central America" || element.subregion == "North America"  && element.name.common !== "Saint Pierre and Miquelon" && element.name.common !== "United States Minor Outlying Islands")
        currentRegion = caribbean.concat(centralAndNorthAmerica)
    }
    showTheFirstFlags()
    showNames()
    console.log(currentRegion)
}

document.addEventListener("DOMContentLoad", saveCountriesInArray())

const showTheFirstFlags = ()=> {//Función para la primera banderas.
    flagIndex = Math.trunc(Math.random() * (currentRegion.length - 0) + 0)
    centerFlag.setAttribute("id", currentRegion[flagIndex].name.common)
    centerFlag.setAttribute("src", currentRegion[flagIndex].flags.png)
}

const showNames = ()=> {//Función para mostrar los nombres de los países
    const fragment = document.createDocumentFragment()
    for(const country of currentRegion) {
        const names = document.createElement("LI")
        names.innerHTML = `${country.name.common}`
        names.setAttribute("id", country.name.common)
        names.setAttribute("class", "flag-names")
        fragment.appendChild(names)
    }
    listOfNames.appendChild(fragment)
}

const showLeftFlag = ()=> {//Función para mostrar la bandera de la izquierda
    flagIndex = Math.trunc(Math.random() * (currentRegion.length - 0) + 0)
    leftSideFlag = document.createElement("IMG")
    leftSideFlag.setAttribute("class", "flags-left")
    leftSideFlag.setAttribute("id", currentRegion[flagIndex].name.common)
    leftSideFlag.setAttribute("src", currentRegion[flagIndex].flags.png)
    flagsContainer.prepend(leftSideFlag)
    currentRegion.splice(flagIndex, 1)
}

const showRightFlag = ()=> {//Función para mostrar la bandera de la derecha
    flagIndex = Math.trunc(Math.random() * (currentRegion.length - 0) + 0)
    rightSideFlag = document.createElement("IMG")
    rightSideFlag.setAttribute("class", "flags-right")
    rightSideFlag.setAttribute("id", currentRegion[flagIndex].name.common)
    rightSideFlag.setAttribute("src", currentRegion[flagIndex].flags.png)
    flagsContainer.append(rightSideFlag)
    currentRegion.splice(flagIndex, 1)
}

const showCenterFlag = ()=> {//Función para mostrar la bandera del centro
    flagIndex = Math.trunc(Math.random() * (currentRegion.length - 0) + 0)
    centerFlag.setAttribute("id", currentRegion[flagIndex].name.common)
    centerFlag.setAttribute("src", currentRegion[flagIndex].flags.png)
    leftSideFlag.after(centerFlag)
    currentRegion.splice(flagIndex, 1)
}

const removeNameSelected = ()=> {//Función para remover el color del nombre seleccionado
    for(const name of listOfNames.children){
        name.classList.remove("flag-names-selected")
    }
}

const checkNumberOfCurrentLives = ()=>{
    if(!rightHeart.classList.contains("lost-life")){
        rightHeart.classList.add("lost-life")
    }else{
        leftHeart.classList.add("lost-life")
    }
}

const checkNumberOfLives = ()=>{
    if(leftHeart.classList.contains("lost-life") && rightHeart.classList.contains("lost-life")){
        setTimeout(() => {
            location.reload()
        }, 800);
    }
}

const calculatePoints = (containerLeft, containerCenter, containerRight)=>{
    if(containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-hidden")){
        currentPoints.textContent = containerCenter.dataset.points
    }else if(containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success") && containerCenter.classList.contains("flag-drop-area-hidden")){
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points) 
    }else if(containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success")){
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(dropFlagCenter.dataset.points) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points)
    }
}

nextRegion.addEventListener("click", ()=>{
    location.href = `${location.protocol}//${location.host}/pages/central-north-america-caribbean/central-north-america-caribbean.html`
})

buttonNext.addEventListener("click", ()=> {
    dropFlagCenter.dataset.points = "10"
    dropFlagLeft.dataset.points = "10"
    dropFlagRight.dataset.points = "10"
    buttonCheck.disabled = false
    if(flagsContainer.childElementCount == 1) {
        centerFlag.remove()
        dropFlagCenter.textContent = ""
        dropFlagCenter.classList.add("flag-drop-area-hidden")
        dropFlagLeft.classList.remove("flag-drop-area-hidden")
        dropFlagRight.classList.remove("flag-drop-area-hidden")
        currentRegion.splice(flagIndex, 1)
        flagsContainer.style.justifyContent = "space-between"
        showLeftFlag()
        showRightFlag()
    }else if(location.pathname === "/pages/south-america/south-america.html" && currentRegion.length == 3){
        leftSideFlag.remove()
        rightSideFlag.remove()
        dropFlagCenter.classList.remove("flag-drop-area-hidden", "flag-drop-area-success", "flag-drop-area-failed")
        dropFlagLeft.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        showLeftFlag()
        showRightFlag()
        showCenterFlag()
        buttonNext.disabled = true
    }else if(location.pathname === "/pages/central-north-america-caribbean/central-north-america-caribbean.html" && currentRegion.length === 6 || currentRegion.length == 3){
        leftSideFlag.remove()
        rightSideFlag.remove()
        dropFlagCenter.classList.remove("flag-drop-area-hidden", "flag-drop-area-success", "flag-drop-area-failed")
        dropFlagLeft.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        dropFlagCenter.textContent = ""
        showLeftFlag()
        showRightFlag()
        showCenterFlag()
        buttonNext.disabled = true
    }else{
        leftSideFlag.remove()
        rightSideFlag.remove()
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        dropFlagLeft.classList.remove("flag-drop-area-success")
        dropFlagRight.classList.remove("flag-drop-area-success")
        showLeftFlag()
        showRightFlag()
    }
    buttonNext.disabled = true
    buttonNext.style.opacity = ".2"
})

listOfNames.addEventListener("click", (e)=> {
    if(!e.target.classList.contains("section-names__list")){
        selectedName = e.target.id
        removeNameSelected()
        e.target.classList.add("flag-names-selected")
    }
})

centerFlag.addEventListener("click", ()=>{
    flagsContainer.nextElementSibling.children[1].textContent = selectedName
    removeNameSelected()
})

flagsContainer.addEventListener("click", (e)=>{
    if(flagsContainer.childElementCount == 2){
        removeNameSelected()
        if(e.target.classList.contains("flags-left")){
            flagsContainer.nextElementSibling.children[0].textContent = selectedName
        }else if(e.target.classList.contains("flags-right")){
            flagsContainer.nextElementSibling.children[2].textContent = selectedName
        }
    }else if(flagsContainer.childElementCount == 3){
        removeNameSelected()
        if(e.target.classList.contains("flags-left")){
            flagsContainer.nextElementSibling.children[0].textContent = selectedName
        }else if(e.target.classList.contains("flags-right")){
            flagsContainer.nextElementSibling.children[2].textContent = selectedName
        }
    }
})

buttonCheck.addEventListener("click", ()=> {
    if(!dropFlagCenter.classList.contains("flag-drop-area-hidden") && dropFlagLeft.classList.contains("flag-drop-area-hidden")){
        if(dropFlagCenter.textContent == centerFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            buttonNext.disabled = false
            buttonNext.style.opacity = "initial"
            buttonCheck.disabled = true
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagCenter.setAttribute("data-points", "5")
            checkNumberOfCurrentLives()
        }
    }else if(!dropFlagLeft.classList.contains("flag-drop-area-hidden") && !dropFlagRight.classList.contains("flag-drop-area-hidden") && dropFlagCenter.classList.contains("flag-drop-area-hidden")){
        if(dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            if(dropFlagLeft.classList.contains("flag-drop-area-failed")){
                dropFlagLeft.classList.remove("flag-drop-area-failed")
            }
            if(dropFlagRight.classList.contains("flag-drop-area-failed")){
                dropFlagRight.classList.remove("flag-drop-area-failed")
            }
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            buttonNext.disabled = false
            buttonNext.style.opacity = "initial"
            buttonCheck.disabled = true
        }else if(dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            dropFlagRight.setAttribute("data-points", "5")
            checkNumberOfCurrentLives()
        }else if(dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            dropFlagLeft.setAttribute("data-points", "5")
            checkNumberOfCurrentLives()
        }else{
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }
    }else{
        if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            if(currentRegion.length === 0){
                nextRegion.disabled = false
                nextRegion.style.opacity = "initial"
                buttonCheck.disabled = true
            }else{
                buttonNext.disabled = false
                buttonNext.style.opacity = "initial"
            }
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagCenter.setAttribute("data-pointd", "5")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            checkNumberOfCurrentLives()
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            dropFlagLeft.setAttribute("data-pointd", "5")
            checkNumberOfCurrentLives()
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            dropFlagRight.setAttribute("data-pointd", "5")
            checkNumberOfCurrentLives
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }
    }
    calculatePoints(dropFlagLeft, dropFlagCenter, dropFlagRight)
    checkNumberOfLives()
})

howToPlay.addEventListener("click", ()=> {
    howToPlayModal.classList.add("modal-how-to-play-showing")
})

closeModal.addEventListener("click", ()=>{
    howToPlayModal.classList.remove("modal-how-to-play-showing")
})