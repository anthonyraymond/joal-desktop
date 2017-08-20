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
import MenuBuilder from './menu';
import Jre from './java/jre';

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

/* Java and Joal ipc handler */
const checkUrlExists = (host,cb) => {
    http.request({method:'HEAD',host,port:80,path: '/'}, (r) => {
        cb(null, r.statusCode > 200 && r.statusCode < 400 );
    }).on('error', cb).end();
}
let isCloseAllowed = true;
ipcMain.on('prevent-close', () => { isCloseAllowed = false; });
ipcMain.on('allow-close', () => { isCloseAllowed = true; });
ipcMain.on('start-joal', (sender, uiConfig) => {
  const joalProcess = new Jre(app).spawn([
    '-jar',
    app.getPath('userData') + '/' + 'joal-core/jack-of-all-trades-2.0.0-SNAPSHOT.jar',
    '--joal-conf=' + app.getPath('userData') + '/' + 'joal-core/',
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
  setTimeout(() => mainWindow.loadURL(`http://${uiConfig.host}:${uiConfig.port}/${uiConfig.pathPrefix}/ui`), 9000);
});

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
    if (isCloseAllowed) return;
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
