const electron = require('electron')
const url = require('url')
const path = require('path')
const robot = require('robotjs')
const readline = require('readline')
const fs = require('fs')
const {app, BrowserWindow, Menu, ipcMain} = electron
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
ipcMain.on('keys:update', function(e, newKeys) {
    fs.writeFile('./keybinds.json', JSON.stringify(newKeys), (err) => {
        if (err) return console.log(err);
    });      
})
ipcMain.handle(
    'DESKTOP_CAPTURER_GET_SOURCES',
    (event, opts) => desktopCapturer.getSources(opts)
)