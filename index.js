const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron');
const notifier = require('node-notifier');
const path = require('path');

const pjson = require('./package.json');
const axios = require('axios');

let mainWindow,
	loadingScreen,
	aboutScreen,
	releaseData,
	windowParams = {
		backgroundColor: '#131313',
		title: 'YouTube Music Desktop',
		frame: true,
		height: 700,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		width: 500,
	}

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow(Object.assign(windowParams, { show: false }));

	// Load YouTube
	mainWindow.loadURL(`https://music.youtube.com/`);

	// Default hide the mainWindow
	mainWindow.hide();

	// After mainWindow has loaded, hide loading & show main window again
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.show();
		loadingScreen.close();
	});

	// Open the DevTools.
    // mainWindow.webContents.openDevTools({mode: 'detach'});

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
	});
}

function createLoadingWindow() {
	// Create the browser window.
	loadingScreen = new BrowserWindow(Object.assign(windowParams, { parent: mainWindow }));
	// Load loading screen
	loadingScreen.loadURL('file://' + __dirname + '/loading.html');
	// if closed set loading
	loadingScreen.on('closed', () => { loadingScreen = null });
	// Show screen
    loadingScreen.webContents.on('did-finish-load', () => {
        loadingScreen.show();
	});
}

function createAboutWindow() {
	// Create the browser window.
	aboutScreen = new BrowserWindow({
		backgroundColor: '#131313',
		frame: true,
		height: 300,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
		width: 300,
	});

	// Load the about screen
	aboutScreen.loadURL('file://' + __dirname + '/about.html');

	// Print version
	aboutScreen.webContents.executeJavaScript(`document.querySelector('.js-version').textContent='v${pjson.version}';`);

	if(`v${pjson.version}` !== releaseData.tag_name) {
		// aboutScreen.webContents.executeJavaScript(`
		// 	var updateLink = document.createElement('a');
		// 	updateLink.src = releaseData.html_url;
		// 	var updateText = document.createTextNode('Download Update');
		// 	document.querySelector('.js-update').appendChild(updateLink);
		// `);
		aboutScreen.webContents.executeJavaScript(`document.querySelector('.js-update').textContent='Download Update'`);
	} else {
		aboutScreen.webContents.executeJavaScript(`document.querySelector('.js-update').textContent='Up to date'`);
	}

	// aboutScreen.webContents.openDevTools({mode: 'detach'});
}

function releaseDetails() {
	// fetch release info from github
	return axios.get('https://api.github.com/repos/simon-fraser/YouTube-Music-Desktop/releases')
	.then(result => { return result.data })
	.catch(error => { return Promise.reject(error) })
}

// Application ready to run
app.on('ready', () => {
	// Create Windows
	createLoadingWindow();
	createWindow();

	// get release details data
	releaseDetails().then(release => {
		releaseData = release[0];
	});

	// Setup Media Keys
	registerGlobalShortcuts();
	createMenu();
});

ipcMain.on('notify', function(event, obj) {
	// Notify
	notifier.notify({
		title: `${obj.status} • YouTube Music Desktop`,
		message: `${obj.title}\n${obj.by}`,
		icon: path.join(__dirname, 'assets/youtube-music.ico'),
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

function createMenu() {
	const topLevelItems = [
	  {
		label: 'Application',
		submenu: [
			{
				label: 'About YouTube Music Desktop',
				click() {
					createAboutWindow();
				}
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
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(topLevelItems));
  }