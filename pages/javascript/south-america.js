const buttonNext = document.querySelector(".button-next")
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
let rigthSideFlag

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
        names.setAttribute("draggable", "true")
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

const showRigthFlag = ()=> {//Función para mostrar la bandera de la derecha
    flagIndex = Math.trunc(Math.random() * (southAmerica.length - 0) + 0)
    rigthSideFlag = document.createElement("IMG")
    rigthSideFlag.setAttribute("class", "flags-rigth")
    rigthSideFlag.setAttribute("id", southAmerica[flagIndex].name.common)
    rigthSideFlag.setAttribute("src", southAmerica[flagIndex].flags.png)
    flagsContainer.append(rigthSideFlag)
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
        dropFlagCenter.classList.remove("drop-flag-waiting")
        dropFlagLeft.classList.remove("flag-drop-area-hidden")
        dropFlagRight.classList.remove("flag-drop-area-hidden")
        southAmerica.splice(flagIndex, 1)
        flagsContainer.style.justifyContent = "space-between"
        showLeftFlag()
        showRigthFlag()
    }else if(southAmerica.length == 3) {
        leftSideFlag.remove()
        rigthSideFlag.remove()
        dropFlagCenter.classList.remove("flag-drop-area-hidden", "flag-drop-area-success")
        dropFlagLeft.classList.remove("drop-flag-waiting", "flag-drop-area-success")
        dropFlagRight.classList.remove("drop-flag-waiting", "flag-drop-area-success")
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        showLeftFlag()
        showRigthFlag()
        showCenterFlag()
        buttonNext.disabled = true
    }else{
        leftSideFlag.remove()
        rigthSideFlag.remove()
        dropFlagLeft.textContent = ""
        dropFlagRight.textContent = ""
        dropFlagLeft.classList.remove("drop-flag-waiting", "flag-drop-area-success")
        dropFlagRight.classList.remove("drop-flag-waiting", "flag-drop-area-success")
        showLeftFlag()
        showRigthFlag()
    }
    buttonNext.disabled = true
    buttonNext.style.opacity = ".2"
})


listOfNames.addEventListener("dragstart", (e)=> {
    e.dataTransfer.setData("text/plain", e.target.id)
    if(!dropFlagCenter.classList.contains("flag-drop-area-hidden") && dropFlagLeft.classList.contains("flag-drop-area-hidden")){
        dropFlagCenter.classList.remove("flag-drop-area-failed")
        dropFlagCenter.classList.add("drop-flag-waiting")
    }else if(dropFlagCenter.classList.contains("flag-drop-area-hidden")){
        dropFlagLeft.classList.remove("flag-drop-area-failed")
        dropFlagRight.classList.remove("flag-drop-area-failed")
        dropFlagLeft.classList.add("drop-flag-waiting")
        dropFlagRight.classList.add("drop-flag-waiting")
    }else{
        dropFlagCenter.classList.add("drop-flag-waiting")
        dropFlagLeft.classList.add("drop-flag-waiting")
        dropFlagRight.classList.add("drop-flag-waiting")
    }
})

listOfNames.addEventListener("dragend", ()=> {
    dropFlagCenter.classList.remove("drop-flag-waiting")
    dropFlagLeft.classList.remove("drop-flag-waiting")
    dropFlagRight.classList.remove("drop-flag-waiting")
})

dropFlagLeft.addEventListener("dragover", (e)=>{
    e.preventDefault()
})

dropFlagLeft.addEventListener("drop", (e)=> {
    e.preventDefault()
    dropFlagLeft.textContent = e.dataTransfer.getData("text")
    if(dropFlagLeft.textContent == leftSideFlag.id){
        console.log("si coinciden")
    }else{
        console.log("nop")
    }
})

dropFlagCenter.addEventListener("dragover", (e)=>{
    e.preventDefault()
})

dropFlagCenter.addEventListener("drop", (e)=> {
    e.preventDefault()
    dropFlagCenter.textContent = e.dataTransfer.getData("text")
    if(dropFlagCenter.textContent == centerFlag.id){
        console.log("si coinciden")
    }else{
        console.log("nop")
    }
})

dropFlagRight.addEventListener("dragover", (e)=>{
    e.preventDefault()
})

dropFlagRight.addEventListener("drop", (e)=> {
    e.preventDefault()
    dropFlagRight.textContent = e.dataTransfer.getData("text")
    if(dropFlagRight.textContent == rigthSideFlag.id){
        console.log("si coinciden")
    }else{
        console.log("nop")
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
        if(dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
            if(dropFlagLeft.classList.contains("flag-drop-area-failed")){
                dropFlagLeft.classList.remove("flag-drop-area-failed")
            }
            if(dropFlagRight.classList.contains("flag-drop-area-failed")){
                dropFlagRight.classList.remove("flag-drop-area-failed")
            }
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            buttonNext.disabled = false
        }else if(dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rigthSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else{
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }
    }else{
        if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
            buttonNext.disabled = false
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-success")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent == centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent !== rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-success")
            dropFlagLeft.classList.add("flag-drop-area-failed")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent == leftSideFlag.id && dropFlagRight.textContent !== rigthSideFlag.id){
            dropFlagCenter.classList.add("flag-drop-area-failed")
            dropFlagLeft.classList.add("flag-drop-area-success")
            dropFlagRight.classList.add("flag-drop-area-failed")
        }else if(dropFlagCenter.textContent !== centerFlag.id && dropFlagLeft.textContent !== leftSideFlag.id && dropFlagRight.textContent == rigthSideFlag.id){
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