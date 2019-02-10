import { app, ipcMain, BrowserWindow as BrowserWindowElectron } from 'electron';
import waitOn from 'wait-on';
import StateManager from './StateManager';
import MenuBuilder from './MenuBuilder';
import DependencyUpdater from './updaters/DependencyUpdater';
import Joal from './runner/Joal';

import type { WindowItem } from './StateManager';

export const WINDOW_NAVIGATED = 'windowNavigated';

export default class WindowManager {
  uiUrl;

  dependencyUpdater = new DependencyUpdater();

  stateManager = new StateManager();

  joal = new Joal();

  window: BrowserWindow = undefined;

  constructor(uiUrl: string) {
    this.uiUrl = uiUrl;
    app.on('window-all-closed', () => {
      app.quit();
    });
  }

  static saveWindowState(window: BrowserWindow, descriptor: WindowItem): void {
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

  registerWindowEventHandlers(
    window: BrowserWindow,
    descriptor: WindowItem
  ): void {
    window.on('close', () => {
      WindowManager.saveWindowState(window, descriptor);

      this.stateManager.save();

      this.joal.kill(() => app.quit());
    });
    window.on('closed', () => {
      this.window = undefined;
    });
  }

  registerIpcEventHandlers(window: BrowserWindow): void {
    ipcMain.on('renderer-ready-to-update', event => {
      this.dependencyUpdater.checkAndInstallUpdate(event);
    });
    ipcMain.on('renderer-ready-to-start-joal', () => {
      console.log('Start joal now');

      const uiConfig = this.joal.start();

      // TODO : remove this function as soon as the webui is able to intercept the loadURL.extraHeaders on startup
      window.webContents.on('did-navigate', () => {
        window.webContents.executeJavaScript(
          `localStorage.setItem('guiConfig', '${JSON.stringify(uiConfig)}')`
        );
      });
      const uiUrl = `http://${uiConfig.host}:${uiConfig.port}/${
        uiConfig.pathPrefix
      }/ui`;
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
          window.loadURL(uiUrl, {
            extraHeaders: `joal-desktop-forwarded-ui-config: ${JSON.stringify(
              uiConfig
            )}`
          });
        }
      );
    });
  }

  openWindow(): void {
    let descriptor = this.stateManager.getWindow();
    if (descriptor === null || descriptor === undefined) {
      this.stateManager.restoreWindow();
      descriptor = this.stateManager.getWindow();
    }

    const options: BrowserWindowConstructorOptions = {
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

  focusFirstWindow(): void {
    if (this.window !== undefined) {
      const { window } = this;
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }
}
