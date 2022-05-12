const nextRegion = document.querySelector(".button-next-region")
const buttonNext = document.querySelector(".btn-next")
const buttonCheck = document.querySelector(".btn-check")
const nextRegionModeCareer = document.querySelector(".btn-next-region-mode-career")
const centerFlag = document.querySelector(".flags-center")
const flagsContainer = document.querySelector(".flags-container")
const listOfNames = document.querySelector(".section-names__list")
const dropFlagLeft = document.querySelector(".drop-flag-left")
const dropFlagCenter = document.querySelector(".drop-flag-center")
const dropFlagRight = document.querySelector(".drop-flag-right")
const howToPlayModal = document.querySelector(".modal-how-to-play")
const closeModal = document.querySelector(".close-button")
const buttonMenu = document.querySelector(".menu")
const menuContainer = document.querySelector(".menu-container")
const howToPlay = document.querySelector(".how-to-play")
const currentStageInformation = document.querySelector(".current-stage")
const currentPoints = document.querySelector(".current-points")
const numberOfLives = document.querySelector(".number-of-lives")
const heart = document.querySelector(".heart")
const counter = document.querySelector(".counter")
const dialog = document.querySelector(".dialog")

const leftSideFlag = document.createElement("IMG")
leftSideFlag.setAttribute("class", "flags-left")

const rightSideFlag = document.createElement("IMG")
rightSideFlag.setAttribute("class", "flags-right")

const region = location.href

const allCountries = {
    countries: []
}

const currentRegion = {//Guarda los países de la región que se está jugando
    region: []
}

let flagIndex//Variable para guarda un numero aleatorio entre el 0 y el último índice del array de banderas.

const selectedName = {//Para guardar el nombre seleccionado.
    name: ""
}

const nameOfTheFlags = {//Para guardar el nombre de la bandera.
    "left flag name": "",
    "center flag name": "",
    "right flag name": ""
}

const totalTime = {
    "fourteen names": 115,
    "eighteen names": 140
}

let stopSeconds

function counterDown () {
    if(totalTime["fourteen names"] === 0 || totalTime["eighteen names"] === 0){
        location.reload()
    }
    if(listOfNames.children.length === 14) {
        counter.innerHTML = `${totalTime["fourteen names"]} s`
        totalTime["fourteen names"]--
    }else if(listOfNames.children.length === 18) {
        counter.innerHTML = `${totalTime["eighteen names"]} s`
        totalTime["eighteen names"]--
    }
}

const callCountry = async ()=> {//Función que hace la solicitud a la API de los países de América.
    const result =  fetch("https://restcountries.com/v3.1/all")
    const country = await result
    return country.json()
}

const saveCountriesInArray = async (locationHref)=> {
    allCountries.countries = await callCountry()//Llamada a la función que hace la solicitud.
    if(locationHref.includes("career-mode")){
        southAmerica()
    }else if(locationHref.includes("america")){
        southAmerica()
    }else if(locationHref.includes("europe")){
        southOfEurope()
    }else if(locationHref.includes("africa")){
        easternAfrica()
    }else if(locationHref.includes("oceania")){
        oceaniaFunct()
    }else if(locationHref.includes("asia")){
        westernAsia()
    }
    showNames()
    showCenterFlag()
    //stopSeconds = setInterval(counterDown, 1000)
}

document.addEventListener("DOMContentLoad", saveCountriesInArray(region))

const showNames = ()=> {//Función para mostrar los nombres de los países
    const fragment = document.createDocumentFragment()
    for(const country of currentRegion.region) {
        const names = document.createElement("LI")
        names.textContent = `${country.name.common}`
        names.setAttribute("id", country.name.common)
        names.setAttribute("class", "flag-names")
        fragment.appendChild(names)
    }
    listOfNames.appendChild(fragment)
}

const showLeftFlag = ()=> {//Función para mostrar la bandera de la izquierda
    flagIndex = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    nameOfTheFlags["left flag name"] = currentRegion.region[flagIndex].name.common
    leftSideFlag.setAttribute("src", currentRegion.region[flagIndex].flags.png)
    flagsContainer.prepend(leftSideFlag)
    currentRegion.region.splice(flagIndex, 1)
}

const showRightFlag = ()=> {//Función para mostrar la bandera de la derecha
    flagIndex = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    nameOfTheFlags["right flag name"] = currentRegion.region[flagIndex].name.common
    rightSideFlag.setAttribute("src", currentRegion.region[flagIndex].flags.png)
    flagsContainer.append(rightSideFlag)
    currentRegion.region.splice(flagIndex, 1)
}

const showCenterFlag = ()=> {//Función para mostrar la bandera del centro
    flagIndex = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    nameOfTheFlags["center flag name"] = currentRegion.region[flagIndex].name.common
    centerFlag.setAttribute("src", currentRegion.region[flagIndex].flags.png)
    leftSideFlag.after(centerFlag)
}

listOfNames.addEventListener("click", (e)=> {
    if(!e.target.classList.contains("section-names__list")){
        selectedName.name = e.target.id
        dropFlagCenter.classList.remove("flag-drop-area-failed")
        dropFlagLeft.classList.remove("flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-failed")
        removeNameSelected()
        e.target.classList.add("flag-names-selected")
        console.log(allCountries.countries)
        const location = allCountries.countries.find(element=> element.name.common === selectedName.name)
        console.log(location.maps.googleMaps)
    }
})

const removeNameSelected = ()=> {//Función para remover el color del nombre seleccionado
    for(const name of listOfNames.children){
        name.classList.remove("flag-names-selected")
    }
}

const checkNumberOfCurrentLives = ()=>{
    numberOfLives.textContent = --numberOfLives.textContent
    heart.classList.add("heart-animation")
    setTimeout(() => {
        heart.classList.remove("heart-animation")
    }, 310);
}

const checkNumberOfLives = ()=>{
    if(numberOfLives.textContent === "0"){
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

buttonNext.addEventListener("click", ()=> {
    dropFlagCenter.dataset.points = "10"
    dropFlagLeft.dataset.points = "10"
    dropFlagRight.dataset.points = "10"
    buttonCheck.disabled = false
    console.log(currentRegion.region.length)
    if(flagsContainer.childElementCount == 1) {
        centerFlag.remove()
        centerFlag.setAttribute("src", "")
        dropFlagLeft.classList.remove("flag-drop-area-hidden")
        dropFlagRight.classList.remove("flag-drop-area-hidden")
        flagsContainer.classList.add("flags-container-two-flags")
        currentRegion.region.splice(flagIndex, 1)
        flagsContainer.classList.add("flags-container-two-flags")
        showLeftFlag()
        showRightFlag()
        dropFlagCenter.classList.add("flag-drop-area-hidden")
        dropFlagCenter.textContent = ""
    }else if(location.href === `${location.protocol}//${location.host}/Juego-de-Banderas/pages/south-america/south-america.html` && currentRegion.length == 3){
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
    }else if(location.href === `${location.protocol}//${location.host}/Juego-de-Banderas/pages/central-north-america-caribbean/central-north-america-caribbean.html` && currentRegion.length === 6 || currentRegion.length == 3){
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
    }else if(currentRegion.region.length == 3){
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

centerFlag.addEventListener("click", ()=> {
    flagsContainer.nextElementSibling.children[1].textContent = selectedName.name
    removeNameSelected()
})

flagsContainer.addEventListener("click", (e)=> {
    if(flagsContainer.childElementCount == 2){
        removeNameSelected()
        if(e.target.classList.contains("flags-left")){
            flagsContainer.nextElementSibling.children[0].textContent = selectedName.name
        }else if(e.target.classList.contains("flags-right")){
            flagsContainer.nextElementSibling.children[2].textContent = selectedName.name 
        }
    }else if(flagsContainer.childElementCount == 3){
        removeNameSelected()
        if(e.target.classList.contains("flags-left")){
            flagsContainer.nextElementSibling.children[0].textContent = selectedName.name
        }else if(e.target.classList.contains("flags-right")){
            flagsContainer.nextElementSibling.children[2].textContent = selectedName.name
        }
    }
})

buttonCheck.addEventListener("click", ()=> {
    console.log(nameOfTheFlags["center flag name"], nameOfTheFlags["left flag name"], nameOfTheFlags["right flag name"])
    if(!dropFlagCenter.classList.contains("flag-drop-area-hidden") && dropFlagLeft.classList.contains("flag-drop-area-hidden")){
        if(dropFlagCenter.textContent === nameOfTheFlags["center flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            buttonNext.disabled = false
            buttonNext.style.opacity = "initial"
            buttonCheck.disabled = true
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagCenter.setAttribute("data-points", "5")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }
    }else if(!dropFlagLeft.classList.contains("flag-drop-area-hidden") && !dropFlagRight.classList.contains("flag-drop-area-hidden") && dropFlagCenter.classList.contains("flag-drop-area-hidden")){
        if(dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
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
        }else if(dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            dropFlagRight.setAttribute("data-points", "5")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            dropFlagLeft.setAttribute("data-points", "5")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else{
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }
    }else{
        if(dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            nextRegionModeCareer.disabled = false
            nextRegionModeCareer.style.opacity = "initial"
            if(region.includes("career-mode")) {
                nextRegionModeCareer.style.opacity = "initial"
                nextRegionModeCareer.disabled = false
            }else if(region.includes("america") && stage.currentStage === 2){
                nextRegionModeCareer.disabled = true
                nextRegionModeCareer.style.opacity = ".2"
                dialog.show()
                clearInterval(stopSeconds)//Para el contador si es el final de la región actual
            }else if(region.includes("asia") || region.includes("europe") || region.includes("africa") && stage.currentStage === 3){
                nextRegionModeCareer.disabled = true
                nextRegionModeCareer.style.opacity = ".2"
                dialog.show()
                clearInterval(stopSeconds)//Para el contador si es el final de la región actual
            }else if(region.includes("oceania") && stage.currentStage === 1) {
                nextRegionModeCareer.disabled = true
                nextRegionModeCareer.style.opacity = ".2"
                dialog.show()
                clearInterval(stopSeconds)//Para el contador si es el final de la región actual
            }
            buttonCheck.disabled = true
            buttonCheck.style.opacity = ".2"
        }else if(dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagCenter.setAttribute("data-pointd", "5")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            dropFlagLeft.setAttribute("data-pointd", "5")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            dropFlagRight.setAttribute("data-pointd", "5")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else if(dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else if(dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            rightHeart.classList.add("lost-life")
            leftHeart.classList.add("lost-life")
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }
    }
    calculatePoints(dropFlagLeft, dropFlagCenter, dropFlagRight)
    if(location.href.includes("career-mode")){
        checkNumberOfLives()
    }
})

howToPlay.addEventListener("click", ()=> {
    howToPlayModal.classList.add("modal-how-to-play-showing")
})

closeModal.addEventListener("click", ()=>{
    howToPlayModal.classList.remove("modal-how-to-play-showing")
})

const stage = {
    currentStage: 1
}

if(region.includes("career-mode")) {
    nextRegionModeCareer.addEventListener("click", ()=>{
        numberOfLives.textContent = ++numberOfLives.textContent
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        careerMode(stage.currentStage)
        initialState()
    })
}else if(region.includes("america")) {
    nextRegionModeCareer.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        restOfAmerica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
    })
}else if(region.includes("asia")) {
    nextRegionModeCareer.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        if(stage.currentStage === 1) {
            southernCentralAsia()
        }else if(stage.currentStage === 2) {
            southEasternAsia()
        }
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        totalTime["eighteen names"] = 130//Reinicia el contador
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
    })
}else if(region.includes("europe")) {
    nextRegionModeCareer.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        if(stage.currentStage === 1) {
            easternCentralWesternEuropa()
            totalTime["eighteen names"] = 130//Reinicia el contador
        }else if(stage.currentStage === 2) {
            northernEurope()
        }
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
    })
}else if(region.includes("africa")) {
    nextRegionModeCareer.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        if(stage.currentStage === 1) {
            westernAfrica()
        }else if(stage.currentStage === 2) {
            southernAndNorthernAfrica()
        }
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        totalTime["eighteen names"] = 130//Reinicia el contador
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
    })
}

const careerMode = (stage)=>{
    currentRegion.region.splice(0)
    if(stage === 2){
        southOfEurope()
    }else if(stage === 3){
        westernAfrica()
    }else if(stage === 4){
        southEasternAsia()
    }else if(stage === 5){
        oceaniaFunct()
    }else if(stage === 6){
        restOfAmerica()
    }else if(stage === 7){
        southernCentralAsia()
    }else if(stage === 8){
        northernEurope()
    }else if(stage === 9){
        southernAndNorthernAfrica()
    }else if(stage === 10){
        westernAsia()
    }else if(stage === 11){
        easternAfrica()
    }else if(stage === 12){
        easternCentralWesternEuropa()
    }
    deleteNamesFromList()
    showNames()
    showCenterFlag()
}

const southAmerica = ()=> {
    currentRegion.region = allCountries.countries.filter(element => element.subregion == "South America")
}

const southOfEurope = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Southern Europe" && element.name.common !== "Gibraltar" || element.subregion == "Southeast Europe")
    totalTime["eighteen names"] = 140
}

const westernAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Western Africa" && element.independent == true || element.name.common == "São Tomé and Príncipe" || element.name.common == "Gabon")
    totalTime["eighteen names"] = 140
}

const southEasternAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "South-Eastern Asia" || element.subregion == "Eastern Asia" && element.name.common !== "Macau")
    totalTime["eighteen names"] = 140
}

const oceaniaFunct = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.region == "Oceania" && element.independent == true)
    totalTime["fourteen names"] = 115
}

const restOfAmerica = ()=> {
    currentRegion.region = allCountries.countries.filter(element => element.subregion == "Central America" || element.subregion == "North America"  && element.independent !== false || element.subregion === "Caribbean" && element.name.common == "Cuba" || element.name.common == "Dominican Republic" || element.name.common == "Haiti" || element.name.common == "Bahamas" || element.name.common == "Jamaica" || element.name.common == "Puerto Rico" || element.name.common == "Trinidad and Tobago" || element.name.common == "Dominica")
    totalTime["eighteen names"] = 140
}

const southernCentralAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Central Asia" && element.name.common !== "Turkmenistan" || element.subregion == "Southern Asia" || element.name.common == "Macau")
    totalTime["fourteen names"] = 115
}

const northernEurope = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Northern Europe" && element.name.common !== "Svalbard and Jan Mayen" && element.name.common !== "Åland Islands")
    totalTime["fourteen names"] = 115
}

const southernAndNorthernAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Northern Africa" && element.independent == true || element.subregion == "Southern Africa" || element.subregion == "Middle Africa" && element.name.common !== "Central African Republic" && element.name.common !== "South Sudan" && element.name.common !== "São Tomé and Príncipe" && element.name.common !== "Gabon")
    totalTime["eighteen names"] = 140
}

const westernAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Western Asia" || element.name.common == "Turkmenistan")
    totalTime["eighteen names"] = 140
}

const easternAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Eastern Africa" && element.independent == true || element.name.common == "Central African Republic" || element.name.common == "South Sudan")
    totalTime["eighteen names"] = 140
}

const easternCentralWesternEuropa = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion == "Eastern Europe" || element.subregion == "Central Europe" || element.subregion == "Western Europe")
    totalTime["eighteen names"] = 140
}

const deleteNamesFromList = ()=> {
    while (listOfNames.children.length > 0) {
        listOfNames.removeChild(listOfNames.children[0])
    }
}

const initialState = ()=> {
    flagsContainer.classList.remove("flags-container-two-flags")
    leftSideFlag.remove()
    rightSideFlag.remove()
    dropFlagLeft.classList.add("flag-drop-area-hidden")
    dropFlagRight.classList.add("flag-drop-area-hidden")
    dropFlagCenter.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
    dropFlagLeft.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
    dropFlagRight.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
    dropFlagLeft.textContent = ""
    dropFlagRight.textContent = ""
    dropFlagCenter.textContent = ""
    buttonCheck.disabled = false
    buttonCheck.style.opacity = "initial"
    nextRegionModeCareer.disabled = true
    nextRegionModeCareer.style.opacity = ".2"
}

buttonMenu.addEventListener("click", ()=> {
    menuContainer.classList.toggle("menu-container-show")
})