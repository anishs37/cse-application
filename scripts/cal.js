const electron = require('electron');
const {ipcRenderer} = electron;
/*
    top-left: tl
    top-right: tr
    bottom-left: bl
    bottom-right: br
    center-left: cl
    center-right: cr
    center-top: ct
    center-bottom: cb
    center: c
*/
function appear(place) {
    document.getElementById(place).style.visibility = "visible";
}
function disappear(place) {
    document.getElementById(place).style.visibility = "hidden";
}
var button = document.getElementById("start")
var inst = document.getElementById("instructions")
button.onclick = async () => {
    button.style.visibility = "hidden";
    inst.style.visibility = "hidden";
    // calibration code n stuff ig
    appear('tl')
    await new Promise(r => setTimeout(r, 2000));
    disappear('tl')
    button.style.visibility = "visible";
    button.innerText = "Exit Window"
    inst.style.visibility = "visible";
    inst.innerText = "Finished. Thank you."
    button.onclick = () => {
        ipcRenderer.send('close:cal')
    }
}