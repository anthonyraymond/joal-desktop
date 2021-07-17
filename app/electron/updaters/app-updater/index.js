import PProgress from 'p-progress';
import os from 'os';
import { autoUpdater as electronUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';

const checkAndInstallUpdate = () =>
  new PProgress((resolve, reject, progress) => {
    electronUpdater.on('update-not-available', updateInfo =>
      resolve({
        wasUpToDate: true,
        updateInfo
      })
    );
    electronUpdater.on('update-available', () => /* updateInfo */ progress(0));
    electronUpdater.on('download-progress', progressInfo =>
      progress(progressInfo.progress)
    );
    electronUpdater.on('error', err => {
      reject(err);
    });
    electronUpdater.on('update-downloaded', updateInfo => {
      resolve({
        wasUpToDate: false,
        updateInfo
      });
      // TODO : check that the quitAndInstall will be executed before the resolve callback
      electronUpdater.quitAndInstall();
    });

    const platform = os.platform();
    if (platform === 'darwin') {
      electronUpdater.emit('error', {
        message:
          'Auto-updates are available only for Windows and Linux, please manually check updates at https://github.com/anthonyraymond/joal-desktop/releases'
      });
    } else if (isDev) {
      // mock update process in dev mode
      electronUpdater.emit('checking-for-update');
      electronUpdater.emit('update-not-available', {
        version: '1.0.0',
        files: [],
        releaseName: 'vMocked',
        releaseNotes: 'mocked',
        releaseDate: new Date()
      });
    } else {
      electronUpdater.checkForUpdates();
    }
  });

export default checkAndInstallUpdate;

/*
import os from 'os';
import { autoUpdater as electronUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import events from 'events';

const updateEvents = {
  checking: 'checking-for-update',
  upToDate: 'update-available',
  newVersionAvailable: 'update-not-available',
  updateProgress: 'download-progress',
  updateDone: 'update-downloaded',
  error: 'error'
};
class AppUpdater extends events.EventEmitter {
  checkAndInstallUpdate() {
    electronUpdater.on('checking-for-update', () => this.emit(updateEvents.checking));
    electronUpdater.on('update-not-available', (updateInfo) => this.emit(updateEvents.upToDate, updateInfo));
    electronUpdater.on('update-available', (updateInfo) => this.emit(updateEvents.newVersionAvailable, updateInfo));
    electronUpdater.on('download-progress', (progressInfo) => this.emit(updateEvents.updateProgress, progressInfo));
    electronUpdater.on('error', this.emit('error', (err) => this.emit(updateEvents.error, err)));
    electronUpdater.on('update-downloaded', (updateInfo) => {
      this.emit(updateEvents.updateDone, updateInfo)
      electronUpdater.quitAndInstall();
    });

    const platform = os.platform();
    if (platform === 'darwin') {
      electronUpdater.emit('error', { message: 'Auto-updates are available only for Windows and Linux, please manually check updates at https://github.com/anthonyraymond/joal-desktop/releases' });
    } else if (isDev) {
      // mock update process in dev mode
      electronUpdater.emit('checking-for-update');
      electronUpdater.emit('update-not-available', {
        version: '1.0.0',
        files: [],
        releaseName: 'vMocked',
        releaseNotes: 'mocked',
        releaseDate: new Date()
      });
    } else {
      electronUpdater.checkForUpdates();
    }
  }
}

export {
  AppUpdater,
  updateEvents
}
*/
