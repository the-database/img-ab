const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const process = require('process');

const screenshotsPath = path.join(require('os').homedir(), "Pictures/img-ab");

// run this as early in the main process as possible
if (require('electron-squirrel-startup')) app.quit();

if (!fs.existsSync(screenshotsPath)){
  fs.mkdirSync(screenshotsPath);
}

let win = null;

let folderMode = false;
let fileMode = false;
let folderList = [];
let fileListPerFolder = {};
let currentIndex = 0;
let lastIndex = 0;
let newCaptureDir = null;

function currentDateTimeString() {
  function pad2(n) {  // always returns a string
      return (n < 10 ? '0' : '') + n;
  }

  const now = new Date();

  return now.getFullYear() +
          pad2(now.getMonth() + 1) + 
          pad2(now.getDate()) +
          pad2(now.getHours()) +
          pad2(now.getMinutes()) +
          pad2(now.getSeconds());
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.cwd(), "src/assets/logo"),
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
    case "ArrowUp":
      if (folderMode) {
        if (currentIndex > 0) {
          currentIndex--;
        }
        win.webContents.send('send-args-replace', getCurrentFilesForFolderMode());
      }
      break;
    case "PageDown":
    case "ArrowDown":
      if (folderMode) {
        if (currentIndex < lastIndex) {
          currentIndex++;
        }
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
        if (/\.(jpeg|jpg|png|webp|gif)$/.test(dirent.name)) {
          console.log(path.resolve(p, dirent.name));
          fileListPerFolder[p].push(path.resolve(p, dirent.name));
        }
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

app.commandLine.appendSwitch('force-color-profile', 'srgb');

// main
ipcMain.on('show-context-menu', (event, state) => {
  console.log('state', state);

  const template = [
    {
      label: 'Show Info (I)',
      type: 'checkbox',
      checked: state.showInfo,
      click: () => { event.sender.send('context-menu-command', 'show-info') }
    },
    {
      label: 'Show Help (H)',
      type: 'checkbox',
      checked: state.showHelp,
      click: () => { event.sender.send('context-menu-command', 'show-help') }
    },
    { type: 'separator' },
    {
      label: 'Zoom In (W)',
      click: () => { event.sender.send('context-menu-command', 'zoom-out') }
    },
    {
      label: 'Zoom In (E)',
      click: () => { event.sender.send('context-menu-command', 'zoom-in') }
    },
    {
      label: '100% Zoom (Q)',
      type: 'checkbox',
      checked: false,
      click: () => { event.sender.send('context-menu-command', 'mode-100-zoom') }
    },
    {
      label: 'Fit to Screen Width (R)',
      type: 'checkbox',
      checked: state.modeFitToWidth,
      click: () => { event.sender.send('context-menu-command', 'mode-fit-to-width') }
    },
    {
      label: 'Fit to Screen Height (T)',
      type: 'checkbox',
      checked: state.modeFitToHeight,
      click: () => { event.sender.send('context-menu-command', 'mode-fit-to-height') }
    },
    {
      label: 'Smooth Sampling (Y)',
      type: 'checkbox',
      checked: !state.nearestNeighborSampling,
      click: () => { event.sender.send('context-menu-command', 'nearest-neighbor-sampling') }
    },
    { type: 'separator' },
    {
      label: 'Take Screen Capture of All Images (S)',
      click: () => {
        startScreenCapture(event);
      }
    },
    { type: 'separator' },
  ];

  state?.allImages?.forEach((image, index) => {
    template.push({
      label: `${index+1}: ${image}`,
      type: 'checkbox',
      checked: index === state.selectedImageIndex,
      click: () => { event.sender.send('context-menu-command', 'select-image', {index: index}) }
    });
  });

  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

function startScreenCapture(event) {
  newCaptureDir = `capture-${currentDateTimeString()}`;
  fs.mkdirSync(path.join(screenshotsPath, newCaptureDir));
  event.sender.send('context-menu-command', 'select-image', {index: 0, forScreenshot: true});
}

ipcMain.on('start-screen-capture', (event, state) => {
  startScreenCapture(event);
})

ipcMain.on('selected-image-for-screenshot', async (event, state) => {
  const image = state.allImages[state.selectedImageIndex];
  console.log("save image", path.basename(image));

  win.webContents
  .capturePage()
  .then((img) => {
    
    fs.writeFile(path.join(screenshotsPath, newCaptureDir, `${state.selectedImageIndex+1}_${path.basename(image)}`),
    img.toPNG(), "base64", function (err) {
      if (err) throw err;
    });
    
    if (state.selectedImageIndex < state.allImages.length - 1) {
      event.sender.send('context-menu-command', 'select-image', {index: state.selectedImageIndex + 1, forScreenshot: true});
    }
  })
  .catch((err) => {
      console.log(err);
  });

});