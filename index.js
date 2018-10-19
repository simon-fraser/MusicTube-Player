const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Tray } = require('electron')
const notifier = require('node-notifier')
const path = require('path')
const windowStateKeeper = require('electron-window-state')

require('electron-debug')({ enabled: false })

let winWidth = 440
let winHeight = 620
let windowState
let main
let loading
let tray
let trayTheme
let status
let willQuit = false
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

function aboutModal () {
  let about = new BrowserWindow({
    alwaysOnTop: true,
    backgroundColor: '#131313',
    frame: false,
    parent: main,
    show: true,
    width: 300,
    height: 400,
    x: (windowState.x + 50),
    y: (windowState.y + 70)
  })
  about.loadURL(`file://${__dirname}/about.html`)
}

function globalShortcuts () {
  // Play,Pause
  globalShortcut.register('MediaPlayPause', () => {
    main.webContents.executeJavaScript(`document.querySelector('.play-pause-button').click()`)
  })
  // Next
  globalShortcut.register('MediaNextTrack', () => {
    main.webContents.executeJavaScript(`document.querySelector('.next-button').click()`)
  })
  // Previous
  globalShortcut.register('MediaPreviousTrack', () => {
    main.webContents.executeJavaScript(`document.querySelector('.previous-button').click()`)
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
    if (main.isMinimized()) main.restore()
    main.show()
  })
  trayContextMenu()
}

function playStatus () {
  setInterval(() => {
    if (main) {
      main.webContents.executeJavaScript(`
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
    if (main) {
      main.webContents.executeJavaScript(`
        var skip = document.querySelector('.videoAdUiSkipButton')
        if (skip) { skip.click() }
      `)
    }
  }, 500)
  // You Still There popup notice
  setInterval(() => {
    if (main) {
      main.webContents.executeJavaScript(`
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
  windowState = windowStateKeeper({ defaultWidth: winWidth, defaultHeight: winHeight })
  let sharedWindowParams = {
    backgroundColor: '#131313',
    icon: path.join(__dirname, 'assets/musictube.ico'),
    title: 'Loading...',
    height: windowState.height,
    width: windowState.width,
    x: windowState.x,
    y: windowState.y
  }

  main = new BrowserWindow(Object.assign(sharedWindowParams, { show: false }))
  main.loadURL(`https://music.youtube.com/`)

  loading = new BrowserWindow(Object.assign(sharedWindowParams, {
    frame: false,
    parent: main,
    height: windowState.height,
    width: windowState.width
  }))
  loading.loadURL(`file://${__dirname}/loading.html`)
  loading.on('closed', () => { loading = null })
  loading.webContents.on('did-finish-load', () => {
    loading.show()
  })

  main.once('ready-to-show', () => {
    main.show()
    loading.hide()
  })
  main.on('close', (e) => {
    if (!willQuit) {
      e.preventDefault()
      main.hide()
    }
  })
  main.setMenu(null)

  globalShortcuts()
  trayIcon()
  playStatus()
  skipOver()
})

// triggered when clicked the dock icon (osx)
app.on('activate', () => { main.show() })

// triggered when quitting from dock icon (osx)
app.on('before-quit', () => { willQuit = true })

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
