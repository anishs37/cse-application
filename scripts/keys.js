const electron = require('electron')
const {ipcRenderer} = electron 

const file = '../keybinds.json'
const keybinds = require(file)
const form = document.getElementById("keyForm")
    
var formString = ""
Object.keys(keybinds).forEach(el => {
    formString += `<div class="margin"><input value="${keybinds[el][0]}" id="${el}" type="text">
    <label for="${el}">${keybinds[el][1]}</label></div>`
})
form.innerHTML = formString

function update() {
    newKeys = {}
    Object.keys(keybinds).forEach(el => {
        var cur = document.getElementById(el)
        newKeys[el] = [cur.value, keybinds[el][1]]
    })

    ipcRenderer.send('keys:update', newKeys)

    M.toast({html: 'Keybinds updated! You may close this window.'})
}