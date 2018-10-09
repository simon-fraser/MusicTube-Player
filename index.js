const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Tray } = require('electron')
const notifier = require('node-notifier')
const path = require('path')
const windowStateKeeper = require('electron-window-state')

require('electron-debug')({ enabled: false })

let winWidth = 440
let winHeight = 620
let masterWindow
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

// function createAboutWindow () {
//   aboutScreen = new BrowserWindow({
//     backgroundColor: '#131313',
//     frame: true,
//     icon: path.join(__dirname, 'assets/musictube.ico'),
//     title: 'About MusicTube Player',
//     height: 400,
//     width: 320
//   })
//   aboutScreen.loadURL(`file://${__dirname}/about.html`)
// }

function aboutModal () {
  console.log(dialog.showMessageBox(masterWindow, { title: 'About', message: 'All About the app' }))
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

function trayContextMenu () {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: app.getName()
    },
    {
      type: 'separator'
    },
    {
      label: 'About',
      click: () => aboutModal()
    },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu)
  })
}

function trayIcon () {
  tray = new Tray(path.join(__dirname, `assets/icons/menu-standard-${trayTheme}.png`))
  tray.setToolTip('MusicTube Player')
  tray.on('click', () => {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
  })
  trayContextMenu()
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
        var skip = document.querySelector('.videoAdUiSkipButton')
        if (skip) { skip.click() }
      `)
    }
  }, 500)
  // You Still There popup notice
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        var stillThere = document.querySelector('.ytmusic-you-there-renderer .yt-button-renderer')
        if (stillThere) { stillThere.click() }
      `)
    }
  }, 500)
}

// Application ready to run
app.on('ready', () => {
  trayTheme = (isMac) ? 'dark' : 'light'
  app.setName('MusicTube Player')
  let windowState = windowStateKeeper({
    defaultWidth: winWidth,
    defaultHeight: winHeight
  })

  // Master Window
  masterWindow = new BrowserWindow({
    backgroundColor: '#131313',
    height: windowState.height,
    width: windowState.width,
    x: windowState.x,
    y: windowState.y
  })
  masterWindow.loadURL(`file://${__dirname}/loading.html`)

  // Main Youtube Window
  mainWindow = new BrowserWindow(Object.assign(windowParams, {
    parent: masterWindow,
    frame: true,
    modal: true,
    show: false,
    height: windowState.height,
    width: windowState.width
  }))
  masterWindow.loadURL(`https://music.youtube.com/`)
  masterWindow.once('ready-to-show', () => {
    masterWindow.show()
  })

  masterWindow.on('close', (e) => {
    windowState.saveState(masterWindow)
    if (!willQuitApp) {
      e.preventDefault()
      masterWindow.hide()
    }
  })
  // masterWindow.on('closed', () => { masterWindow = null })
  masterWindow.setMenu(null)

  globalShortcuts()
  trayIcon()
  playStatus()
  skipOver()
})

// triggered when clicked the dock icon (osx)
app.on('activate', () => masterWindow.show())

// triggered when quitting from dock icon (osx)
app.on('before-quit', () => { willQuitApp = true })

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
  tray.setImage(path.join(__dirname, `assets/icons/menu-standard-${trayTheme}-${object.status.toLowerCase()}.png`))
})
