const buttonCall = document.querySelector(".button")
const flagInScreen = document.querySelector(".flags")

buttonCall.addEventListener("click", ()=> {
    console.log("hola")
    fetch("https://restcountries.com/v3.1/region/ame")
    .then(res => res.ok == true ? Promise.resolve(res) : Promise.reject(res))
    .then(res => res.json())
    .then(res => {
        console.log(res)
        for(const re of res){
            console.log(re.subregion =="South America")
        }
    })
})