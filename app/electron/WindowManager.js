import {
  app,
  ipcMain,
  BrowserWindow as BrowserWindowElectron,
  dialog
} from 'electron';
import waitOn from 'wait-on';
import MenuBuilder from './MenuBuilder';
import DependencyUpdater from './updaters/DependencyUpdater';
import Joal from './runner/Joal';

export const WINDOW_NAVIGATED = 'windowNavigated';

export default class WindowManager {
  uiUrl;

  dependencyUpdater = new DependencyUpdater();

  isUpdateInProgress = false;

  joal = new Joal();

  window = undefined;

  constructor(uiUrl) {
    this.uiUrl = uiUrl;
    app.on('window-all-closed', () => {
      app.quit();
    });
  }

  static saveWindowState(window, descriptor) {
    if (window.isMaximized()) {
      delete descriptor.width; // eslint-disable-line no-param-reassign
      delete descriptor.height; // eslint-disable-line no-param-reassign
      delete descriptor.x; // eslint-disable-line no-param-reassign
      delete descriptor.y; // eslint-disable-line no-param-reassign
    } else {
      const bounds = window.getBounds();
      descriptor.width = bounds.width; // eslint-disable-line no-param-reassign
      descriptor.height = bounds.height; // eslint-disable-line no-param-reassign
      descriptor.x = bounds.x; // eslint-disable-line no-param-reassign
      descriptor.y = bounds.y; // eslint-disable-line no-param-reassign
    }
  }

  registerWindowEventHandlers(window, descriptor) {
    window.on('close', e => {
      WindowManager.saveWindowState(window, descriptor);

      if (this.isUpdateInProgress) {
        const pressedButton = dialog.showMessageBox(window, {
          type: 'question',
          title: 'Update in progress',
          message:
            'Closing the app during the dependencies download process may leave your app in an unstable state.\n\nAre you sure you want to quit now ?',
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
      this.isUpdateInProgress = false; // the below app.quit() will call this function another time, prevent a second dialog to open
      // Force quit when the window is closed to prevent mac from hidding in in the dock.
      this.joal.kill(() => app.quit());
    });
    window.on('closed', () => {
      this.window = undefined;
    });
  }

  registerIpcEventHandlers(window) {
    ipcMain.on('renderer-ready-to-update', event => {
      this.isUpdateInProgress = true;
      this.dependencyUpdater
        .checkAndInstallUpdate(event)
        .then(() => {
          this.isUpdateInProgress = false;
          return true;
        })
        .catch(() => {
          this.isUpdateInProgress = false;
        });
    });
    ipcMain.on('renderer-ready-to-start-joal', () => {
      console.log('Start joal now');

      const uiConfig = this.joal.start();
      const configAsUrlParam = encodeURIComponent(JSON.stringify(uiConfig));

      const uiUrl = `http://${uiConfig.host}:${uiConfig.port}/${uiConfig.pathPrefix}/ui?ui_credentials=${configAsUrlParam}`;
      waitOn(
        {
          resources: [uiUrl],
          delay: 1000, // initial delay in ms, default 0
          interval: 100, // poll interval in ms, default 250ms
          timeout: 60000, // timeout in ms, default Infinity
          window: 200
        },
        err => {
          if (err) {
            console.error(
              'Joal seems not to be started, we have failed to reach ui url.',
              err
            );
            return;
          }
          window.loadURL(uiUrl);
        }
      );
    });
  }

  openWindow() {
    const descriptor = {
      width: 1024,
      height: 728
    };

    const options = {
      // to avoid visible maximizing
      show: false,
      webPreferences: {
        // preload: path.join(__dirname, "autoSignIn.js") // TODO : add the config.json integration here????
      }
    };

    let isMaximized = true;
    if (descriptor.width != null && descriptor.height != null) {
      options.width = descriptor.width;
      options.height = descriptor.height;
      isMaximized = false;
    }
    if (descriptor.x != null && descriptor.y != null) {
      options.x = descriptor.x;
      options.y = descriptor.y;
      isMaximized = false;
    }

    const window = new BrowserWindowElectron(options);
    if (isMaximized) {
      window.maximize();
    }
    new MenuBuilder(window).buildMenu();

    this.registerIpcEventHandlers(window);

    window.loadURL(this.uiUrl);
    window.show();
    this.registerWindowEventHandlers(window, descriptor);
    this.window = window;
  }

  focusFirstWindow() {
    if (this.window !== undefined) {
      const { window } = this;
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }
}
