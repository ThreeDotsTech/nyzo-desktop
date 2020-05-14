const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const url = require('url');

app.allowRendererProcessReuse = false;

// a window object outside the function scope prevents
// the object from being garbage collected
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        frame: false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    //mainWindow.webContents.openDevTools();

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
let cache = {
    data: undefined,
};

// a window object outside the function scope prevents
// the object from being garbage collected
let hiddenWindow;

// This event listener will listen for request
// from visible renderer process
ipcMain.on('START_BACKGROUND_VIA_MAIN', (event, args) => {
    console.log('Starting background proccess..')
    const backgroundFileUrl = url.format({
        pathname: path.join(__dirname, `background_tasks/background.html`),
        protocol: 'file:',
        slashes: true,
    });
    hiddenWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    hiddenWindow.loadURL(backgroundFileUrl);

    hiddenWindow.webContents.openDevTools();

    hiddenWindow.on('closed', () => {
        hiddenWindow = null;
    });

    cache.data = args.number;
});

// This event listener will listen for data being sent back
// from the background renderer process
ipcMain.on('MESSAGE_FROM_BACKGROUND', (event, args) => {
    console.log('New message from the background proccess:')
    mainWindow.webContents.send('MESSAGE_FROM_BACKGROUND_VIA_MAIN', args.message);
});

ipcMain.on('BACKGROUND_READY', (event, args) => {
    console.log('- Background proccess running..')
    event.reply('START_PROCESSING', {
        data: cache.data,
    });
});

