const electron = require('electron')
const {ipcRenderer} = electron

var keyboard = $('input:text').keyboard();

document.addEventListener('keydown', enterEvent);
var input = document.getElementById("input")
input.focus();

function enterEvent(e) {
    //console.log(e.code)
  if(e.code == "Enter") {
    //console.log("here")
      text = input.innerText
      ipcRenderer.send('board:close', text);
  }
}