const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ipcRenderer', {
  handleArgsReplace: (callback) => ipcRenderer.on('send-args-replace', callback),
  handleArgsAppend: (callback) => ipcRenderer.on('send-args-append', callback),
  handleDragAndDrop: (pathArr) => ipcRenderer.send('drag-and-drop', pathArr)
})

