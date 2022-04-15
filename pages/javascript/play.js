const buttonCall = document.querySelector(".button")
const flagInScreen = document.querySelector(".flags")
const flagsContainer = document.querySelector(".flags-container")

let southAmerica//En esta variable será un array con los países de América del Sur.
let flagIndex//Variable para guarda un numero aleatorio entre el 0 y el último índice del array de banderas de América del Sur.

let leftSideFlag
let rigthSideFlag

const callCountry = async ()=> {//Función que hace la solicitud a la API de los países de América.
    const result =  fetch("https://restcountries.com/v3.1/region/ame")
    const country = await result
    return country.json()
}

const showTheFirstFlags = ()=> {//Función para la primera banderas.
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    flagInScreen.setAttribute("src", southAmerica[flagIndex].flags.png)
}

const saveCountriesSouthAmerica = async ()=> {//
    const america = await callCountry()//Llamada a la función que hace la solicitud.
    southAmerica = america.filter(element => element.subregion == "South America")
    showTheFirstFlags()
}

document.addEventListener("DOMContentLoad", saveCountriesSouthAmerica())//Muestra la primera bandera.

const showLeftFlag = ()=> {
    if(southAmerica.length == 1) {
        buttonCall.disabled = true
    }
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    leftSideFlag = document.createElement("IMG")
    leftSideFlag.setAttribute("class", "flags-left")
    leftSideFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    flagsContainer.prepend(leftSideFlag)
    southAmerica.splice(flagIndex, 1)
}

const showRigthFlag = ()=> {
    if(southAmerica.length == 1) {
        buttonCall.disabled = true
    }
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    rigthSideFlag = document.createElement("IMG")
    rigthSideFlag.setAttribute("class", "flags-rigth")
    rigthSideFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    flagsContainer.append(rigthSideFlag)
    southAmerica.splice(flagIndex, 1)
}

const showCenterFlag = ()=> {
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    const centerFlag = document.createElement("IMG")
    centerFlag.setAttribute("class", "width-for-the-three-flags")
    centerFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    leftSideFlag.after(centerFlag)
}

buttonCall.addEventListener("click", ()=> {
    if(flagsContainer.childElementCount == 1) {
        flagInScreen.remove()
        showLeftFlag()
        showRigthFlag()
    }
    if(southAmerica.length == 2) {
        console.log(southAmerica)
        leftSideFlag.remove()
        rigthSideFlag.remove()
        showLeftFlag()
        showCenterFlag()
        showRigthFlag()
        leftSideFlag.setAttribute("class", "width-for-the-three-flags")
        rigthSideFlag.setAttribute("class", "width-for-the-three-flags")
        console.log(southAmerica)
    }else if(southAmerica.length > 2 && flagsContainer.childElementCount == 2) {
        flagsContainer.style.justifyContent = "space-between"
        leftSideFlag.remove()
        rigthSideFlag.remove()
        showLeftFlag()
        showRigthFlag()
    }else {
        showLeftFlag()
        showRigthFlag()
    }
})