const electron = require('electron')
const url = require('url')
const path = require('path')
const robot = require('robotjs')
const readline = require('readline')
const fs = require('fs')
const VirtualKeyboard = require('electron-virtual-keyboard');
const {app, BrowserWindow, Menu, ipcMain} = electron
let vkb;
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
        title: 'Keyboard'
    });
    // Load html into window
    boardWindow.loadURL(url.format({
        pathname: path.join(__dirname, './windows/keyboardWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    vkb = new VirtualKeyboard(boardWindow.webContents);
    // Garbage collection handle
    boardWindow.on('close', function() {
        boardWindow = null
        vkb = null
    });
    ipcMain.on('board:close', function(e, text) {
        if(boardWindow != null)
            boardWindow.close();
            // console.log(text)
            // robot.typeStringDelayed(text, 180);
            // robot.keyTap("enter")
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
    console.log([xc, yc]);
    let ss = robot.getScreenSize();
    let sx = ss.width;
    let sy = ss.height;
    let caldata = JSON.parse(fs.readFileSync("caldata.json"));
    if(xc < caldata["wmid"]){
        if(yc < caldata["lhmid"]){
            robot.moveMouse((xc - caldata["tl"][0])/caldata["ct"][0] * 2 * sx, (yc - caldata["tl"][1])/caldata["cl"][1] * 2 * sy);
        }
        else{
            robot.moveMouse((xc - caldata["bl"][0])/caldata["cb"][0] * 2 * sx, (yc - caldata["cl"][1])/caldata["bl"][1] * 2 * sy);
        }
    }
    else{
        if(yc < caldata["rhmid"]){
            robot.moveMouse((xc - caldata["ct"][0])/caldata["tr"][0] * 2 * sx, (yc - caldata["tr"][1])/caldata["cr"][1] * 2 * sy);
        }
        else{
            robot.moveMouse((xc - caldata["cb"][0])/caldata["br"][0] * 2 * sx, (yc - caldata["cr"][1])/caldata["br"][1] * 2 * sy);
        }
    }
    //robot.moveMouse((xc-1.2)/3.5 * sx, (yc-2.6)/4.5 * sy);
});
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
