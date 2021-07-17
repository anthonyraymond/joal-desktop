/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
import { app, ipcMain } from 'electron';
import WindowManager from './electron/WindowManager';
import { log } from './electron/util';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

let windowManager;

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', () => {
    // someone tried to run a second instance, we should focus our window
    if (windowManager !== undefined) {
      windowManager.focusFirstWindow();
    }
    return true;
  });

  require('electron-debug')({ devToolsMode: 'bottom' });

  app.on('ready', async () => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      await installExtensions();
    }
    ipcMain.on('log.error', (event, arg) => {
      log(arg);
    });

    windowManager = new WindowManager(`file://${__dirname}/app.html`); // pass down default URI
    windowManager.openWindow();
  });
} else {
  app.quit();
}
