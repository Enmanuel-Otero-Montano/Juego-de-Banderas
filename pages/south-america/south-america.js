const buttonNext = document.querySelector(".button-next")
const buttonNextRegion = document.querySelector(".button-next-region")
const buttonCheck = document.querySelector(".button-check")
const centerFlag = document.querySelector(".flags-center")
const flagsContainer = document.querySelector(".flags-container")
const listOfNames = document.querySelector(".section-names__list")
const dropFlagLeft = document.querySelector(".drop-flag-left")
const dropFlagCenter = document.querySelector(".drop-flag-center")
const dropFlagRight = document.querySelector(".drop-flag-right")

let southAmerica//En esta variable será un array con los países de América del Sur.
let flagIndex//Variable para guarda un numero aleatorio entre el 0 y el último índice del array de banderas de América del Sur.

let leftSideFlag
let rightSideFlag

let selectedName

const callCountry = async ()=> {//Función que hace la solicitud a la API de los países de América.
    const result =  fetch("https://restcountries.com/v3.1/region/ame")
    const country = await result
    return country.json()
}

const saveCountriesSouthAmerica = async ()=> {//
    const america = await callCountry()//Llamada a la función que hace la solicitud.
    southAmerica = america.filter(element => element.subregion == "South America")
    showTheFirstFlags()
    showNames()
}

const showTheFirstFlags = ()=> {//Función para la primera banderas.
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    centerFlag.setAttribute("id", southAmerica[flagIndex].name.common)
    centerFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    console.log(southAmerica)
}

const showNames = ()=> {//Función para mostrar los nombres de los países
    const fragment = document.createDocumentFragment()
    for(const country of southAmerica) {
        const names = document.createElement("LI")
        names.innerHTML = `${country.name.common}`
        names.setAttribute("id", country.name.common)
        names.setAttribute("class", "flag-names")
        fragment.appendChild(names)
    }
    listOfNames.appendChild(fragment)
}

document.addEventListener("DOMContentLoad", saveCountriesSouthAmerica())//Muestra la primera bandera.

const showLeftFlag = ()=> {//Función para mostrar la bandera de la izquierda
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    leftSideFlag = document.createElement("IMG")
    leftSideFlag.setAttribute("class", "flags-left")
    leftSideFlag.setAttribute("id", southAmerica[flagIndex].name.common)
    leftSideFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    flagsContainer.prepend(leftSideFlag)
    southAmerica.splice(flagIndex, 1)
}

const showRightFlag = ()=> {//Función para mostrar la bandera de la derecha
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    rightSideFlag = document.createElement("IMG")
    rightSideFlag.setAttribute("class", "flags-right")
    rightSideFlag.setAttribute("id", southAmerica[flagIndex].name.common)
    rightSideFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    flagsContainer.append(rightSideFlag)
    southAmerica.splice(flagIndex, 1)
}

const showCenterFlag = ()=> {//Función para mostrar la bandera del centro
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    centerFlag.setAttribute("id", southAmerica[flagIndex].name.common)
    centerFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    leftSideFlag.after(centerFlag)
    southAmerica.splice(flagIndex, 1)
}

buttonNext.addEventListener("click", ()=> {
    if(flagsContainer.childElementCount == 1) {
        centerFlag.remove()
        dropFlagCenter.textContent = ""
        dropFlagCenter.classList.add("flag-drop-area-hidden")
        dropFlagLeft.classList.remove("flag-drop-area-hidden")
        dropFlagRight.classList.remove("flag-drop-area-hidden")
        southAmerica.splice(flagIndex, 1)
        flagsContainer.style.justifyContent = "space-between"
        showLeftFlag()
        showRightFlag()
    }else if(southAmerica.length == 3) {
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

listOfNames.addEventListener("click", (e)=> {
    selectedName = e.target.id
})

centerFlag.addEventListener("click", ()=>{
    flagsContainer.nextElementSibling.children[1].textContent = selectedName
})

flagsContainer.addEventListener("click", (e)=>{
    if(flagsContainer.childElementCount == 2){
        if(e.target.classList.contains("flags-left")){
            flagsContainer.nextElementSibling.children[0].textContent = selectedName
        }else if(e.target.classList.contains("flags-right")){
            flagsContainer.nextElementSibling.children[2].textContent = selectedName
        }
    }else if(flagsContainer.childElementCount == 3){
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
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
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
        }else if(dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else{
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }
    }else{
        if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            buttonNextRegion.disabled = false
            buttonNextRegion.style.opacity = "initial"
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rightSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else{
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }
    }
})