const { app, BrowserWindow, globalShortcut, ipcMain, systemPreferences, Tray, Menu } = require('electron')
const notifier = require('node-notifier')
const path = require('path')
const windowStateKeeper = require('electron-window-state')
require('electron-debug')({ enabled: false })

// variables
let winWidth = 440
let winHeight = 620
let mainWindow
let tray
let trayTheme
let status
let willQuitApp = false
let windowParams = {
  backgroundColor: '#131313',
  icon: path.join(__dirname, 'assets/musictube.ico'),
  title: 'Loading...'
}
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: winWidth,
    defaultHeight: winHeight
  })
  mainWindow = new BrowserWindow(Object.assign(windowParams, {
    frame: true,
    height: mainWindowState.height,
    width: mainWindowState.width,
    x: mainWindowState.x,
    y: mainWindowState.y
  }))
  mainWindow.loadURL(`https://music.youtube.com/`)
  // Close behaviour
  mainWindow.on('close', (e) => {
    mainWindowState.saveState(mainWindow)
    if (!willQuitApp) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.setMenu(null)
}

function globalShortcuts () {
  // Play,Pause
  globalShortcut.register('MediaPlayPause', mediaPlayPause)
  // Next
  globalShortcut.register('MediaNextTrack', mediaNextTrack)
  // Previous
  globalShortcut.register('MediaPreviousTrack', mediaPreviousTrack)
}

function mediaPlayPause () {
  console.info('play/pause')
  mainWindow.webContents.executeJavaScript(`document.querySelector('.play-pause-button').click()`)
}

function mediaNextTrack () {
  console.info('play next track')
  mainWindow.webContents.executeJavaScript(`document.querySelector('.next-button').click()`)
}

function mediaPreviousTrack () {
  console.info('play previous track')
  mainWindow.webContents.executeJavaScript(`document.querySelector('.previous-button').click()`)
}

function toggleQuitApp (menuItem) {
  willQuitApp = !willQuitApp
  menuItem.checked = willQuitApp
}

function trayIcon () {
  tray = new Tray(path.join(__dirname, `assets/icons/menu-standard-${trayTheme}.png`))
  tray.setToolTip('MusicTube Player')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App',
      type: 'normal',
      click: () => {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
      }
    },
    { label: 'Play/Pause', type: 'normal', click: mediaPlayPause },
    { label: 'Next', type: 'normal', click: mediaNextTrack },
    { label: 'Previous', type: 'normal', click: mediaPreviousTrack },
    { label: 'Quit App', type: 'checkbox', click: toggleQuitApp, checked: willQuitApp }
  ])
  tray.setContextMenu(contextMenu)
}

function playStatus () {
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer
        var status = (document.querySelector('.play-pause-button').title.includes('Paus')) ? 'Playing' : 'Paused'
        var title = (document.querySelector('.title.ytmusic-player-bar')) ? document.querySelector('.title.ytmusic-player-bar').innerText : ''
        var artist = (document.querySelector('.byline.ytmusic-player-bar')) ? document.querySelector('.byline.ytmusic-player-bar').innerText.split('•')[0].trim() : ''
        var object = {
          status: status,
          title: title,
          artist: artist
        }
        ipcRenderer.send('player', object)
      `)
    }
  }, 500)
}

function skipOver () {
  // YouTube Adverts - Will auto click skip button
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var skip = document.querySelector('.ytp-ad-skip-button')
        if (skip) { skip.click() }
      `)
    }
  }, 1000)
  // You Still There popup notice
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var stillThere = document.querySelector('.ytmusic-you-there-renderer .yt-button-renderer')
        if (stillThere) { stillThere.click() }
      `)
    }
  }, 1000)
}

// Application ready to run
app.on('ready', () => {
  trayTheme = 'light'
  if (isMac) {
    trayTheme = 'dark'
    if (systemPreferences.isDarkMode()) {
      trayTheme = 'light'
    }
  }
  app.setName('MusicTube Player')

  createWindow()
  globalShortcuts()
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

app.on('window-all-closed', () => {
  app.quit()
})

// Status IPC receiver
ipcMain.on('player', (event, object) => {
  if (JSON.stringify(object) !== status && object.title !== '' && object.artist !== '') {
    if (isWindows) {
      tray.displayBalloon({
        title: `${app.getName()} • ${object.status}`,
        content: `${object.title}\n${object.artist}`,
        icon: path.join(__dirname, 'assets/musictube.png')
      })
    } else {
      notifier.notify({
        title: `${app.getName()} • ${object.status}`,
        message: `${object.title}\n${object.artist}`,
        icon: path.join(__dirname, 'assets/musictube.ico')
      })
    }
  }
  status = JSON.stringify(object)
})
