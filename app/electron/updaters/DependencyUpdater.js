import updateElectron from './app-updater';
import updateJoal from './joal-updater';
import updateJre from './jre-updater';
import {
  electronCheckingForUpdate,
  electronUpToDate,
  electronDownloadProgress,
  electronHasUpdated,
  electronUpdateError,
  joalCheckingForUpdate,
  joalUpToDate,
  joalDownloadProgress,
  joalHasUpdated,
  joalUpdateError,
  jreCheckingForUpdate,
  jreUpToDate,
  jreDownloadProgress,
  jreHasUpdated,
  jreUpdateError,
  updateProcessDone,
  updateProcessError
} from '../../components/updaters/updaters.actions';

export default class DepencencyUpdater {
  checkAndInstallUpdate(ipcChannel) {
    // eslint-disable-line class-methods-use-this
    // first check and install electron update
    const passReducerActionToRenderer = action => {
      // eslint-disable-line no-param-reassign
      ipcChannel.sender.send('forward-update-message-to-renderer', action);
    };

    passReducerActionToRenderer(electronCheckingForUpdate());
    updateElectron()
      .onProgress(progress =>
        passReducerActionToRenderer(electronDownloadProgress(progress * 100))
      )
      .then(res => {
        if (res.wasUpToDate) {
          console.log('ELECTRON: done updating, no updates available');
          passReducerActionToRenderer(electronUpToDate(res.updateInfo.version));
        } else {
          console.log('ELECTRON: done updating, update was downloaded');
          passReducerActionToRenderer(
            electronHasUpdated(res.updateInfo.version)
          );
          // At this point the app will quit to install, no need to return anything or to block the promise execution.
        }
        return true;
      })
      .catch(err => {
        console.log('ELECTRON: update fucked up', err);
        passReducerActionToRenderer(electronUpdateError(err.message));
        return true; // do not throw the error, keep going if electron app did not update
      })
      .then(() => {
        passReducerActionToRenderer(jreCheckingForUpdate());
        const jreInstallPromise = updateJre()
          .onProgress(status =>
            passReducerActionToRenderer(jreDownloadProgress(status * 100))
          )
          .then(res => {
            if (res.wasUpToDate) {
              console.log('JRE: done updating, no updates available');
              passReducerActionToRenderer(jreUpToDate(res.updateInfo.version));
            } else {
              console.log('JRE: done updating, update was downloaded');
              passReducerActionToRenderer(
                jreHasUpdated(res.updateInfo.version)
              );
              // At this point the app will quit to install, no need to return anything or to block the promise execution.
            }
            return true;
          })
          .catch(err => {
            console.error('JRE: install fucked up:', err);
            passReducerActionToRenderer(jreUpdateError(err.message));
            throw err;
          });

        passReducerActionToRenderer(joalCheckingForUpdate());
        const joalInstallPromise = updateJoal()
          .onProgress(status =>
            passReducerActionToRenderer(joalDownloadProgress(status * 100))
          )
          .then(res => {
            if (res.wasUpToDate) {
              console.log('JOAL: done updating, no updates available');
              passReducerActionToRenderer(joalUpToDate(res.updateInfo.version));
            } else {
              console.log('JOAL: done updating, update was downloaded');
              passReducerActionToRenderer(
                joalHasUpdated(res.updateInfo.version)
              );
              // At this point the app will quit to install, no need to return anything or to block the promise execution.
            }
            return true;
          })
          .catch(err => {
            console.error('JOAL: install fucked up:', err);
            passReducerActionToRenderer(joalUpdateError(err.message));
            throw err;
          });

        return Promise.all([jreInstallPromise, joalInstallPromise]);
      })
      .then(() => {
        passReducerActionToRenderer(updateProcessDone());
        console.log('All updates done');
        return true;
      })
      .catch(err => {
        passReducerActionToRenderer(updateProcessError(err.message));
        console.log('Error updating joal or JRE:', err);
      });
  }
}
