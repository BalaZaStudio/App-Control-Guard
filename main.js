const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // Si necesitas habilitar ciertas funcionalidades, como la comunicación entre procesos
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'), // Puedes quitar esto si no usas un preload
        },
    });

    // Cambia esto a la URL de tu servidor Vite
    mainWindow.loadURL('http://localhost:5173'); 
}

app.whenReady().then(() => {
    // Iniciar el servidor de Vite
    const vite = spawn('npm', ['run', 'dev'], { shell: true });

    vite.stdout.on('data', (data) => {
        console.log(`Vite: ${data}`);
    });

    vite.stderr.on('data', (data) => {
        console.error(`Vite Error: ${data}`);
    });

    vite.on('close', (code) => {
        console.log(`Vite process exited with code ${code}`);
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
