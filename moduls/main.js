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
const correctSfx = document.getElementById("sfx-correct")
const errorSfx = document.getElementById("sfx-error")
import { saveScore, getGlobalTop, getUserTop, getCountryTop, getRegionTop, getScoresSummary, getMyPosition, getUserBestScore } from '../javascript/score.js';
import { BASE_API_URL, SHOW_ADS } from "../moduls/api.js";
import { initAnalytics, track } from "./analytics.js";
import { getValidToken } from '../moduls/session.js';


loadingError.hidden = true

// AdSense Logic
const initAds = () => {
    if (SHOW_ADS) {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'flex';
        });
        console.log('Ads enabled');
    } else {
        console.log('Ads disabled (Development Mode)');
    }
};

initAds();
initAnalytics();

// Analytics Helper
const getContext = () => {
    let mode = 'region';
    if (location.href.includes('career-mode')) {
        mode = 'career';
    }

    let currentStageVal = 1;
    if (typeof stage !== 'undefined' && stage.currentStage) {
        currentStageVal = stage.currentStage;
    }

    let flagsCount = 0;
    if (flagsContainer) {
        flagsCount = flagsContainer.childElementCount;
        if (flagsContainer.querySelector('.flags-center') && flagsContainer.childElementCount === 1) flagsCount = 1;
    }

    // region is global variable
    return {
        mode,
        region: location.href,
        stage: currentStageVal,
        flags_count: flagsCount
    };
};

const playSfx = (audioEl, volume = 0.5) => {
    if (!audioEl) return;
    setTimeout(() => {
        try {
            audioEl.volume = volume;
            audioEl.currentTime = 0;
            audioEl.play().catch(err => {
                console.warn("Autoplay prevented or audio error:", err);
            });
        } catch (e) {
            console.error("Error playing sfx:", e);
        }
    }, 100);
}

const getRegionKeyFromLocation = (url) => {
    if (url.includes('career-mode')) return 'career';
    if (url.includes('america')) return 'america';
    if (url.includes('europe')) return 'europe';
    if (url.includes('asia')) return 'asia';
    if (url.includes('africa')) return 'africa';
    if (url.includes('oceania')) return 'oceania';
    return 'global';
};

let gameEnded = false;

const leftSideFlag = document.createElement("IMG")
leftSideFlag.setAttribute("class", "flags-left")

let startTime = 0; // Initialize game start time

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
            const text = await resp.text().catch(() => '');
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

const saveCountriesInArray = async (locationHref) => {
    try {
        allCountries.countries = await callCountry()//Llamada a la función que hace la solicitud.
        if (locationHref.includes("career-mode")) {
            southAmerica()
        } else if (locationHref.includes("america")) {
            southAmerica()
        } else if (locationHref.includes("europe")) {
            southOfEurope()
        } else if (locationHref.includes("africa")) {
            easternAfrica()
        } else if (locationHref.includes("oceania")) {
            oceaniaFunct()
        } else if (locationHref.includes("asia")) {
            westernAsia()
        }
        showNames()
        showCenterFlag()
        loaded()
        // Analytics
        const ctx = getContext();
        track('game_start', { mode: ctx.mode, region: ctx.region, stage: ctx.stage });
        // Start Timer for Anti-Cheat
        startTime = Date.now();
    } catch (error) {
        if (error instanceof TypeError) {
            loading.classList.add("loading-hidden")
            loadingError.hidden = false
        }
    }
}

document.addEventListener("DOMContentLoaded", () => saveCountriesInArray(region));

const showNames = () => {//Función para mostrar los nombres de los países
    const fragment = document.createDocumentFragment()
    for (const country of currentRegion.region) {
        const names = document.createElement("LI")
        names.textContent = `${country.name.common}`
        names.setAttribute("id", country.name.common)
        names.setAttribute("class", "flag-names")
        fragment.appendChild(names)
    }
    listOfNames.appendChild(fragment)
    const mql = matchMedia("(min-width: 565px)")// Muestra la lista de nombre en tres columnas si contiene 18 nombres y el ancho de la pantalla es => a 1024px 
    if (listOfNames.childElementCount === 18 && mql.matches) {
        listOfNames.classList.add("section-names__list-eighteen")
    } else {
        listOfNames.classList.remove("section-names__list-eighteen")
    }
}

const showLeftFlag = () => {//Función para mostrar la bandera de la izquierda
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    leftSideFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    flagsContainer.prepend(leftSideFlag)
    nameOfTheFlags["left flag name"] = currentRegion.region[flagIndex.index].name.common
    currentRegion.region.splice(flagIndex.index, 1)
}

const showRightFlag = () => {//Función para mostrar la bandera de la derecha
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    rightSideFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    flagsContainer.append(rightSideFlag)
    nameOfTheFlags["right flag name"] = currentRegion.region[flagIndex.index].name.common
    currentRegion.region.splice(flagIndex.index, 1)
}

const showCenterFlag = () => {//Función para mostrar la bandera del centro
    flagIndex.index = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
    centerFlag.setAttribute("src", currentRegion.region[flagIndex.index].flags.png)
    leftSideFlag.after(centerFlag)
    nameOfTheFlags["center flag name"] = currentRegion.region[flagIndex.index].name.common
}

listOfNames.addEventListener("click", (e) => {
    if (!e.target.classList.contains("section-names__list")) {
        selectedName.name = e.target.id
        dropFlagCenter.classList.remove("flag-drop-area-failed")
        dropFlagLeft.classList.remove("flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-failed")
        if (currentRegion.region.length === 0 && dropFlagCenter.textContent === nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"] && dropFlagCenter.classList.contains("flag-drop-area-success") && dropFlagLeft.classList.contains("flag-drop-area-success") && dropFlagRight.classList.contains("flag-drop-area-success")) {
            const countryByName = allCountries.countries.find(element => element.name.common === selectedName.name)
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
        if (menuContainer.classList.contains("menu-container-show")) {
            menuContainer.classList.remove("menu-container-show")
        }
    }
})

const removeNameSelected = () => {//Función para remover el color del nombre seleccionado
    for (const name of listOfNames.children) {
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
        buttonCheck.style.opacity = ".2";

        if (!gameEnded) {
            gameEnded = true;
            const ctx = getContext();
            track('game_over', {
                mode: ctx.mode,
                region: ctx.region,
                stage: ctx.stage,
                reason: 'corazones',
                score: parseInt(currentPoints.textContent, 10) || 0
            });
        }

        return 'Game over';
    } else {
        return 'Game on';
    }
};


const calculatePoints = (containerLeft, containerCenter, containerRight) => {
    if (containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-hidden")) {
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(containerCenter.dataset.points)
    } else if (containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success") && containerCenter.classList.contains("flag-drop-area-hidden")) {
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points)
    } else if (containerCenter.classList.contains("flag-drop-area-success") && containerLeft.classList.contains("flag-drop-area-success") && containerRight.classList.contains("flag-drop-area-success")) {
        currentPoints.textContent = parseInt(currentPoints.textContent) + parseInt(dropFlagCenter.dataset.points) + parseInt(containerLeft.dataset.points) + parseInt(containerRight.dataset.points)
    }
}

centerFlag.addEventListener("click", () => {
    flagsContainer.nextElementSibling.children[1].textContent = selectedName.name
    removeNameSelected()
})

leftSideFlag.addEventListener("click", () => {
    flagsContainer.nextElementSibling.children[0].textContent = selectedName.name
    removeNameSelected()
})

rightSideFlag.addEventListener("click", () => {
    flagsContainer.nextElementSibling.children[2].textContent = selectedName.name
    removeNameSelected()
})

buttonCheck.addEventListener("click", () => {
    const lives = numberOfLives ? parseInt(numberOfLives.textContent, 10) : Infinity;

    // Analytics
    const ctx = getContext();
    track('check_click', {
        mode: ctx.mode,
        region: ctx.region,
        stage: ctx.stage,
        flags_count: ctx.flags_count,
        lives: lives,
        score: parseInt(currentPoints.textContent, 10) || 0
    });

    if (lives <= 0) {
        return;
    }
    if (!dropFlagCenter.classList.contains("flag-drop-area-hidden") && dropFlagLeft.classList.contains("flag-drop-area-hidden")) {
        if (dropFlagCenter.textContent === nameOfTheFlags["center flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-success")
            playSfx(correctSfx)
            buttonNextFlags.disabled = false
            buttonNextFlags.style.opacity = "initial"
            buttonCheck.disabled = true
        } else {
            dropFlagCenter.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            dropFlagCenter.setAttribute("data-points", "5")
            if (region.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        }
    } else if (!dropFlagLeft.classList.contains("flag-drop-area-hidden") && !dropFlagRight.classList.contains("flag-drop-area-hidden") && dropFlagCenter.classList.contains("flag-drop-area-hidden")) {
        if (dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            if (dropFlagLeft.classList.contains("flag-drop-area-failed")) {
                dropFlagLeft.classList.remove("flag-drop-area-failed")
            }
            if (dropFlagRight.classList.contains("flag-drop-area-failed")) {
                dropFlagRight.classList.remove("flag-drop-area-failed")
            }
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            playSfx(correctSfx)
            buttonNextFlags.disabled = false
            buttonNextFlags.style.opacity = "initial"
            buttonCheck.disabled = true
        } else if (dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]) {
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            dropFlagRight.setAttribute("data-points", "5")
            if (region.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            playSfx(errorSfx)
            dropFlagLeft.setAttribute("data-points", "5")
            if (region.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else {
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            if (region.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        }
    } else {
        if (dropFlagCenter.textContent === nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            buttonCheck.disabled = true
            buttonCheck.style.opacity = ".2"
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            playSfx(correctSfx)
            informationContainer.classList.add("information-container-show")
            clearInterval(stop.counter)//Para el contador si es el final de la región actual
            if (region.includes("career-mode")) {
                if (currentStageInformation.textContent !== "12") {
                    regionOrStage.textContent = "esta etapa!"
                    dialog.show()
                } else {
                    regionOrStage.textContent = "todas las etapas!"
                    dialog.show()
                }
            } else if (region.includes("america")) {
                if (stage.currentStage < 2) {
                    regionOrStage.textContent = "esta etapa!"
                } else {
                    regionOrStage.textContent = `la región de ${regionName.textContent}!`
                    buttonNextRegion.style.display = "none"
                }
                dialog.show()
            } else if (region.includes("asia") || region.includes("europe") || region.includes("africa")) {
                if (stage.currentStage < 3) {
                    regionOrStage.textContent = "esta etapa!"
                } else {
                    regionOrStage.textContent = `la región de ${regionName.textContent}!`
                    buttonNextRegion.style.display = "none"
                }
                dialog.show()
                clearInterval(stop.counter)//Para el contador si es el final de la región actual
            } else if (region.includes("oceania") && stage.currentStage === 1) {
                regionOrStage.textContent = `la región de ${regionName.textContent}!`
                dialog.show()
                clearInterval(stop.counter)//Para el contador si es el final de la región actual
            }

            centerFlag.setAttribute("src", "")
        } else if (dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            dropFlagCenter.setAttribute("data-pointd", "5")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            playSfx(errorSfx)
            dropFlagLeft.setAttribute("data-pointd", "5")
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            dropFlagRight.setAttribute("data-pointd", "5")
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagCenter.textContent == nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent === nameOfTheFlags["left flag name"] && dropFlagRight.textContent !== nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
            playSfx(errorSfx)
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else if (dropFlagCenter.textContent !== nameOfTheFlags["center flag name"] && dropFlagLeft.textContent !== nameOfTheFlags["left flag name"] && dropFlagRight.textContent === nameOfTheFlags["right flag name"]) {
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
            playSfx(errorSfx)
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        } else {
            playSfx(errorSfx)
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
            if (location.href.includes("career-mode")) {
                checkNumberOfCurrentLives()
            }
        }
    }
    calculatePoints(dropFlagLeft, dropFlagCenter, dropFlagRight)
    if (region.includes("career-mode")) {
        let state = checkNumberOfLives()
        if (state === 'Game over') {
            const currentScore = Number.parseInt(currentPoints.textContent, 10) || 0;
            const finalScoreEl = document.querySelector(".final-score");
            if (finalScoreEl) finalScoreEl.textContent = currentScore;

            const token = getValidToken();
            if (!token) {
                const dialogFailed = document.querySelector('.dialog-failed');
                if (!dialogFailed.querySelector('.session-expired-msg')) {
                    const msg = document.createElement('p');
                    msg.className = 'session-expired-msg';
                    msg.style.color = 'red';
                    msg.style.fontSize = '0.9rem';
                    msg.innerHTML = 'No has iniciado sesión. <a href="../pages/user-login.html" style="color: blue; text-decoration: underline;">Inicia sesión</a> para guardar tu progreso.';
                    dialogFailed.appendChild(msg);
                }
                const bestScoreText = document.querySelector('.best-score-text');
                const leaderboardBtn = document.querySelector('.btn-show-leaderboard');
                if (bestScoreText) bestScoreText.style.display = 'none';
                if (leaderboardBtn) leaderboardBtn.style.display = 'none';
                return;
            }

            const ctx = getContext();
            const attempts = parseInt(numberOfLives.textContent, 10);

            // Calculate Duration
            const endTime = Date.now();
            const durationSeconds = Math.floor((endTime - startTime) / 1000);

            // Prepare Metadata
            const metadata = {
                game_duration_seconds: durationSeconds,
                game_mode: ctx.mode,
                game_region: ctx.region,
                region_key: getRegionKeyFromLocation(location.href),
                attempts: attempts
            };

            saveScore(currentScore, metadata)
                .then(() => Promise.all([
                    getGlobalTop(10),
                    getUserBestScore().catch(e => null)
                ]))
                .then(([globalData, bestScoreData]) => {
                    displayScores(globalData, 'global', false)

                    // Update Modal Best Score
                    const bestScoreEl = document.querySelector(".best-score");

                    if (bestScoreEl) {
                        if (bestScoreData && bestScoreData.max_score !== undefined) {
                            bestScoreEl.textContent = bestScoreData.max_score;
                        } else {
                            bestScoreEl.textContent = "Ver tabla";
                        }
                    }
                })
                .catch(err => {
                    console.error('Error saving score:', err);
                    const dialogFailed = document.querySelector('.dialog-failed');

                    if (err.status === 401) {
                        if (!dialogFailed.querySelector('.session-expired-msg')) {
                            const msg = document.createElement('p');
                            msg.className = 'session-expired-msg';
                            msg.style.color = 'red';
                            msg.style.fontSize = '0.9rem';
                            msg.innerHTML = 'Sesión expirada. <a href="../pages/user-login.html" style="color: blue; text-decoration: underline;">Inicia sesión</a> para guardar tu progreso.';
                            dialogFailed.appendChild(msg);
                        }
                        const bestScoreText = document.querySelector('.best-score-text');
                        const leaderboardBtn = document.querySelector('.btn-show-leaderboard');
                        if (bestScoreText) bestScoreText.style.display = 'none';
                        if (leaderboardBtn) leaderboardBtn.style.display = 'none';
                    } else if (err.status === 422) {
                        if (!dialogFailed.querySelector('.session-expired-msg')) {
                            const msg = document.createElement('p');
                            msg.className = 'session-expired-msg';
                            msg.style.color = 'red'; // Changed to red as requested
                            msg.style.fontSize = '0.9rem';
                            msg.textContent = 'Puntuación rechazada por inconsistencias.';
                            dialogFailed.appendChild(msg);
                        }
                        // Hide current score
                        const scoreTextEl = document.querySelector('.score-text');
                        if (scoreTextEl) scoreTextEl.style.display = 'none';
                    }
                })
        }
    }
})

buttonNextFlags.addEventListener("click", () => {
    nameOfTheFlags["center flag name"] = undefined
    nameOfTheFlags["left flag name"] = undefined
    nameOfTheFlags["right flag name"] = undefined
    dropFlagCenter.dataset.points = "10"
    dropFlagLeft.dataset.points = "10"
    dropFlagRight.dataset.points = "10"
    buttonCheck.disabled = false
    if (remainingTracks.textContent === "0" || currentRegion.region.length === 3) {
        buttonPista.disabled = true
        buttonPista.classList.add("btn-track-disabled")
    } else {
        buttonPista.disabled = false
        buttonPista.classList.remove("btn-track-disabled")
    }
    if (flagsContainer.childElementCount === 1) {
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
    } else if (currentRegion.region.length === 3) {
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
    } else {
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

howToPlay.addEventListener("click", () => {
    howToPlayModal.classList.remove("modal-how-to-play-hidden")
    clearInterval(stop.counter)
})

closeModal.addEventListener("click", () => {
    howToPlayModal.classList.add("modal-how-to-play-hidden")
    stop.counter = setInterval(counterDown, 1000)
})

const stage = {
    currentStage: 1
}

if (region.includes("career-mode")) {
    buttonNextRegion.addEventListener("click", () => {
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
} else if (region.includes("america")) {
    buttonNextRegion.addEventListener("click", () => {
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
} else if (region.includes("asia")) {
    buttonNextRegion.addEventListener("click", () => {
        currentRegion.region.splice(0)
        if (stage.currentStage === 1) {
            southernCentralAsia()
        } else if (stage.currentStage === 2) {
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
} else if (region.includes("europe")) {
    buttonNextRegion.addEventListener("click", () => {
        currentRegion.region.splice(0)
        if (stage.currentStage === 1) {
            easternCentralWesternEuropa()
            totalTime["eighteen names"] = 125//Reinicia el contador
        } else if (stage.currentStage === 2) {
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
} else if (region.includes("africa")) {
    buttonNextRegion.addEventListener("click", () => {
        currentRegion.region.splice(0)
        if (stage.currentStage === 1) {
            westernAfrica()
        } else if (stage.currentStage === 2) {
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

const careerMode = (stage) => {
    currentRegion.region.splice(0)
    if (stage === 1) {
        southAmerica()
    } else if (stage === 2) {
        southOfEurope()
    } else if (stage === 3) {
        westernAfrica()
    } else if (stage === 4) {
        southEasternAsia()
    } else if (stage === 5) {
        oceaniaFunct()
    } else if (stage === 6) {
        restOfAmerica()
    } else if (stage === 7) {
        southernCentralAsia()
    } else if (stage === 8) {
        northernEurope()
    } else if (stage === 9) {
        southernAndNorthernAfrica()
    } else if (stage === 10) {
        westernAsia()
    } else if (stage === 11) {
        easternAfrica()
    } else if (stage === 12) {
        easternCentralWesternEuropa()
    }
    deleteNamesFromList()
    showNames()
    showCenterFlag()
}

const southAmerica = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "South America")
}

const southOfEurope = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Southern Europe" && element.name.common !== "Gibraltar" || element.subregion == "Southeast Europe")
}

const westernAfrica = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Western Africa" && element.independent == true || element.name.common == "São Tomé and Príncipe" || element.name.common == "Gabon")
}

const southEasternAsia = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "South-Eastern Asia" || element.subregion == "Eastern Asia" && element.name.common !== "Macau")
}

const oceaniaFunct = () => {
    currentRegion.region = allCountries.countries.filter(element => element.region === "Oceania" && element.independent == true)
}

const restOfAmerica = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Central America" || element.subregion == "North America" && element.independent !== false || element.subregion === "Caribbean" && element.name.common == "Cuba" || element.name.common == "Dominican Republic" || element.name.common == "Haiti" || element.name.common == "Bahamas" || element.name.common == "Jamaica" || element.name.common == "Puerto Rico" || element.name.common == "Trinidad and Tobago" || element.name.common == "Dominica")
}

const southernCentralAsia = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Central Asia" && element.name.common !== "Turkmenistan" || element.subregion == "Southern Asia" || element.name.common == "Macau")
}

const northernEurope = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Northern Europe" && element.name.common !== "Svalbard and Jan Mayen" && element.name.common !== "Åland Islands")
}

const southernAndNorthernAfrica = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Northern Africa" && element.independent == true || element.subregion == "Southern Africa" || element.subregion == "Middle Africa" && element.name.common !== "Central African Republic" && element.name.common !== "South Sudan" && element.name.common !== "São Tomé and Príncipe" && element.name.common !== "Gabon")
}

const westernAsia = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Western Asia" || element.name.common == "Turkmenistan")
}

const easternAfrica = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Eastern Africa" && element.independent == true || element.name.common == "Central African Republic" || element.name.common == "South Sudan")
}

const easternCentralWesternEuropa = () => {
    currentRegion.region = allCountries.countries.filter(element => element.subregion === "Eastern Europe" || element.subregion == "Central Europe" || element.subregion == "Western Europe")
}

const deleteNamesFromList = () => {
    while (listOfNames.children.length > 0) {
        listOfNames.removeChild(listOfNames.children[0])
    }
}

const initialState = () => {
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
    gameEnded = false;
    stop.counter = setInterval(counterDown, 1000)
}

function counterDown() {
    const timeIsOver = totalTime["fourteen names"] === 0 || totalTime["eighteen names"] === 0;

    if (timeIsOver) {
        counter.textContent = "0 s";
        clearInterval(stop.counter);

        if (!gameEnded) {
            gameEnded = true;
            const ctx = getContext();
            track('game_over', {
                mode: ctx.mode,
                region: ctx.region,
                stage: ctx.stage,
                reason: 'tiempo',
                score: parseInt(currentPoints.textContent, 10) || 0
            });
        }

        // Guardar score también cuando pierde por tiempo
        if (region.includes("career-mode")) {
            const score = Number.parseInt(currentPoints.textContent, 10) || 0;
            const finalScoreEl = document.querySelector(".final-score");
            if (finalScoreEl) finalScoreEl.textContent = score;

            saveScore(score)
                .then(() => Promise.all([
                    getGlobalTop(10),
                    getUserBestScore().catch(e => null)
                ]))
                .then(([globalData, bestScoreData]) => {
                    displayScores(globalData, 'global', false);

                    // Update Modal Best Score
                    const bestScoreEl = document.querySelector(".best-score");

                    if (bestScoreEl) {
                        if (bestScoreData && bestScoreData.max_score !== undefined) {
                            bestScoreEl.textContent = bestScoreData.max_score;
                        } else {
                            bestScoreEl.textContent = "Ver tabla";
                        }
                    }
                })
                .catch(err => {
                    console.error('Error guardando score por tiempo agotado:', err);
                    if (err.status === 401) {
                        const dialogFailed = document.querySelector('.dialog-failed');
                        if (!dialogFailed.querySelector('.session-expired-msg')) {
                            const msg = document.createElement('p');
                            msg.className = 'session-expired-msg';
                            msg.style.color = 'red';
                            msg.style.fontSize = '0.9rem';
                            msg.innerHTML = 'Sesión expirada. <a href="../pages/user-login.html" style="color: blue; text-decoration: underline;">Inicia sesión</a> para guardar tu progreso.';
                            dialogFailed.appendChild(msg);
                        }
                        const bestScoreText = document.querySelector('.best-score-text');
                        const leaderboardBtn = document.querySelector('.btn-show-leaderboard');
                        if (bestScoreText) bestScoreText.style.display = 'none';
                        if (leaderboardBtn) leaderboardBtn.style.display = 'none';
                    }
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
        buttonCheck.disabled = true;
        buttonCheck.style.opacity = ".2";
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


const trueTrack = (flag) => {//Recorre la lista de nombres para poner la clase al nombre que corresponda con la bandera que se muestra.
    Array.from(listOfNames.children).forEach((element) => {
        if (element.textContent === flag) {
            element.classList.add("track")
            setTimeout(() => {
                element.classList.remove("track")
            }, 2400)
        }
    })
}

buttonMenu.addEventListener("click", () => {
    menuContainer.classList.toggle("menu-container-show")
})

buttonPopulation.addEventListener("click", () => {
    locationPopulationContainer.classList.remove("location-population-capital-container-show")
    populationInformationContainer.classList.add("population-information-container-show")
})

buttonCapital.addEventListener("click", () => {
    locationPopulationContainer.classList.remove("location-population-capital-container-show")
    capitalInformationContainer.classList.add("capital-information-container-show")
})

buttonRestart.addEventListener("click", () => {
    nameOfTheFlags["center flag name"] = undefined
    nameOfTheFlags["left flag name"] = undefined
    nameOfTheFlags["right flag name"] = undefined
    if (region.includes("oceania")) {
        oceaniaFunct()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    } else if (region.includes("europe")) {
        southOfEurope()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    } else if (region.includes("asia")) {
        westernAsia()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    } else if (region.includes("africa")) {
        easternAfrica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    } else if (region.includes("america")) {
        southAmerica()
        deleteNamesFromList()
        showNames()
        showCenterFlag()
        currentPoints.textContent = "00"
    } else {
        careerMode(stage.currentStage)
        currentPoints.textContent = "00"
        numberOfLives.textContent = "15"
    }
    initialState()
    dialogFailed.close()
    scoreGlobalContainer.classList.add("score-global-container-hidden")
})

buttonPista.addEventListener("click", () => {
    const ctx = getContext();
    track('hint_used', {
        mode: ctx.mode,
        region: ctx.region,
        stage: ctx.stage,
        remaining_tracks: parseInt(remainingTracks.textContent)
    });

    if (remainingTracks.textContent === "2" || remainingTracks.textContent === "1") {
        remainingTracks.textContent = parseInt(remainingTracks.textContent - 1)
    }
    if (flagsContainer.childElementCount === 1) {
        let falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
        trueTrack(nameOfTheFlags["center flag name"])
        if (falseTrack === currentRegion.region.findIndex(element => element.name.common === nameOfTheFlags["center flag name"])) {
            do {
                falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
                if (falseTrack !== currentRegion.region.findIndex(element => element.name.common === nameOfTheFlags["center flag name"])) {
                    listOfNames.children[falseTrack].classList.add("track")
                    setTimeout(() => {
                        listOfNames.children[falseTrack].classList.remove("track")
                    }, 2400)
                }
            } while (falseTrack === currentRegion.region.findIndex(element => element.name.common === nameOfTheFlags["center flag name"]))
        } else {
            listOfNames.children[falseTrack].classList.add("track")
            setTimeout(() => {
                listOfNames.children[falseTrack].classList.remove("track")
            }, 2400)
        }
    } else if (flagsContainer.childElementCount === 2) {
        let falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
        trueTrack(nameOfTheFlags["left flag name"])
        trueTrack(nameOfTheFlags["right flag name"])
        if (listOfNames.children[falseTrack].textContent === nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"]) {
            do {
                falseTrack = Math.trunc(Math.random() * (currentRegion.region.length - 0) + 0)
                if (listOfNames.children[falseTrack].textContent !== nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"]) {
                    listOfNames.children[falseTrack].classList.add("track")
                    setTimeout(() => {
                        listOfNames.children[falseTrack].classList.remove("track")
                    }, 2400)
                }
            } while (listOfNames.children[falseTrack].textContent === nameOfTheFlags["left flag name"] || listOfNames.children[falseTrack].textContent === nameOfTheFlags["right flag name"])
        } else {
            listOfNames.children[falseTrack].classList.add("track")
            setTimeout(() => {
                listOfNames.children[falseTrack].classList.remove("track")
            }, 2400)
        }
    }
    buttonPista.disabled = true
    buttonPista.classList.add("btn-track-disabled")
})

const loaded = () => {
    closeModal.classList.remove("close-button-hidden")
    loading.classList.add("loading-hidden")
}

/* Eventos de escucha de windows */

oncontextmenu = function () {
    return false
}

addEventListener("online", () => {
    saveCountriesInArray(region)/* Llama a la función en caso de que se haya ejecutado el "catch" en la primera llamada */
    loadingError.hidden = true
    loading.classList.remove("loading-hidden")
})

/**
 * Función para mostrar los registros de puntuaciones
 * @param {Array} scores - Array de puntuaciones obtenidas de la API
 * @param {string} type - Tipo de ranking ('global', 'user', 'country', 'region')
 * @param {boolean} showContainer - Si debe mostrar el contenedor inmediatamente (default: true)
 */
// --- Leaderboard Logic ---

const leaderboardState = {
    currentScope: 'global',
    userSummary: null
};

const setupLeaderboardTabs = () => {
    const tabs = document.querySelectorAll('.tab-btn');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // UI Update
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Logic
            const scope = tab.dataset.tab;
            leaderboardState.currentScope = scope;
            loadLeaderboard(scope);
        });
    });

    const closeBtn = document.querySelector('.btn-close-leaderboard');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            scoreGlobalContainer.classList.add("score-global-container-hidden");
        });
    }
};

const loadLeaderboard = (scope) => {
    clearScores();
    scoreGlobalList.innerHTML = '<div style="text-align:center; padding: 20px;">Cargando...</div>';

    // Check login for restricted scopes
    const token = getValidToken();
    if ((scope === 'country' || scope === 'user') && !token) {
        scoreGlobalList.innerHTML = '<div style="text-align:center; padding: 20px;">Inicia sesión para ver esto. <br><a href="../pages/user-login.html" style="color: yellow; text-decoration: underline;">Login</a></div>';
        updateMyPositionFooter(null);
        return;
    }

    let promise;
    const ctx = getContext();
    const regionKey = getRegionKeyFromLocation(location.href);

    if (scope === 'global') {
        promise = getGlobalTop(10);
    } else if (scope === 'country') {
        // We need user country code, assuming it's in localStorage or we fetch 'me'
        // For now, let's try to get it from profile or summary if we have it.
        // Or simpler: getScoresSummary returns everything we might need, or we call getUserTop?
        // Actually getCountryTop needs countryCode. 
        // Let's use getScoresSummary which returns everything? No, it returns user's rank.
        // We probably need to fetch user profile first to get country code if not stored.
        // Let's fallback to getScoresSummary if we don't have country code easily?
        // Or better: The backend usually handles "my country" if we pass a specific flag or we fetch user info first.
        // The current score.js has `getCountryTop(countryCode)`.
        // Let's try to fetch user Country info from localStorage if available (set during login).
        // If not, we might fail or need to fetch /users/me. 
        // Optimization: Let's assume we can fetch /users/me or check localStorage.
        promise = authenticatedFetch('/users/me').then(r => r.json()).then(u => getCountryTop(u.country_code || 'US', 10)); // Default fallback
    } else if (scope === 'region') {
        // region is from context or URL
        // getRegionTop(regionName)
        // Our backend expects strict region names maybe? 'america', 'europe'?
        // `ctx.region` is URL. `regionKey` is 'america'.
        promise = getRegionTop(regionKey, 10);
    } else if (scope === 'user') {
        promise = authenticatedFetch('/users/me').then(r => r.json()).then(u => getUserTop(u.id, 10));
    }

    promise
        .then(data => {
            displayScores(data, scope, false); // false = don't toggle container visibility here
            updateMyPositionFooter(scope);
        })
        .catch(err => {
            console.error('Leaderboard error:', err);
            scoreGlobalList.innerHTML = '<div style="text-align:center; padding: 20px;">Error al cargar.</div>';
        });
};

const updateMyPositionFooter = (scope) => {
    const footer = document.querySelector('.leaderboard-footer');
    if (!footer) return;

    const token = getValidToken();
    if (!token) {
        footer.classList.add('hidden');
        return;
    }

    // Determine correct scope and region for the API call
    let apiScope = scope;
    let apiRegion = null;

    if (scope === 'user') {
        // "My Best" tab -> Usually we just want to show My Best Score globally or just hide rank?
        // User asked for "My Position" in tabs.
        // If I am in "My Best", maybe I want to see my Global Rank?
        // Let's standard to Global for now, or just show "Your Best".
        apiScope = 'global';
    } else if (scope === 'region') {
        const regionKey = getRegionKeyFromLocation(location.href);
        apiRegion = regionKey;
    }

    getMyPosition({ scope: apiScope, region: apiRegion })
        .then(data => {
            // data format: { rank, max_score, total_players, region, scope }
            const rank = data.rank || '-';
            const score = data.max_score || '-';

            footer.querySelector('.my-position-text').textContent = `Tu posición: #${rank}`;
            footer.querySelector('.my-best-score').textContent = `Mejor: ${score}`;
            footer.classList.remove('hidden');
        })
        .catch(e => {
            console.error('Error fetching position:', e);
            footer.classList.add('hidden');
        });
};

const displayScores = (scores, type, showContainer = true) => {
    // Siempre limpiamos antes de volver a pintar
    clearScores();
    scoreGlobalList.innerHTML = '';

    // Verificar que hay datos para mostrar
    if (!scores || scores.length === 0) {
        scoreGlobalList.innerHTML = '<div style="text-align:center; padding: 20px;">No hay puntuaciones aún.</div>';
        return;
    }

    const defaultImg = "../assets/images/imagen-usuario-por-defecto-banderas-paises-regiones.png";

    scores.forEach((score, index) => {
        const scoreGlobalItem = document.createElement('div');
        scoreGlobalItem.className = 'score-global-item';

        const imgSrc = score.has_profile_image
            ? `${BASE_API_URL}/users/${score.user_id}/profile-image`
            : defaultImg;

        // Position
        const spanPos = document.createElement('span');
        spanPos.className = 'score-global-item-position';
        spanPos.textContent = index + 1;

        // Image
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Imagen de usuario';
        img.className = 'score-global-item-image-user';
        img.onerror = function () {
            this.onerror = null;
            this.src = defaultImg;
        };

        // Name (XSS Protected)
        const spanName = document.createElement('span');
        spanName.className = 'score-global-item-name';
        spanName.textContent = score.username;

        // Score
        const spanScore = document.createElement('span');
        spanScore.className = 'score-global-item-score';
        spanScore.textContent = score.max_score;

        scoreGlobalItem.appendChild(spanPos);
        scoreGlobalItem.appendChild(img);
        scoreGlobalItem.appendChild(spanName);
        scoreGlobalItem.appendChild(spanScore);

        scoreGlobalList.appendChild(scoreGlobalItem);
    });

    if (showContainer) {
        scoreGlobalContainer.classList.remove("score-global-container-hidden");
    }
};

const clearScores = () => {
    if (scoreGlobalList) {
        scoreGlobalList.innerHTML = '';
    }
};

// Initialize Tabs
document.addEventListener('DOMContentLoaded', () => {
    setupLeaderboardTabs();
});


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

/* Listener para mostrar Leaderboard desde Game Over Modal */
const btnShowLeaderboard = document.querySelector(".btn-show-leaderboard");
if (btnShowLeaderboard) {
    btnShowLeaderboard.addEventListener("click", () => {
        const ctx = getContext();
        track('leaderboard_open', { mode: ctx.mode, region: ctx.region, stage: ctx.stage });

        scoreGlobalContainer.classList.remove("score-global-container-hidden");
        scoreGlobalContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Initial load: Global
        loadLeaderboard('global');
    });
}