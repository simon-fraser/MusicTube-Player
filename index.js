const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const notifier = require('node-notifier');
const path = require('path');

let mainWindow;

app.on('ready', () => {
	// Build Main Window
	mainWindow = new BrowserWindow({
		frame: true,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		titleBarStyle: 'hidden-inset',
		height: 700,
		width: 500,
	})
	// Load YouTube
	mainWindow.loadURL('https://music.youtube.com/')

	// Setup Media Keys
	registerGlobalShortcuts()
});

ipcMain.on('notify', function(event, obj) {
	// Notify
	notifier.notify({
		title: `${obj.status} • YouTube Music`,
		message: `${obj.title}\n${obj.by}`,
		icon: path.join(__dirname, 'assets/youtube-music.ico')
	})
});

function registerGlobalShortcuts() {
	// Play/Pause
	globalShortcut.register('MediaPlayPause', () => {
		// Trigger Play/Pause
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('play-pause-button')[0].click()`)

		setTimeout(() =>{
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
		// Trigger Next
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('next-button')[0].click()`)

		setTimeout(() =>{
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
		// Trigger Previous
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('previous-button')[0].click()`)

		setTimeout(() =>{
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