const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // Precarga el archivo preload.js
            contextIsolation: true,  // Aislamiento de contexto para seguridad
            enableRemoteModule: false,  // Desactiva módulos remotos
            nodeIntegration: false  // No permite acceso a Node.js en el renderer
        },
    });

    // Cargar el contenido (puede ser una URL o un archivo local)
    mainWindow.loadFile('http://localhost:5173');  // O usar loadURL('https://example.com') si usas una URL externa

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
