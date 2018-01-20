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
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import waitOn from 'wait-on';
import log from 'electron-log';
import treeKill from 'tree-kill';
import { autoUpdater } from 'electron-updater';
import os from 'os';
import MenuBuilder from './menu';
import Jre from './java/jre';
import Joal from './java/joal';
import {
  EVENT_ELECTRON_UPDATER_CHECK_FOR_UPDATE,
  EVENT_ELECTRON_UPDATER_INSTALLED,
  EVENT_ELECTRON_UPDATER_DOWNLOAD_HAS_PROGRESSED,
  EVENT_ELECTRON_UPDATER_INSTALL_FAILED
} from './java/electronUpdater/electronUpdaterEvents';
import {
  EVENT_JRE_CHECK_FOR_UPDATES,
  EVENT_JRE_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JRE_INSTALLED,
  EVENT_JRE_INSTALL_FAILED
} from './java/jre/jreInstallerEvent';
import {
  EVENT_JOAL_CHECK_FOR_UPDATES,
  EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JOAL_INSTALLED,
  EVENT_JOAL_INSTALL_FAILED
} from './java/joal/joalInstallerEvents';

let mainWindow = null;

// prevent multiple instances
const amIASecondInstance = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
if (amIASecondInstance) {
  app.quit();
  // return;
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

// Allow console whatsoever
require('electron-debug')();

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
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
 * auto updater
 */
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const uuidv4 = () => (
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; // eslint-disable-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3 | 0x8); // eslint-disable-line no-mixed-operators, no-bitwise
    return v.toString(16);
  })
);

const jre = new Jre(app);
const joal = new Joal(app);
let restartForUpdate = false;
let isJoalAndJreInstallFinish = false;
let joalProcess;

ipcMain.removeAllListeners('renderer-ready');
ipcMain.on('renderer-ready', (event) => {
  autoUpdater.removeAllListeners('checking-for-update');
  autoUpdater.removeAllListeners('update-available');
  autoUpdater.removeAllListeners('update-not-available');
  autoUpdater.removeAllListeners('error');
  autoUpdater.removeAllListeners('download-progres');
  autoUpdater.removeAllListeners('update-downloaded');
  autoUpdater.on('checking-for-update', () => event.sender.send(EVENT_ELECTRON_UPDATER_CHECK_FOR_UPDATE));
  autoUpdater.on('update-available', () => {});
  autoUpdater.on('update-not-available', () => { event.sender.send(EVENT_ELECTRON_UPDATER_INSTALLED); installJoalAndJre(event); }); // eslint-disable-line max-len
  autoUpdater.on('error', (err) => {
    const error = err.message === undefined ? 'Error while checking for app updates.' : err.message;
    event.sender.send(EVENT_ELECTRON_UPDATER_INSTALL_FAILED, error); console.log(err); installJoalAndJre(event); // eslint-disable-line max-len
  });
  autoUpdater.on('download-progress', (progressObj) => event.sender.send(EVENT_ELECTRON_UPDATER_DOWNLOAD_HAS_PROGRESSED, progressObj)); // eslint-disable-line max-len
  autoUpdater.on('update-downloaded', () => { restartForUpdate = true; autoUpdater.quitAndInstall(); });

  const platform = os.platform();
  if (platform === 'darwin') {
    autoUpdater.emit('error', { message: 'Auto-updates are available only for Windows and Linux, please manually check updates at https://github.com/anthonyraymond/joal-desktop/releases' });
  } else {
    autoUpdater.checkForUpdates();
  }
});

const installJoalAndJre = (event) => {
  const errorPrefix = 'An error has occured. Please email me at joal.contact@gmail.com and describe what you were doing, also include the following error message:';
  jre.on(EVENT_JRE_CHECK_FOR_UPDATES, () => event.sender.send(EVENT_JRE_CHECK_FOR_UPDATES));
  jre.on(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, (bytes, totalSize) => event.sender.send(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, bytes, totalSize)); // eslint-disable-line max-len
  jre.on(EVENT_JRE_INSTALLED, () => event.sender.send(EVENT_JRE_INSTALLED));
  jre.on(EVENT_JRE_INSTALL_FAILED, (err) => event.sender.send(EVENT_JRE_INSTALL_FAILED, `${errorPrefix} ${err}`));

  joal.on(EVENT_JOAL_CHECK_FOR_UPDATES, () => event.sender.send(EVENT_JOAL_CHECK_FOR_UPDATES));
  joal.on(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, (bytes, totalSize) => event.sender.send(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, bytes, totalSize)); // eslint-disable-line max-len
  joal.on(EVENT_JOAL_INSTALLED, () => event.sender.send(EVENT_JOAL_INSTALLED));
  joal.on(EVENT_JOAL_INSTALL_FAILED, (err) => event.sender.send(EVENT_JOAL_INSTALL_FAILED, `${errorPrefix} ${err}`));

  Promise.all([
    jre.installIfRequired(),
    joal.installIfNeeded()
  ])
    .then(() => { // eslint-disable-line promise/always-return
      isJoalAndJreInstallFinish = true;
      const uiConfig = {
        host: 'localhost',
        port: '5081',
        pathPrefix: uuidv4(),
        secretToken: uuidv4()
      };
      startJoal(uiConfig);
    })
    .catch((err) => {
      isJoalAndJreInstallFinish = true;
      console.error('Failed to install dependencies...', err);
    });
};

const startJoal = (uiConfig) => {
  if (joalProcess) { joalProcess.kill('SIGINT'); }
  joalProcess = new Jre(app).spawn([
    '-jar',
    `${app.getPath('userData')}/joal-core/${joal.getJoalJarName()}`,
    `--joal-conf=${app.getPath('userData')}/joal-core/`,
    '--spring.main.web-environment=true',
    `--server.port=${uiConfig.port}`,
    `--joal.ui.path.prefix=${uiConfig.pathPrefix}`,
    `--joal.ui.secret-token=${uiConfig.secretToken}`,
    '--server.address=localhost'
  ]);
  joalProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  joalProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  // TODO: ensure this is not called on each web query afterward
  // set the localtorage configuration before dom render
  mainWindow.webContents.on('did-get-response-details', () => {
    mainWindow.webContents.executeJavaScript(`localStorage.setItem('guiConfig', '${JSON.stringify(uiConfig)}')`);
  });
  const uiUrl = `http://${uiConfig.host}:${uiConfig.port}/${uiConfig.pathPrefix}/ui`;
  waitOn({
    resources: [
      uiUrl
    ],
    delay: 1000, // initial delay in ms, default 0
    interval: 100, // poll interval in ms, default 250ms
    timeout: 60000, // timeout in ms, default Infinity
    window: 200
  }, (err) => {
    if (err) {
      console.error('Joal seems not to be started, we have failed to reach ui url.', err);
      return;
    }
    mainWindow.loadURL(uiUrl);
  });
};


/**
 * Add event listeners...
 */
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

  const killJoalAndQuit = () => {
    if (joalProcess) {
      treeKill(joalProcess.pid, 'SIGINT', (err) => {
        if (err) {
          treeKill(joalProcess.pid, 'SIGKILL');
        }
        app.quit();
      });
    } else {
      app.quit();
    }
  };

  // Prevent Closing when download is running
  mainWindow.on('close', (e) => {
    if (!isJoalAndJreInstallFinish && !restartForUpdate) {
      const pressedButton = dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Wait !',
        message: 'Dependency download in progress ! Closing now might result in a corrupted application. Are you sure you want to quit now?',
        buttons: ['&Yes', '&Cancel'],
        defaultId: 1,
        cancelId: 1,
        normalizeAccessKeys: true
      });
      if (pressedButton === 1) {
        e.preventDefault();
        return;
      }
    }
    killJoalAndQuit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
