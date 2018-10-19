const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, shell, Tray } = require('electron')
const axios = require('axios')
const notifier = require('node-notifier')
const path = require('path')
const windowStateKeeper = require('electron-window-state')

require('electron-debug')({ enabled: false })

let winWidth = 440
let winHeight = 620
let windowState
let about
let main
let loading
let tray
let trayTheme
let status
let willQuit = false
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

function aboutModal () {
  // About window
  about = new BrowserWindow({
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

// Tray/System bar icon click menu
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

// Tray/system bar icon
function trayIcon () {
  tray = new Tray(path.join(__dirname, `assets/icons/menu-standard-${trayTheme}.png`))
  tray.setToolTip('MusicTube Player')
  tray.on('click', () => {
    if (main.isMinimized()) main.restore()
    main.show()
  })
  trayContextMenu()
}

// Get the player status
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

function checkVersion () {
  let localTag = app.getVersion()
  let remoteTag = 0
  // Fetch
  axios.get('https://api.github.com/repos/simon-fraser/MusicTube-Player/releases/latest')
    .then(response => {
      if (response.status === 200) {
        try {
          remoteTag = response.data.tag_name
        } catch (error) { console.log('Update: return error', error) }
      }
    }).catch(error => console.log('Update: fetch error', error))
    .then(() => {
      if (localTag !== remoteTag) {
        dialog.showMessageBox(main, {
          title: 'Update Available',
          message: 'An update is available, Do you want to download it now?.',
          buttons: ['Cancel', 'Download'],
          defaultId: 1
        }, (buttonIndex) => {
          if (buttonIndex === 1) shell.openExternal('https://github.com/simon-fraser/MusicTube-Player/releases')
        })
      }
    })
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
  // Main YouTube window
  main = new BrowserWindow(Object.assign(sharedWindowParams, { show: false }))
  main.loadURL(`https://music.youtube.com/`)

  // Loading window
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

  // Ready to show YouTube
  main.once('ready-to-show', () => {
    main.show()
    loading.hide()

    playStatus()
    skipOver()
    checkVersion()
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
