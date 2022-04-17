const electron = require('electron')
const url = require('url')
const path = require('path')
const robot = require('robotjs')
const readline = require('readline')
const fs = require('fs')
const {app, BrowserWindow, Menu, ipcMain} = electron
let video;
// SET ENV
process.env.NODE_ENV = 'development'
let mainWindow
robot.setMouseDelay(1);
// Listen for app to be ready
app.on('ready', function() {
    // Create new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, './windows/mainWindow.html'),
        protocol: 'file:',
        slashes: true
    })); // file://dirname/mainWindow.html
    // Quit app when closed
    mainWindow.on('closed', function() {
        app.quit()
    });
    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    // Insert menu
    Menu.setApplicationMenu(mainMenu)
});
// Handle create keybinds window
function createKeybindsWindow() {
    // Create new window
    keyWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Set Keybinds'
    });
    // Load html into window
    keyWindow.loadURL(url.format({
        pathname: path.join(__dirname, './windows/keybindsWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Garbage collection handle
    keyWindow.on('close', function() {
        keyWindow = null
    });
}
function createCalibrationWindow() {
    // Create new window
    calWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Calibrate',
        fullscreen: true
    });
    // Load html into window
    calWindow.loadURL(url.format({
        pathname: path.join(__dirname, './windows/calibrationWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Garbage collection handle
    calWindow.on('close', function() {
        calWindow = null
    });
    ipcMain.on('close:cal', function(e) {
        calWindow.close();
    });
}
function createKeyboardWindow() {
    // Create new window
    boardWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Keyboard',
        fullscreen: true
    });
    // Load html into window
    boardWindow.loadURL(url.format({
        pathname: path.join(__dirname, './windows/keyboardWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Garbage collection handle
    boardWindow.on('close', function() {
        boardWindow = null
    });
    ipcMain.on('close:board', function(e) {
        boardWindow.close();
    });
}
// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Calibrate',
                accelerator: process.platform == 'darwin' ? 'Command+Shift+C' : 'Ctrl+Shift+C',
                click() {
                    createCalibrationWindow()
                }
            },
            {
                label: 'Keybinds',
                accelerator: process.platform == 'darwin' ? 'Command+K' : 'Ctrl+K',
                click() {
                    createKeybindsWindow()
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit()
                }
            }
        ]
    }
]
// If mac, add empty object to menu
if(process.platform == 'darwin') {
    mainMenuTemplate.unshift({label:''})
}
// Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            }, 
            {
                role: 'reload'
            }
        ]
    })
}
ipcMain.on("lc", (e) =>{
    robot.mouseClick("left");
});
ipcMain.on("rc", (e) =>{
    robot.mouseClick("right");
});
ipcMain.on("mm", (e, xc, yc) => {
    let ss = robot.getScreenSize();
    let sx = ss.width;
    let sy = ss.height;
    robot.moveMouse((xc-1.2)/3.5 * sx, (yc-2.6)/4.5 * sy);
});
ipcMain.on("setvid", (e, video) =>{
    video = video;
});
ipcMain.on("vidstuff", (e, ofsccanv) =>{
    await new Promise(r => setTimeout(r, 1000));
let intervalId
navigator.getUserMedia({video: true, audio: false}, (localMediaStre
    const video = document.querySelector("#videoElement");
    video.srcObject = localMediaStream;
    intervalId = setInterval(() =>{
        let tr = video.getBoundingClientRect();
        let ofscanv = new OffscreenCanvas(tr.width, tr.height);
        let ctx = ofscanv.getContext('2d');
        ctx.drawImage(video, 0, 0, tr.width, tr.height);
        let id = ctx.getImageData(0, 0, tr.width, tr.height);
        let idcopy = new Uint8ClampedArray(id.data);
        for(let i = 0; i < id.data.length; i = i + 4){
            let nd = 0.2989 * id.data[i] + 0.5870 * id.data[i+1] + 
            id.data[i] = nd;
            id.data[i+1] = nd;
            id.data[i+2] = nd;
        }
        let t = tf.browser.fromPixels(id, 1)
        .resizeNearestNeighbor([256, 256])
        .toFloat()
        .expandDims();
        segmodel.predict(t).data().then((pred)=>{
                let top = 256*256;
                let bot = 0;
                let left = 256*256;
                let right = 0;
                for(let i = 0; i < pred.length; i++){
                    if(pred[i] > 0.6){
                        if(i < top){top = i}
                        if(i > bot){bot = i}
                        if(i%256 < left){left = i%256}
                        if(i%256 > right){right = i%256}
                    }
                }
                if(top != 256*256){
                    if(left < 4){left = 0}
                    else{left -= 4}
                    if(right > 251){right = 255}
                    else{right += 4}
                    if(top < 3*256){top = 0}
                    else{top -= 3*256}
                    if(bot > 256*256 - 256*3 - 1){bot = 256*256-1}
                    else{bot += 256*3}
                    let xscale = id.width / 256;
                    let yscale = id.height / 256;
                    left = Math.floor(left * xscale);
                    right = Math.ceil(right * xscale);
                    top = Math.floor(Math.floor(top/256) * yscale);
                    bot = Math.ceil(Math.floor(bot/256) * yscale);
                    let width = right - left + 1;
                    let height = bot - top + 1;
                    let midpoint = Math.floor((left + right) / 2);
                    if(width / height > 2.8){
                        console.log("Two Eyes Open");
                        runningmid = midpoint;
                        let rightofleft = midpoint - 25;
                        let leftofright = midpoint + 25;
                        let leftw = rightofleft - left + 1;
                        let rightw = right - leftofright + 1;
                        while(leftw < rightw){
                            rightofleft += 1;
                            leftw = rightofleft - left + 1;
                        }
                        while(leftw > rightw){
                            leftofright -= 1;
                            rightw = right - leftofright + 1; 
                        }
                        let lnar = new Array();
                        let rnar = new Array();
                        let lc = 0;
                        let rc = 0;
                        for(let i = top*id.width; i < (bot+1)*id.wi
                            if(i%id.width >= left && i%id.width <= 
                                lnar[lc++] = idcopy[i*4];
                                lnar[lc++] = idcopy[i*4+1];
                                lnar[lc++] = idcopy[i*4+2];
                                lnar[lc++] = idcopy[i*4+3];
                            }
                            if(i%id.width >= leftofright && i%id.wi
                                rnar[rc++] = idcopy[i*4];
                                rnar[rc++] = idcopy[i*4+1];
                                rnar[rc++] = idcopy[i*4+2];
                                rnar[rc++] = idcopy[i*4+3];
                            }
                        }
                        let id2l = new ImageData(new Uint8ClampedAr
                        let id2r = new ImageData(new Uint8ClampedAr
                        let t2l = tf.browser.fromPixels(id2l, 3)
                        .resizeNearestNeighbor([36, 60], true)
                        .toFloat()
                        .expandDims();
                        let t2r = tf.browser.fromPixels(id2r, 3)
                        .resizeNearestNeighbor([36, 60])
                        .toFloat()
                        .expandDims();
                        gzmodel.predict([t2l, t2r]).data().then(pre
                            console.log(pred)
                        });
                    }
                    else{
                        console.log("One Eye Open");
                        if(midpoint <= runningmid){console.log("Rig
                        else{console.log("Left Eye Open");}
                    }
                }
                else{
                    console.log("Eyes Closed!");
                }
        });
    }, 1000/FRAMERATE);
}, (error) => {console.log(error)})
await new Promise(r => setTimeout(r, 9000));
clearInterval(intervalId);
})
ipcMain.on('keys:update', function(e, newKeys) {
    fs.writeFile('./keybinds.json', JSON.stringify(newKeys), (err) => {
        if (err) return console.log(err);
    });      
})
ipcMain.handle(
    'DESKTOP_CAPTURER_GET_SOURCES',
    (event, opts) => desktopCapturer.getSources(opts)
)

ipcMain.on('keyboard:open', function(e) {
    createKeyboardWindow();
})