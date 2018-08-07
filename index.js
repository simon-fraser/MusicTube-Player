const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		frame: true,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		titleBarStyle: 'hidden-inset',
		height: 700,
		width: 500,
	})
	mainWindow.loadURL('https://music.youtube.com')

	// Setup Media Keys
	registerGlobalShortcuts()
});

function registerGlobalShortcuts() {
	// Play/Pause
	globalShortcut.register('MediaPlayPause', () => {
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('play-pause-button')[0].click()`)
	})

	// Next
	globalShortcut.register('MediaNextTrack', () => {
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('next-button')[0].click()`)
	})

	// Previous
	globalShortcut.register('MediaPreviousTrack', () => {
		mainWindow.webContents.executeJavaScript(`document.getElementsByClassName('previous-button')[0].click()`)
	})
}