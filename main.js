// This is a server for back end
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const isMac = process.platform === 'darwin';
const isDev = process.env.NODE_ENV !== 'production'
let mainWindow;
function createMainWindow() {
     mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    //Open devtool if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 400,
    });
    //Open devtool if in dev env
    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// Menu template
const menu = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ] : []),
    {
        role: 'fileMenu'
    },
    // {
    //     label: 'File',
    //     submenu: [
    //         {
    //             label: 'Quit',
    //             click: () => app.quit(),
    //             accelerator: 'CmdOrCtrl+W'
    //         }
    //     ],
    // },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : [])
];

app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
    // Remove mainWindow from memory on close
    mainWindow.on('closed', () => mainWindow = null);
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow(); // To make sure app is created
        }
    })
});


// Respond to ipcRenderer resize
ipcMain.on('image:resize', (event, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer');
    console.log(options);
    resizeImage(options);
});

async function resizeImage({pathImg, width, height, dest}) {
    try {
        const newPath = await resizeImg(fs.readFileSync(pathImg), {
            width: +width,
            height: +height
        });

        // Create filename
        const fileName = path.basename(pathImg);
        //Create new folder if not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        // Write file to dest
        fs.writeFileSync(path.join(dest, fileName), newPath);
        // Send success to renderer
        mainWindow.webContents.send('image:done');
        // Open dest folder
        await shell.openPath(dest);
    } catch (e) {
        console.log(e);
        alertError('Error system');
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
})