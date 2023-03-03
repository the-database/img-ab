const { app, BrowserWindow } = require("electron");
const path = require("path");
const process = require('process');

function createWindow() {
  const win = new BrowserWindow({
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

app.whenReady().then(() => {
  
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
