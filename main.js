const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const process = require('process');

let win = null;

let folderMode = false;
let fileMode = false;
let folderList = [];
let fileListPerFolder = {};
let currentIndex = 0;
let lastIndex = 0;

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

  ipcMain.on('drag-and-drop', (event, pathArr) => {
    sendArgs(pathArr);
  });

  win.loadFile("dist/index.html");

  win.webContents.on('did-finish-load', function () {
    sendArgs(process.argv.slice(1));
  });

  win.webContents.on("input-event", (event, input) => {
    if (input.type === 'rawKeyDown') {
      handleChangePage(input);
    }
  });
}

function getCurrentFilesForFolderMode() {
  const result = [];

  folderList.forEach(p => {
    const file = fileListPerFolder[p][currentIndex];
    if (file) {
      result.push(file);
    }
  });

  return result;
}

function handleChangePage(input) {
  switch (input.key) {
    case "Home":
      if (folderMode) {
        currentIndex = 0;
        win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());
      }
      break;
    case "PageUp":
      if (folderMode) {
        currentIndex--;
        win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());
      }
      break;
    case "PageDown":
      if (folderMode) {
        currentIndex++;
        win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());
      }
      break;
    case "End":
      if (folderMode) {
        currentIndex = lastIndex;
        win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());
      }
      break;
    case "Escape":
    case "x":
      win.close();
      break;
  }
}

function sendArgs(pathArr) {
  folderMode = false;
  fileMode = false;

  if (pathArr?.length > 0) {
    folderMode = true;
    fileMode = true;
  }

  pathArr?.forEach((p) => {
    var isFolder = fs.existsSync(pathArr[0]) && fs.lstatSync(pathArr[0]).isDirectory();
    console.log('folder?', p, isFolder);
    folderMode = folderMode && isFolder;
    fileMode = fileMode && !isFolder;
  });

  console.log('folderMode', folderMode);
  
  // populate folders and files per folder
  if (folderMode) {
    folderList = [...folderList, ...pathArr];

    fileListPerFolder = {};

    folderList.forEach(p => {
      const dir = fs.opendirSync(p);
      fileListPerFolder[p] = [];
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        console.log(path.resolve(p, dirent.name));
        fileListPerFolder[p].push(path.resolve(p, dirent.name));
      }
      dir.closeSync();
      if (fileListPerFolder[p].length - 1 > lastIndex) {
        lastIndex = fileListPerFolder[p].length - 1;
      }
    });

    win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());

  } else if (fileMode) {
    win.webContents.send('send-args-append', pathArr);
  } else {
    // invalid
  }
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
      sendArgs(additionalData);
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