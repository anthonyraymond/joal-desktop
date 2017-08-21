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
import waitForUrl from 'wait-for-url';
import MenuBuilder from './menu';
import Jre from './java/jre';
import Joal from './java/joal';
import {
  EVENT_JRE_INSTALLED,
  EVENT_JRE_WILL_DOWNLOAD,
  EVENT_JRE_DOWNLOAD_STARTED,
  EVENT_JRE_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JRE_INSTALL_FAILED
} from './java/jre/jreInstallerEvent';
import {
  EVENT_JOAL_INSTALLED,
  EVENT_JOAL_WILL_DOWNLOAD,
  EVENT_JOAL_DOWNLOAD_STARTED,
  EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JOAL_INSTALL_FAILED
} from './java/joal/joalInstallerEvents';

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

const uuidv4 = () => (
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; // eslint-disable-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3 | 0x8); // eslint-disable-line no-mixed-operators, no-bitwise
    return v.toString(16);
  })
);

const jre = new Jre(app);
const joal = new Joal(app);
let isJreInstallFinished = false;
let isJoalInstallFinished = false;


ipcMain.on('install-dependencies', (event) => {
  jre.on(EVENT_JRE_INSTALLED, () => { event.sender.send(EVENT_JRE_INSTALLED); isJreInstallFinished = true; }); // eslint-disable-line max-len
  jre.on(EVENT_JRE_WILL_DOWNLOAD, () => event.sender.send(EVENT_JRE_WILL_DOWNLOAD));
  jre.on(EVENT_JRE_DOWNLOAD_STARTED, (size) => event.sender.send(EVENT_JRE_DOWNLOAD_STARTED, size)); // eslint-disable-line max-len
  jre.on(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, (bytes) => event.sender.send(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, bytes)); // eslint-disable-line max-len
  jre.on(EVENT_JRE_INSTALL_FAILED, (err) => { event.sender.send(EVENT_JRE_INSTALL_FAILED, err); isJreInstallFinished = true; }); // eslint-disable-line max-len

  joal.on(EVENT_JOAL_INSTALLED, () => { event.sender.send(EVENT_JOAL_INSTALLED); isJoalInstallFinished = true; }); // eslint-disable-line max-len
  joal.on(EVENT_JOAL_WILL_DOWNLOAD, () => event.sender.send(EVENT_JOAL_WILL_DOWNLOAD));
  joal.on(EVENT_JOAL_DOWNLOAD_STARTED, (size) => event.sender.send(EVENT_JOAL_DOWNLOAD_STARTED, size)); // eslint-disable-line max-len
  joal.on(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, (bytes) => event.sender.send(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, bytes)); // eslint-disable-line max-len
  joal.on(EVENT_JOAL_INSTALL_FAILED, (err) => { event.sender.send(EVENT_JOAL_INSTALL_FAILED, err); isJoalInstallFinished = true; }); // eslint-disable-line max-len
  Promise.all([
    jre.installIfRequired(),
    joal.installIfNeeded()
  ])
    .then(() => { // eslint-disable-line promise/always-return
      const uiConfig = {
        host: 'localhost',
        port: '5081',
        pathPrefix: uuidv4(),
        secretToken: uuidv4()
      };
      startJoal(uiConfig);
    })
    .catch((err) => {
      console.error('Failed to install dependencies...', err);
    });
});


const startJoal = (uiConfig) => {
  const joalProcess = new Jre(app).spawn([
    '-jar',
    `${app.getPath('userData')}/joal-core/${joal.getJoalJarName()}`,
    `--joal-conf=${app.getPath('userData')}/joal-core/`,
    '--spring.main.web-environment=true',
    `--server.port=${uiConfig.port}`,
    `--joal.ui.path.prefix=${uiConfig.pathPrefix}`,
    `--joal.ui.secret-token=${uiConfig.secretToken}`,
  ]);
  joalProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  joalProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  // set the localtorage configuration before dom render
  mainWindow.webContents.on('did-get-response-details', () => {
    mainWindow.webContents.executeJavaScript(`localStorage.setItem('guiConfig', '${JSON.stringify(uiConfig)}')`);
  });
  const uiUrl = `http://${uiConfig.host}:${uiConfig.port}/${uiConfig.pathPrefix}/ui`;
  waitForUrl(uiUrl, {
    attempts: 40, // attempts before failing
    method: 'GET',
    timeout: 60000, // threshold before request timeout
    replayDelay: 500, // time before retrying
  })
    .done(() => mainWindow.loadURL(uiUrl))
    .catch((error) => {
      console.error('Joal seems not to be started, we have failed to reach ui url.', error);
    });
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  app.quit();
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

  // Prevent Closing when download is running
  mainWindow.on('close', (e) => {
    if (isJreInstallFinished && isJoalInstallFinished) return;
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
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
