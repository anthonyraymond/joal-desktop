/* eslint global-require: 1, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import MenuBuilder from './menu';
import JavaInstaller from './java/installer';
import JoalInstaller from './java/joal';
import {
  JOAL_IS_INSTALLED,
  JOAL_WILL_DOWNLOAD,
  JOAL_START_DOWNLOAD,
  JOAL_DOWNLOAD_HAS_PROGRESSED,
  JOAL_INSTALL_FAILED
} from './java/joal/joalInstallerEvents';

ipcMain.on('install-jre-if-needed', (event) => {
  const javaInstaller = new JavaInstaller(event.sender);
  javaInstaller.installIfRequired();

  const joalInstaller = new JoalInstaller();
  joalInstaller.on(JOAL_IS_INSTALLED, () => console.log(JOAL_IS_INSTALLED));
  joalInstaller.on(JOAL_WILL_DOWNLOAD, () => console.log(JOAL_WILL_DOWNLOAD));
  joalInstaller.on(JOAL_START_DOWNLOAD, (len) => console.log(JOAL_START_DOWNLOAD, len));
  joalInstaller.on(JOAL_DOWNLOAD_HAS_PROGRESSED, (bytes) => console.log(JOAL_DOWNLOAD_HAS_PROGRESSED, bytes));
  joalInstaller.on(JOAL_INSTALL_FAILED, (err) => console.log(JOAL_INSTALL_FAILED, err));
  joalInstaller.installIfNeeded();
});

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
