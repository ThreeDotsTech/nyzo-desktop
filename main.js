const { app, BrowserWindow, ipcMain, Tray } = require('electron')
const path = require('path');
const url = require('url');
const log = require('electron-log');
app.allowRendererProcessReuse = false;

// a window object outside the function scope prevents
// the object from being garbage collected
let mainWindow;
let unlockWindow;
let icon;




function createWindow() {
    icon = new Tray(path.join(__dirname, 'icon/AppIcon.png'));
    unlockWindow = new BrowserWindow({
        frame: false,
        width: 400,
        height: 500,
        resizable: false,
        icon: icon,
        webPreferences: {
            nodeIntegration: true
        }
    })
    unlockWindow.loadFile('unlock.html');
    //unlockWindow.webContents.openDevTools()
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})


// -------------------  event listeners --------------------

// temporary variable to store data while background
// process is ready to start processing
var cache = {
    password: '',
    wallet: undefined
}

// a window object outside the function scope prevents
// the object from being garbage collected
let hiddenWindow;

// This event listener will listen for request
// from visible renderer process
ipcMain.on('START_BACKGROUND_VIA_MAIN', (event, args) => {
    log.info('Starting background proccess..');
    const backgroundFileUrl = url.format({
        pathname: path.join(__dirname, `background_tasks/background.html`),
        protocol: 'file:',
        slashes: true,
    });
    hiddenWindow = new BrowserWindow({
        show: false,
        icon: icon,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    hiddenWindow.loadURL(backgroundFileUrl);
    //hiddenWindow.webContents.openDevTools();
    hiddenWindow.on('closed', () => {
        hiddenWindow = null;
    });
});

ipcMain.on('GET_WALLET_FROM_CACHE', (event, args) => {
    event.reply('WALLET_FROM_CACHE', cache['wallet']);
});


ipcMain.on('BACKGROUND_READY', (event, args) => {
    log.info('Background proccess running.');
    event.reply('CHECK_WALLET', {
        path: app.getPath('appData')
    });
});

ipcMain.on('MESSAGE_FROM_RENDERER', (event, args) => {
    switch (args['level']) {
        case undefined:
            log.info(args['message']);
            break;
        case 'error':
            log.error(args['message']);
            break;
        default:
            log.warn(args['message']);
            break;
    }


});

ipcMain.on('REMOVE_WALLET', (event, args) => {
    hiddenWindow.webContents.send('REMOVE_WALLET', args);
});

ipcMain.on('WALLET_REMOVED', (event, args) => {
    mainWindow.close();
    unlockWindow = new BrowserWindow({
        frame: false,
        width: 400,
        height: 500,
        resizable: false,
        icon: icon,
        webPreferences: {
            nodeIntegration: true
        }
    });
    unlockWindow.loadFile('unlock.html');

});

ipcMain.on('DISPLAY_WALLET', (event, args) => {
    cache['wallet'] = args['wallet'];
    cache['password'] = args['password'];
    log.info('Openning wallet window');
    unlockWindow.close();
    mainWindow = new BrowserWindow({
        frame: false,
        width: 800,
        height: 600,
        resizable: false,
        icon: icon,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.on('close', (event) => {
        hiddenWindow.close();
    });
    mainWindow.loadFile('index.html');

    //mainWindow.webContents.openDevTools();
});

ipcMain.on('UNLOCK_WALLET', (event, args) => {
    hiddenWindow.webContents.send('UNLOCK_WALLET', args);
});

ipcMain.on('CLOSE_UNLOCK_WINDOW', (event, args) => {
    unlockWindow.close();
    hiddenWindow.close();
});

ipcMain.on('CLOSE_MAIN_WINDOW', (event, args) => {
    mainWindow.close();
});

ipcMain.on('MINIMIZE_MAIN_WINDOW', (event, args) => {
    mainWindow.minimize();
});

ipcMain.on('MINIMIZE_UNLOCK_WINDOW', (event, args) => {
    unlockWindow.minimize();
});

ipcMain.on('SAVE_WALLET', (event, wallet) => {
    cache['wallet'] = wallet;
    hiddenWindow.webContents.send('SAVE_WALLET', cache);
});

ipcMain.on('WRONG_PASSWORD', (event, args) => {
    unlockWindow.webContents.send('WRONG_PASSWORD');
});

ipcMain.on('CREATE_NEW_WALLET', (event, args) => {
    log.info('Creating new wallet...');
    args['path'] = app.getPath('appData');
    hiddenWindow.webContents.send('CREATE_ENCRYPTED_WALLET', args);
});

ipcMain.on('WALLET_STATUS', (event, args) => {
    switch (args['status']) {
        case 'file':
            unlockWindow.webContents.send('WALLET_EXIST');
            log.info('Wallet found.');
            break;
        default:
            unlockWindow.webContents.send('WALLET_DOESNT_EXIST');
            log.warn('Wallet not found.');
            break;
    }
});