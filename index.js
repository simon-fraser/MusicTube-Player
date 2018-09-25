const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron')
const windowStateKeeper = require('electron-window-state')
const notifier = require('node-notifier')
const path = require('path')

// variables
let winWidth = 440
let winHeight = 620
let loadingScreen
let mainWindow
let aboutScreen
let willQuitApp = false
let windowParams = {
  backgroundColor: '#131313',
  icon: path.join(__dirname, 'assets/musictube.ico'),
  title: 'Loading...'
}

function createLoadingWindow () {
  loadingScreen = new BrowserWindow(Object.assign(windowParams, {
    frame: false,
    parent: mainWindow,
    width: winWidth,
    height: winWidth
  }))
  loadingScreen.loadURL(`file://${__dirname}/loading.html`)
  loadingScreen.on('closed', () => { loadingScreen = null })
  // Show loader
  loadingScreen.webContents.on('did-finish-load', () => {
    loadingScreen.show()
  })
}

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: winWidth,
    defaultHeight: winHeight
  })

  mainWindow = new BrowserWindow(Object.assign(windowParams, {
    frame: true,
    height: mainWindowState.height,
    show: false,
    width: mainWindowState.width,
    x: mainWindowState.x,
    y: mainWindowState.y
  }))
  mainWindow.loadURL(`https://music.youtube.com/`)
  mainWindow.hide()
  // Show main window and hide loader
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindowState.manage(mainWindow)
    mainWindow.show()
    if (loadingScreen !== null) loadingScreen.close()
  })
  // Close behaviour
  mainWindow.on('close', (e) => {
    mainWindowState.saveState(mainWindow)
    if (!willQuitApp) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

function createAboutWindow () {
  aboutScreen = new BrowserWindow({
    backgroundColor: '#131313',
    frame: true,
    icon: path.join(__dirname, 'assets/musictube.ico'),
    title: 'About MusicTube Player',
    height: 400,
    width: 320
  })
  aboutScreen.loadURL(`file://${__dirname}/about.html`)
}

// Application ready to run
app.on('ready', () => {
  createLoadingWindow()
  createWindow()
  globalShortcuts()
  createMenu()
  skipOverAdverts()
})

// triggered when clicked the dock icon (osx)
app.on('activate', () => {
  mainWindow.show()
})

// triggered when quitting from dock icon (osx)
app.on('before-quit', () => {
  willQuitApp = true
})

// Notification message process
ipcMain.on('notify', (event, obj) => {
  notifier.notify({
    title: `${obj.status} • MusicTube Player`,
    message: `${obj.title}\n${obj.by}`,
    icon: path.join(__dirname, 'assets/musictube.ico')
  })
})

function globalShortcuts () {
  // Play,Pause
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('play-pause-button')[0].click()`)
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer
        var status = (document.getElementsByClassName('play-pause-button')[0].title.includes('Pla'))? 'Paused' : 'Playing'
        var value = {
          status: status,
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value)
      `)
    }, 500)
  })
  // Next
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('next-button')[0].click()`)
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer
        var value = {
          status: "Now Playing",
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value)
      `)
    }, 500)
  })
  // Previous
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('previous-button')[0].click()`)
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer
        var value = {
          status: "Now Playing",
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value)
      `)
    }, 500)
  })
}

function skipOverAdverts () {
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var skip = document.getElementsByClassName('videoAdUiSkipButton')[0]
        if(typeof skip !== "undefined") { skip.click() }
      `)
    }
  }, 500)
}

function createMenu () {
  Menu.setApplicationMenu(Menu.buildFromTemplate(
    [{
      label: 'Application',
      submenu: [
        {
          label: 'About',
          accelerator: 'CmdOrCtrl+I',
          click () {
            createAboutWindow()
          }
        },
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          role: 'forceReload'
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click () {
            createLoadingWindow()
            createWindow()
          }
        },
        {
          label: 'Show Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          role: 'toggleDevTools'
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click () {
            willQuitApp = true
            app.quit()
          }
        }
      ]
    }]
  ))
}
