const buttonNextFlags = document.querySelector(".btn-next")
const buttonCheck = document.querySelector(".btn-check")
const buttonNextRegion = document.querySelector(".btn-next-region-mode-career")
const buttonRestart = document.querySelector(".btn-restart")
const buttonPista = document.querySelector(".btn-track")
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
const loading = document.querySelector(".loading")
const loadingError = document.querySelector(".error-loading")
const currentStageInformation = document.querySelector(".current-stage")
const currentPoints = document.querySelector(".current-points")
const remainingTracks = document.querySelector(".remaining-tracks")
const numberOfLives = document.querySelector(".number-of-lives")
const heart = document.querySelector(".heart")
const counter = document.querySelector(".counter")
const dialog = document.querySelector(".dialog")
const regionOrStage = document.querySelector(".region-stage")
const dialogFailed = document.querySelector(".dialog-failed")
const textFaildeReason = document.querySelector(".failed-text-reason")
const informationContainer = document.querySelector(".information-container")
const locationPopulationContainer = document.querySelector(".location-population-capital-container")
const countryLocation = document.querySelector(".location")
const capitalInformationContainer = document.querySelector(".capital-information-container")
const buttonCapital = document.querySelector(".btn-capital")
const capitalCountryName = document.querySelector(".capital-country-name")
const countryCapital = document.querySelector(".capital-name")
const populationInformationContainer = document.querySelector(".population-information-container")
const buttonPopulation = document.querySelector(".btn-population")
const populationCountryName = document.querySelector(".population-country-name")
const countryPopulation = document.querySelector(".country-population")
const regionName = document.querySelector(".region-name")
const scoreGlobalList = document.getElementById("score-global-list")
const scoreGlobalContainer = document.querySelector(".score-global-container")

import {  saveScore, getGlobalTop, getUserTop, getCountryTop, getScoresSummary } from "../javascript/score.js"
import { BASE_API_URL } from "../moduls/api.js";


loadingError.hidden = true

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

const flagIndex = {//Guarda un numero aleatorio entre el 0 y el último índice del array de banderas.
    index: undefined
}

const selectedName = {//Para guardar el nombre seleccionado.
    name: ""
}

const nameOfTheFlags = {//Para guardar el nombre de la bandera.
    "left flag name": undefined,
    "center flag name": undefined,
    "right flag name": undefined
}

const totalTime = {
    "fourteen names": 115,
    "eighteen names": 140
}

const stop = {
    counter: undefined
}

const REST_URL = 'https://restcountries.com/v3.1/all?fields=name,flags,subregion,region,independent,maps,capital,population';

const callCountry = async () => {
  try {
    const resp = await fetch(REST_URL, { cache: 'no-store' });
    if (!resp.ok) {
      // Log útil para ver exactamente qué devolvió el server
      const text = await resp.text().catch(()=>'');
      throw new Error(`REST Countries ${resp.status} ${resp.statusText} - ${text}`);
    }
    return resp.json();
  } catch (error) {
    loading.classList.add("loading-hidden");
    loadingError.textContent = "¡Ups! No pudimos cargar los países. Reintenta en unos segundos.";
    loadingError.hidden = false;
    console.error('Error cargando países:', error);
    throw error; // para que no siga el flujo como si hubiera datos
  }
};

const saveCountriesInArray = async (locationHref)=> {
    try {
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
        loaded()
    } catch (error) {
        if(error instanceof TypeError) {
            loading.classList.add("loading-hidden")
            loadingError.hidden = false
        }
    }
}

document.addEventListener("DOMContentLoaded", () => saveCountriesInArray(region));

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
    const mql = matchMedia("(min-width: 565px)")// Muestra la lista de nombre en tres columnas si contiene 18 nombres y el ancho de la pantalla es => a 1024px 
    if(listOfNames.childElementCount === 18 && mql.matches) {
        listOfNames.classList.add("section-names__list-eighteen")
    }else {
        listOfNames.classList.remove("section-names__list-eighteen")
    }
}

const showLeftFlag = ()=> {//Función para mostrar la bandera de la izquierda
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    leftSideFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    flagsContainer.prepend(leftSideFlag)
    nameOfTheFlags["left flag name"] = currentRegion.region[flagIndex.index].name.common
    currentRegion.region.splice(flagIndex.index, 1)
}

const showRightFlag = ()=> {//Función para mostrar la bandera de la derecha
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    rightSideFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    flagsContainer.append(rightSideFlag)
    nameOfTheFlags["right flag name"] = currentRegion.region[flagIndex.index].name.common
    currentRegion.region.splice(flagIndex.index, 1)
}

const showCenterFlag = ()=> {//Función para mostrar la bandera del centro
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    centerFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    leftSideFlag.after(centerFlag)
    nameOfTheFlags["center flag name"] = currentRegion.region[flagIndex.index].name.common
}

listOfNames.addEventListener("click", (e)=> {
    if(!e.target.classList.contains("section-names__list")){
        selectedName.name = e.target.id
        dropFlagCenter.classList.remove("flag-drop-area-failed")
        dropFlagLeft.classList.remove("flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-failed")
        if(currentRegion.region.length === 0 && dropFlagCenter.textContent === nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"] && dropFlagCenter.classList.contains("flag-drop-area-success") && dropFlagLeft.classList.contains("flag-drop-area-success") && dropFlagRight.classList.contains("flag-drop-area-success")) {
            const countryByName = allCountries.countries.find(element=> element.name.common === selectedName.name)
            countryLocation.setAttribute("href", `${countryByName.maps.googleMaps}`)
            informationContainer.classList.remove("information-container-show")
            populationInformationContainer.classList.remove("population-information-container-show")
            locationPopulationContainer.classList.add("location-population-capital-container-show")
            capitalInformationContainer.classList.remove("capital-information-container-show")
            countryPopulation.textContent = countryByName.population
            populationCountryName.textContent = selectedName.name
            capitalCountryName.textContent = selectedName.name
            capitalCountryName.classList.add("flag-names-selected")
            countryCapital.textContent = countryByName.capital
        }
        removeNameSelected()
        e.target.classList.add("flag-names-selected")
        if(menuContainer.classList.contains("menu-container-show")) {
            menuContainer.classList.remove("menu-container-show")
        }
    }
})

const removeNameSelected = ()=> {//Función para remover el color del nombre seleccionado
    for(const name of listOfNames.children){
        name.classList.remove("flag-names-selected")
    }
}

const checkNumberOfCurrentLives = () => {
    let lives = parseInt(numberOfLives.textContent, 10);

    // Si ya no hay vidas, no hago nada
    if (lives <= 0) {
        return;
    }

    lives -= 1;
    numberOfLives.textContent = lives;

    if (lives === 1) {
        heart.classList.add("one-heart");
    } else {
        heart.classList.add("heart-animation");
        setTimeout(() => {
            heart.classList.remove("heart-animation");
        }, 280);
    }
};


const checkNumberOfLives = () => {
    let lives = parseInt(numberOfLives.textContent, 10);

    if (lives <= 0) {
        // Forzamos a 0 para que no queden números negativos
        numberOfLives.textContent = "0";

        clearInterval(stop.counter);
        heart.classList.remove("one-heart");
        totalTime["fourteen names"] = 115;
        totalTime["eighteen names"] = 140;
        stage.currentStage = 1;
        currentStageInformation.textContent = stage.currentStage;
        textFaildeReason.textContent = "corazones";
        dialogFailed.show();
        buttonCheck.disabled = true;
        buttonCheck.style.opacity = ".2";
        return 'Game over';
    } else {
        buttonCheck.disabled = false;
        buttonCheck.style.opacity = "initial";
        return 'Game on';
    }
};


const calculatePoints = (containerLeft, containerCenter, containerRight)=>{
    if(containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-hidden")){
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(containerCenter.dataset.points)
    }else if(containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success") && containerCenter.classList.contains("flag-drop-area-hidden")){
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points) 
    }else if(containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success")){
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(dropFlagCenter.dataset.points) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points)
    }
}

centerFlag.addEventListener("click", ()=> {
    flagsContainer.nextElementSibling.children[1].textContent = selectedName.name
    removeNameSelected()
})

leftSideFlag.addEventListener("click", ()=> {
    flagsContainer.nextElementSibling.children[0].textContent = selectedName.name
    removeNameSelected()
})

rightSideFlag.addEventListener("click", ()=> {
    flagsContainer.nextElementSibling.children[2].textContent = selectedName.name
    removeNameSelected()
})

buttonCheck.addEventListener("click", ()=> {
    const lives = parseInt(numberOfLives.textContent, 10);
    if(lives <= 0) {
        return;
    }
    if(!dropFlagCenter.classList.contains("flag-drop-area-hidden") && dropFlagLeft.classList.contains("flag-drop-area-hidden")){
        if(dropFlagCenter.textContent === nameOfTheFlags["center flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            buttonNextFlags.disabled = false
            buttonNextFlags.style.opacity = "initial"
            buttonCheck.disabled = true
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagCenter.setAttribute("data-points", "5")
            if(region.includes("career-mode")){
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
            buttonNextFlags.disabled = false
            buttonNextFlags.style.opacity = "initial"
            buttonCheck.disabled = true
        }else if(dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            dropFlagRight.setAttribute("data-points", "5")
            if(region.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            dropFlagLeft.setAttribute("data-points", "5")
            if(region.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else{
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            if(region.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }
    }else{
        if(dropFlagCenter.textContent === nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            informationContainer.classList.add("information-container-show")
            clearInterval(stop.counter)//Para el contador si es el final de la región actual
            if(region.includes("career-mode")) {
                if(currentStageInformation.textContent !== "12") {
                    regionOrStage.textContent = "esta etapa!"
                    dialog.show()
                }else{
                    regionOrStage.textContent = "todas las etapas!"
                    dialog.show()
                }
            }else if(region.includes("america")){
                if(stage.currentStage < 2){
                    regionOrStage.textContent = "esta etapa!"
                }else{
                    regionOrStage.textContent = `la región de ${regionName.textContent}!`
                    buttonNextRegion.style.display = "none"
                }
                dialog.show()
            }else if(region.includes("asia") || region.includes("europe") || region.includes("africa")){
                if(stage.currentStage < 3){
                    regionOrStage.textContent = "esta etapa!"
                }else{
                    regionOrStage.textContent = `la región de ${regionName.textContent}!`
                    buttonNextRegion.style.display = "none"
                }
                dialog.show()
                clearInterval(stop.counter)//Para el contador si es el final de la región actual
            }else if(region.includes("oceania") && stage.currentStage === 1) {
                regionOrStage.textContent = `la región de ${regionName.textContent}!`
                dialog.show()
                clearInterval(stop.counter)//Para el contador si es el final de la región actual
            }
            buttonCheck.disabled = true
            buttonCheck.style.opacity = ".2"
            centerFlag.setAttribute("src", "")
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
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else if(dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            if(location.href.includes("career-mode")){
                checkNumberOfCurrentLives()
            }
        }
    }
    calculatePoints(dropFlagLeft, dropFlagCenter, dropFlagRight)
    if(region.includes("career-mode")){
        let state = checkNumberOfLives()
        if (state === 'Game over') {
            saveScore(Number.parseInt(currentPoints.textContent, 10) || 0)
            getGlobalTop(10).then(data => {
                displayScores(data, 'global')
                console.log(data)
            })
        }
    }
})

buttonNextFlags.addEventListener("click", ()=> {
    nameOfTheFlags["center flag name"] = undefined
    nameOfTheFlags["left flag name"] = undefined
    nameOfTheFlags["right flag name"] = undefined
    dropFlagCenter.dataset.points = "10"
    dropFlagLeft.dataset.points = "10"
    dropFlagRight.dataset.points = "10"
    buttonCheck.disabled = false
    if(remainingTracks.textContent === "0" || currentRegion.region.length === 3) {
        buttonPista.disabled = true
        buttonPista.classList.add("btn-track-disabled")
    }else {
        buttonPista.disabled = false
        buttonPista.classList.remove("btn-track-disabled")
    }
    if(flagsContainer.childElementCount === 1) {
        centerFlag.remove()
        currentRegion.region.splice(flagIndex.index, 1)
        flagsContainer.classList.add("flags-container-two-flags")
        showLeftFlag()
        showRightFlag()
        dropFlagLeft.classList.remove("flag-drop-area-hidden")
        dropFlagRight.classList.remove("flag-drop-area-hidden")
        dropFlagCenter.classList.add("flag-drop-area-hidden")
        dropFlagCenter.textContent = ""
        centerFlag.setAttribute("src", "")
    }else if(currentRegion.region.length === 3){
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
        currentRegion.region.splice(0)
        buttonNextFlags.disabled = true
    }else{
        leftSideFlag.remove()
        rightSideFlag.remove()
        dropFlagLeft.classList.remove("flag-drop-area-success")
        dropFlagRight.classList.remove("flag-drop-area-success")
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        showLeftFlag()
        showRightFlag()
    }
    buttonNextFlags.disabled = true
    buttonNextFlags.style.opacity = ".2"
})

howToPlay.addEventListener("click", ()=> {
    howToPlayModal.classList.remove("modal-how-to-play-hidden")
    clearInterval(stop.counter)
})

closeModal.addEventListener("click", ()=>{
    howToPlayModal.classList.add("modal-how-to-play-hidden")
    stop.counter = setInterval(counterDown, 1000)
})

const stage = {
    currentStage: 1
}

if(region.includes("career-mode")) {
    buttonNextRegion.addEventListener("click", ()=>{
        numberOfLives.textContent = ++numberOfLives.textContent
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        totalTime["fourteen names"] = 115// Reinicia el contador.
        totalTime["eighteen names"] = 140// Reinicia el contador.
        heart.classList.remove("one-heart")
        careerMode(stage.currentStage)
        initialState()
        scoreGlobalContainer.classList.add("score-global-container-hidden")
    })
}else if(region.includes("america")) {
    buttonNextRegion.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        restOfAmerica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        scoreGlobalContainer.classList.add("score-global-container-hidden")
    })
}else if(region.includes("asia")) {
    buttonNextRegion.addEventListener("click", ()=>{
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
        totalTime["eighteen names"] = 125//Reinicia el contador
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        scoreGlobalContainer.classList.add("score-global-container-hidden")
    })
}else if(region.includes("europe")) {
    buttonNextRegion.addEventListener("click", ()=>{
        currentRegion.region.splice(0)
        if(stage.currentStage === 1) {
            easternCentralWesternEuropa()
            totalTime["eighteen names"] = 125//Reinicia el contador
        }else if(stage.currentStage === 2) {
            northernEurope()
        }
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        initialState()
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        scoreGlobalContainer.classList.add("score-global-container-hidden")
    })
}else if(region.includes("africa")) {
    buttonNextRegion.addEventListener("click", ()=>{
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
        totalTime["eighteen names"] = 140//Reinicia el contador
        stage.currentStage = ++stage.currentStage
        currentStageInformation.textContent = stage.currentStage
        scoreGlobalContainer.classList.add("score-global-container-hidden")
    })
}

const careerMode = (stage)=>{
    currentRegion.region.splice(0)
    if(stage === 1){
        southAmerica()
    }else if(stage === 2){
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
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "South America")
}

const southOfEurope = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Southern Europe" && element.name.common !== "Gibraltar" || element.subregion == "Southeast Europe")
}

const westernAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Western Africa" && element.independent == true || element.name.common == "São Tomé and Príncipe" || element.name.common == "Gabon")
}

const southEasternAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "South-Eastern Asia" || element.subregion == "Eastern Asia" && element.name.common !== "Macau")
}

const oceaniaFunct = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.region === "Oceania" && element.independent == true)
}

const restOfAmerica = ()=> {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Central America" || element.subregion == "North America"  && element.independent !== false || element.subregion === "Caribbean" && element.name.common == "Cuba" || element.name.common == "Dominican Republic" || element.name.common == "Haiti" || element.name.common == "Bahamas" || element.name.common == "Jamaica" || element.name.common == "Puerto Rico" || element.name.common == "Trinidad and Tobago" || element.name.common == "Dominica")
}

const southernCentralAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Central Asia" && element.name.common !== "Turkmenistan" || element.subregion == "Southern Asia" || element.name.common == "Macau")
}

const northernEurope = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Northern Europe" && element.name.common !== "Svalbard and Jan Mayen" && element.name.common !== "Åland Islands")
}

const southernAndNorthernAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Northern Africa" && element.independent == true || element.subregion == "Southern Africa" || element.subregion == "Middle Africa" && element.name.common !== "Central African Republic" && element.name.common !== "South Sudan" && element.name.common !== "São Tomé and Príncipe" && element.name.common !== "Gabon")
}

const westernAsia = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Western Asia" || element.name.common == "Turkmenistan")
}

const easternAfrica = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Eastern Africa" && element.independent == true || element.name.common == "Central African Republic" || element.name.common == "South Sudan")
}

const easternCentralWesternEuropa = ()=> {
    currentRegion.region = allCountries.countries.filter(element=> element.subregion === "Eastern Europe" || element.subregion == "Central Europe" || element.subregion == "Western Europe")
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
    leftSideFlag.setAttribute("src", "")
    rightSideFlag.setAttribute("src", "")
    dropFlagLeft.classList.add("flag-drop-area-hidden")
    dropFlagRight.classList.add("flag-drop-area-hidden")
    dropFlagCenter.classList.remove("flag-drop-area-success", "flag-drop-area-failed", "flag-drop-area-hidden")
    dropFlagLeft.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
    dropFlagRight.classList.remove("flag-drop-area-success", "flag-drop-area-failed")
    dropFlagLeft.textContent = ""
    dropFlagRight.textContent = ""
    dropFlagCenter.textContent = ""
    informationContainer.classList.remove("information-container-show")
    locationPopulationContainer.classList.remove("location-population-capital-container-show")
    populationInformationContainer.classList.remove("population-information-container-show")
    capitalInformationContainer.classList.remove("capital-information-container-show")
    buttonPista.disabled = false
    buttonPista.classList.remove("btn-track-disabled")
    buttonCheck.disabled = false
    buttonCheck.style.opacity = "initial"
    buttonNextFlags.disabled = true
    buttonNextFlags.style.opacity = "0.2"
    counter.classList.remove("counter-red")
    dialog.close()
    remainingTracks.textContent = "2"
    stop.counter = setInterval(counterDown, 1000)
}

function counterDown () {
    const timeIsOver = totalTime["fourteen names"] === 0 || totalTime["eighteen names"] === 0;

    if (timeIsOver) {
        clearInterval(stop.counter);

        // Guardar score también cuando pierde por tiempo
        if (region.includes("career-mode")) {
            const score = Number.parseInt(currentPoints.textContent, 10) || 0;
            saveScore(score)
                .then(() => getGlobalTop(10))
                .then(data => {
                    displayScores(data, 'global');
                    console.log('Score guardado por tiempo agotado:', score, data);
                })
                .catch(err => {
                    console.error('Error guardando score por tiempo agotado:', err);
                });
        }

        // Restablecer estado
        totalTime["fourteen names"] = 115;
        totalTime["eighteen names"] = 140;
        stage.currentStage = 1;
        currentStageInformation.textContent = stage.currentStage;
        textFaildeReason.textContent = "tiempo";
        dialogFailed.show();
        if (heart.classList.contains("one-heart")) {
            heart.classList.remove("one-heart");
        }
        return;
    }

    if (listOfNames.children.length === 14) {
        counter.textContent = `${totalTime["fourteen names"]} s`;
        totalTime["fourteen names"]--;
    } else if (listOfNames.children.length === 18) {
        counter.textContent = `${totalTime["eighteen names"]} s`;
        totalTime["eighteen names"]--;
    }

    if (totalTime["fourteen names"] <= 24 || totalTime["eighteen names"] <= 24) {
        counter.classList.add("counter-red");
    }
}


const trueTrack = (flag)=> {//Recorre la lista de nombres para poner la clase al nombre que corresponda con la bandera que se muestra.
    Array.from(listOfNames.children).forEach((element)=> {
        if(element.textContent === flag) {
            element.classList.add("track")
            setTimeout(()=> {
                element.classList.remove("track")
            },2400)
        }
    })
}

buttonMenu.addEventListener("click", ()=> {
    menuContainer.classList.toggle("menu-container-show")
})

buttonPopulation.addEventListener("click", ()=> {
    locationPopulationContainer.classList.remove("location-population-capital-container-show")
    populationInformationContainer.classList.add("population-information-container-show")
})

buttonCapital.addEventListener("click", ()=> {
    locationPopulationContainer.classList.remove("location-population-capital-container-show")
    capitalInformationContainer.classList.add("capital-information-container-show")
})

buttonRestart.addEventListener("click", ()=> {
    nameOfTheFlags["center flag name"] = undefined
    nameOfTheFlags["left flag name"] = undefined
    nameOfTheFlags["right flag name"] = undefined
    if(region.includes("oceania")) {
        oceaniaFunct()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    }else if(region.includes("europe")) {
        southOfEurope()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    }else if(region.includes("asia")) {
        westernAsia()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    }else if(region.includes("africa")) {
        easternAfrica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    }else if(region.includes("america")) {
        southAmerica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    }else {
        careerMode(stage.currentStage)
        currentPoints.textContent = "00"
        numberOfLives.textContent = "15"
    }
    initialState()
    dialogFailed.close()
    scoreGlobalContainer.classList.add("score-global-container-hidden")
})

buttonPista.addEventListener("click", ()=> {
    if(remainingTracks.textContent === "2" || remainingTracks.textContent === "1") {
        remainingTracks.textContent = parseInt(remainingTracks.textContent - 1)
    }
    if(flagsContainer.childElementCount === 1) {
        let falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
        trueTrack(nameOfTheFlags["center flag name"])
        if(falseTrack === currentRegion.region.findIndex(element=> element.name.common === nameOfTheFlags["center flag name"])) {
            do{
                falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
                if(falseTrack !== currentRegion.region.findIndex(element=> element.name.common === nameOfTheFlags["center flag name"])) {
                    listOfNames.children[falseTrack].classList.add("track")
                    setTimeout(()=> {
                        listOfNames.children[falseTrack].classList.remove("track")
                    },2400)
                }
            }while(falseTrack === currentRegion.region.findIndex(element=> element.name.common === nameOfTheFlags["center flag name"]))
        }else{
            listOfNames.children[falseTrack].classList.add("track")
            setTimeout(()=> {
                listOfNames.children[falseTrack].classList.remove("track")
            },2400)
        }
    }else if(flagsContainer.childElementCount === 2) {
        let falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
        trueTrack(nameOfTheFlags["left flag name"])
        trueTrack(nameOfTheFlags["right flag name"])
        if(listOfNames.children[falseTrack].textContent === nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"]) {
            do{
                falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
                if(listOfNames.children[falseTrack].textContent !== nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"]) {
                    listOfNames.children[falseTrack].classList.add("track")
                    setTimeout(()=> {
                        listOfNames.children[falseTrack].classList.remove("track")
                    },2400)
                }
            }while(listOfNames.children[falseTrack].textContent === nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"])
        }else{
            listOfNames.children[falseTrack].classList.add("track")
            setTimeout(()=> {
                listOfNames.children[falseTrack].classList.remove("track")
            },2400)
        }
    }
    buttonPista.disabled = true
    buttonPista.classList.add("btn-track-disabled")
})

const loaded = ()=> {
    closeModal.classList.remove("close-button-hidden")
    loading.classList.add("loading-hidden")
}

/* Eventos de escucha de windows */

oncontextmenu = function() {
    return false
}

addEventListener("online", ()=> {
        saveCountriesInArray(region)/* Llama a la función en caso de que se haya ejecutado el "catch" en la primera llamada */
        loadingError.hidden = true
        loading.classList.remove("loading-hidden")
})

/**
 * Función para mostrar los registros de puntuaciones
 * @param {Array} scores - Array de puntuaciones obtenidas de la API
 * @param {string} type - Tipo de ranking ('global', 'user', 'country', 'region')
 */
const displayScores = (scores, type) => {
    // Siempre limpiamos antes de volver a pintar
    clearScores();

    // Verificar que hay datos para mostrar
    if (!scores || scores.length === 0) {
        console.warn('No hay puntuaciones para mostrar');
        // Si querés, podrías ocultar el contenedor acá:
        // scoreGlobalContainer.classList.add("score-global-container-hidden");
        return;
    }

    const defaultImg = "../assets/images/toke-scaled.png";

    scores.forEach((score, index) => {
        const scoreGlobalItem = document.createElement('div');
        scoreGlobalItem.className = 'score-global-item';

        // Si el backend indica que tiene imagen, usamos el endpoint.
        // Si no, usamos la imagen por defecto.
        const imgSrc = score.has_profile_image
            ? `${BASE_API_URL}/users/${score.user_id}/profile-image`
            : defaultImg;

        scoreGlobalItem.innerHTML = `
            <span class="score-global-item-position">${index + 1}</span>
            <img 
                src="${imgSrc}" 
                alt="Imagen de usuario" 
                class="score-global-item-image-user"
                onerror="this.onerror=null;this.src='${defaultImg}';"
            >
            <span class="score-global-item-name">${score.username}</span>
            <span class="score-global-item-score">${score.max_score}</span>
        `;
        scoreGlobalList.appendChild(scoreGlobalItem);
    });

    // Solo mostramos el contenedor cuando hay datos
    scoreGlobalContainer.classList.remove("score-global-container-hidden");
};



const clearScores = () => {
    // Vacía el contenedor de la lista
    while (scoreGlobalList.firstChild) {
        scoreGlobalList.removeChild(scoreGlobalList.firstChild);
    }
};


/**
 * Función de utilidad para mostrar el ranking global
 */
const showGlobalRanking = () => {
    getGlobalTop(10).then(data => {
        displayScores(data, 'global');
    }).catch(error => {
        console.error('Error obteniendo ranking global:', error);
    });
};

/**
 * Función de utilidad para mostrar el ranking del usuario actual
 */
const showUserRanking = (userId) => {
    getUserTop(userId, 10).then(data => {
        displayScores(data, 'user');
    }).catch(error => {
        console.error('Error obteniendo ranking del usuario:', error);
    });
};

/**
 * Función de utilidad para mostrar el ranking de un país específico
 */
const showCountryRanking = (countryCode) => {
    getCountryTop(countryCode, 10).then(data => {
        displayScores(data, 'country');
    }).catch(error => {
        console.error('Error obteniendo ranking del país:', error);
    });
};

/**
 * Función de utilidad para mostrar el ranking de una región específica
 */
const showRegionRanking = (region) => {
    getRegionTop(region, 10).then(data => {
        displayScores(data, 'region');
    }).catch(error => {
        console.error('Error obteniendo ranking de la región:', error);
    });
};