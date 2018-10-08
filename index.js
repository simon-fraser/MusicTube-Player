const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray } = require('electron')
const windowStateKeeper = require('electron-window-state')
const notifier = require('node-notifier')
const path = require('path')

// variables
let winWidth = 440
let winHeight = 620
let loadingScreen
let mainWindow
let aboutScreen
let tray
let status
let willQuitApp = false
let windowParams = {
  backgroundColor: '#131313',
  icon: path.join(__dirname, 'assets/musictube.ico'),
  title: 'Loading...'
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

function createLoadingWindow () {
  loadingScreen = new BrowserWindow(Object.assign(windowParams, {
    frame: false,
    parent: mainWindow,
    width: winWidth,
    height: winWidth
  }))
  loadingScreen.loadURL(`file://${__dirname}/loading.html`)
  loadingScreen.on('closed', () => { loadingScreen = null })
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

function globalShortcuts () {
  // Play,Pause
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.executeJavaScript(`document.querySelector('.play-pause-button').click()`)
  })
  // Next
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.querySelector('.next-button').click()`)
  })
  // Previous
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.querySelector('.previous-button').click()`)
  })
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

function trayIcon () {
  tray = new Tray(path.join(__dirname, 'assets/icons/menu-standard.png'))
  tray.setToolTip('MusicTube Player')
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
}

function playStatus () {
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer
        var status = (document.querySelector('.play-pause-button').title === 'Pause')? 'Playing' : 'Paused'
        var title = (document.querySelector('.title.ytmusic-player-bar')) ? document.querySelector('.title.ytmusic-player-bar').innerText : ''
        var artist = (document.querySelector('.byline.ytmusic-player-bar')) ? document.querySelector('.byline.ytmusic-player-bar').innerText : ''
        var object = {
          status: status,
          title: title,
          artist: artist
        }
        ipcRenderer.send('player', object)
      `)
    }
  }, 250)
}

function skipOver () {
  // YouTube Adverts - Will auto click skip button
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var skip = document.querySelector('.videoAdUiSkipButton')
        if (skip) { skip.click() }
      `)
    }
  }, 250)
  // You Still There popup notice
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var stillThere = document.querySelector('.ytmusic-you-there-renderer .yt-button-renderer')
        if (stillThere) { stillThere.click() }
      `)
    }
  }, 250)
}

// Application ready to run
app.on('ready', () => {
  createLoadingWindow()
  createWindow()
  globalShortcuts()
  createMenu()
  trayIcon()
  playStatus()
  skipOver()
})

// triggered when clicked the dock icon (osx)
app.on('activate', () => {
  mainWindow.show()
})

// triggered when quitting from dock icon (osx)
app.on('before-quit', () => {
  willQuitApp = true
})

// Status IPC receiver
ipcMain.on('player', (event, object) => {
  if (JSON.stringify(object) !== status && object.title !== '' && object.artist !== '') {
    notifier.notify({
      title: `${object.status} • MusicTube Player`,
      message: `${object.title}\n${object.artist}`,
      icon: path.join(__dirname, 'assets/musictube.ico')
    })
  }
  status = JSON.stringify(object)
  tray.setImage(path.join(__dirname, `assets/icons/menu-standard-${object.status.toLowerCase()}.png`))
})
