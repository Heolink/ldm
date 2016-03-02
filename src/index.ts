/// <reference path='../typings/main.d.ts' />
const app = require('electron').app;  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
import fs = require('fs');
const dialog = require('electron').dialog;

var ldm = require('./ldm');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var loadingWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

var startApp = function()
{
	if (process.platform == 'darwin') {
		loadingWindow.destroy();
	}
    
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 500,
        minHeight: 200,
        acceptFirstMouse: true,
        titleBarStyle: 'hidden',
    });

    if (process.platform != 'darwin') {
		loadingWindow.destroy();
	}

    mainWindow.loadURL('file://' + __dirname + '/views/index.html');

    // Open the DevTools.
    if(process.env.DEV) {
        mainWindow.openDevTools();
    }



    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {

    loadingWindow = new BrowserWindow({
        width: 600,
        height: 200,
        titleBarStyle: 'hidden',
        frame: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
    });

    loadingWindow.loadURL('file://' + __dirname + '/views/loader.html');

    ldm.download().then((d)=>{
        ldm.parse().then((datas)=>{
            ldm.populate(datas).then(()=>{                
                startApp();
            })
        });
    }).fail((d)=>{
        fs.stat(ldm.xmlFileLocal, function(err, stats){
            if( err ) {
                dialog.showMessageBox(loadingWindow, {
                    type: 'error',
                    buttons: ['ok'],
                    message: 'Impossible de récupérer les informations distante, ressayer plus tard.'
                }, function(d){
                    loadingWindow.destroy();
                    app.quit();
                });
            } else {
                loadingWindow.destroy();
                startApp();
            }
        })
    });



});
