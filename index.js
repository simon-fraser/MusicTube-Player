const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron');
const notifier = require('node-notifier');
const path = require('path');

// For heavy debugging
// require('electron-debug')();

// Vars
let winWidth = 440,
	winHeight = 620,
	mainWindow,
	loadingScreen,
	aboutScreen,
	windowParams = {
		backgroundColor: '#131313',
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		title: 'YouTube Music Desktop',
		height: winHeight,
		width: winWidth
	};

function createLoadingWindow() {

	loadingScreen = new BrowserWindow(Object.assign(windowParams, { parent: mainWindow }));
	loadingScreen.loadURL('file://' + __dirname + '/loading.html');
	loadingScreen.on('closed', () => { loadingScreen = null });

	loadingScreen.webContents.on('did-finish-load', () => {
		loadingScreen.show();
	});
}

function createWindow() {

	mainWindow = new BrowserWindow(Object.assign(windowParams, { show: false }));
	mainWindow.loadURL(`https://music.youtube.com/`);
	mainWindow.hide();

	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.show();
		if(loadingScreen !== null) loadingScreen.close();
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function() { mainWindow = null });
}

function createAboutWindow() {

	aboutScreen = new BrowserWindow({
		backgroundColor: '#131313',
		title: 'YouTube Music Desktop',
		frame: true,
		height: 400,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		width: 320,
	});
	aboutScreen.loadURL('file://' + __dirname + '/about.html');
}

// Application ready to run
app.on('ready', () => {

	// Window position calculation, needs to be ran inside app ready
	const { screen } = require('electron');
    const display = screen.getPrimaryDisplay().workArea;
    if(display.width) {
		windowParams.x = (display.width - winWidth) // to the right
		windowParams.y = (((display.height + display.y) / 2) - (winHeight / 2)) // vertical center
	}

	// Run
	createLoadingWindow();
	createWindow();
	globalShortcuts();
	createMenu();
})

// Notification message process
ipcMain.on('notify', function(event, obj) {

	notifier.notify({
		title: `${obj.status} • YouTube Music Desktop`,
		message: `${obj.title}\n${obj.by}`,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
	})
})

function globalShortcuts() {

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

function createMenu() {

	Menu.setApplicationMenu(
		Menu.buildFromTemplate(
			[
				{
				  label: 'Application',
				  submenu: [
					{
						label: 'About',
						accelerator: 'CmdOrCtrl+I',
						click() {
							createAboutWindow();
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
						click() {
							app.quit();
						}
					}
				  ]
				}
			]
		)
	)
}
