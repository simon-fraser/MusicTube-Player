const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron')
const notifier = require('node-notifier')
const path = require('path')

// For heavy debugging
// require('electron-debug')();

// Vars
let winWidth = 440
let winHeight = 620
let loadingScreen
let mainWindow
let aboutScreen
let windowParams = {
  backgroundColor: '#131313',
  icon: path.join(__dirname, 'assets/musictube.ico'),
  title: 'MusicTube Player',
  height: winHeight,
  width: winWidth
}

function createLoadingWindow () {
  loadingScreen = new BrowserWindow(Object.assign(windowParams, { parent: mainWindow }))
  loadingScreen.loadURL(`file://${__dirname}/loading.html`)
  loadingScreen.on('closed', () => { loadingScreen = null })
  // Show loader
  loadingScreen.webContents.on('did-finish-load', () => {
    loadingScreen.show()
  })
}

function createWindow () {
  mainWindow = new BrowserWindow(Object.assign(windowParams, { show: false }))
  mainWindow.loadURL(`https://music.youtube.com/`)
  mainWindow.hide()
  // Show main window and hide loader
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show()
    mainWindow.setTitle(windowParams.title)
    if (loadingScreen !== null) loadingScreen.close()
  })
  // Emitted when the window is closed.
  mainWindow.on('closed', function () { mainWindow = null })
}

function createAboutWindow () {
  aboutScreen = new BrowserWindow({
    backgroundColor: '#131313',
    frame: true,
    icon: path.join(__dirname, 'assets/musictube.ico'),
    title: 'MusicTube Player',
    height: 400,
    width: 320
  })
  aboutScreen.loadURL(`file://${__dirname}/about.html`)
}

// Application ready to run
app.on('ready', () => {
  // Window position calculation, needs to be ran inside app ready
  const { screen } = require('electron')
  const display = screen.getPrimaryDisplay().workArea
  if (display.width) {
    windowParams.x = Math.round(display.width - winWidth) // to the right
    windowParams.y = Math.round(((display.height + display.y) / 2) - (winHeight / 2)) // vertical center
  }

  // Run
  createLoadingWindow()
  createWindow()
  globalShortcuts()
  createMenu()
  skipOverAdverts()
})

// Notification message process
ipcMain.on('notify', function (event, obj) {
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
        var ipcRenderer = require('electron').ipcRenderer;
        var status = (document.getElementsByClassName('play-pause-button')[0].title.includes('Pla'))? 'Paused' : 'Playing';
        var value = {
          status: status,
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value);
      `)
    }, 500)
  })
  // Next
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('next-button')[0].click()`)
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer;
        var value = {
          status: "Now Playing",
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value);
      `)
    }, 500)
  })
  // Previous
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('previous-button')[0].click()`)
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        var ipcRenderer = require('electron').ipcRenderer;
        var value = {
          status: "Now Playing",
          title: document.getElementsByClassName('ytmusic-player-bar title')[0].innerText,
          by: document.getElementsByClassName('ytmusic-player-bar byline')[0].innerText,
        }
        ipcRenderer.send('notify', value);
      `)
    }, 500)
  })
}

function skipOverAdverts () {
  setInterval(() => {
    mainWindow.webContents.executeJavaScript(`
      var skip = document.getElementsByClassName('videoAdUiSkipButton')[0];
      if(typeof skip !== "undefined") { skip.click() }
    `)
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
          label: 'Reload',
          accelerator: 'Cmd+R',
          role: 'forceReload'
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
            app.quit()
          }
        }
      ]
    }]
  ))
}
