const { app, BrowserWindow } = require("electron");
const path = require("path");
const process = require('process');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
    fullscreen: true
  });

  win.loadFile("dist/index.html");

  win.webContents.on('did-finish-load', function () {
    win.webContents.send('send-args', process.argv.slice(1));
  });
}

const gotTheLock = app.requestSingleInstanceLock(process.argv.slice(1))

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Print out data received from the second instance.
    console.log("commandLine", commandLine, process.argv.slice(1), additionalData)

    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      win.webContents.send('send-args', additionalData);
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // Create win, load the rest of the app, etc...
  app.whenReady().then(() => {
  
    createWindow();
  
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
