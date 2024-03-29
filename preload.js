const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ipcRenderer', {
  handleArgsReplace: (callback) => ipcRenderer.on('send-args-replace', callback),
  handleArgsAppend: (callback) => ipcRenderer.on('send-args-append', callback),
  handleDragAndDrop: (pathArr) => ipcRenderer.send('drag-and-drop', pathArr),
  handleContextMenu: (state) => ipcRenderer.send('show-context-menu', state),
  handleContextMenuCommand: (command, args) => ipcRenderer.on('context-menu-command', command, args),
  handleSelectedImageForScreenshot: (args) => ipcRenderer.send('selected-image-for-screenshot', args),
  handleSelectedImageForScreenshotSlider: (args) => ipcRenderer.send('selected-image-for-screenshot-slider', args),
  handleStartScreenCapture: () => ipcRenderer.send('start-screen-capture')
})

