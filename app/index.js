import { ipcRenderer } from 'electron';
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Root from './components/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import {
  EVENT_ELECTRON_UPDATER_CHECK_FOR_UPDATE,
  EVENT_ELECTRON_UPDATER_INSTALLED,
  EVENT_ELECTRON_UPDATER_DOWNLOAD_HAS_PROGRESSED,
  EVENT_ELECTRON_UPDATER_INSTALL_FAILED
} from './java/electronUpdater/electronUpdaterEvents';
import {
  electronUpdaterCheckingForUpdate,
  electronUpdaterDownloadHasprogress,
  electronUpdaterIsInstalled,
  electronUpdaterInstallHasFailed
} from './components/initializeStatus/electronUpdater/electronUpdater.actions';
import {
  EVENT_JRE_INSTALLED,
  EVENT_JRE_WILL_DOWNLOAD,
  EVENT_JRE_DOWNLOAD_STARTED,
  EVENT_JRE_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JRE_INSTALL_FAILED
} from './java/jre/jreInstallerEvent';
import {
  jreIsInstalled,
  jreWillDownload,
  jreDownloadStarted,
  jreDownloadHasprogress,
  jreDownloadHasFailed
} from './components/initializeStatus/jre/jre.actions';
import {
  EVENT_JOAL_INSTALLED,
  EVENT_JOAL_WILL_DOWNLOAD,
  EVENT_JOAL_DOWNLOAD_STARTED,
  EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JOAL_INSTALL_FAILED
} from './java/joal/joalInstallerEvents';
import {
  joalIsInstalled,
  joalWillDownload,
  joalDownloadStarted,
  joalDownloadHasprogress,
  joalInstallHasFailed
} from './components/initializeStatus/joal/joal.actions';

const store = configureStore();

render(
  <MuiThemeProvider>
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>
  </MuiThemeProvider>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./components/Root', () => {
    const NextRoot = require('./components/Root'); // eslint-disable-line global-require
    render(
      <MuiThemeProvider>
        <AppContainer>
          <NextRoot store={store} history={history} />
        </AppContainer>
      </MuiThemeProvider>,
      document.getElementById('root')
    );
  });
}

ipcRenderer.on(EVENT_ELECTRON_UPDATER_CHECK_FOR_UPDATE, () => store.dispatch(electronUpdaterCheckingForUpdate())); // eslint-disable-line max-len
ipcRenderer.on(EVENT_ELECTRON_UPDATER_DOWNLOAD_HAS_PROGRESSED, (progressObj) =>
  store.dispatch(electronUpdaterDownloadHasprogress(progressObj.transferred, progressObj.total))
);
ipcRenderer.on(EVENT_ELECTRON_UPDATER_INSTALLED, () => store.dispatch(electronUpdaterIsInstalled())); // eslint-disable-line max-len
ipcRenderer.on(EVENT_ELECTRON_UPDATER_INSTALL_FAILED, (err) => store.dispatch(electronUpdaterInstallHasFailed(err.message))); // eslint-disable-line max-len

ipcRenderer.on(EVENT_JRE_INSTALLED, () => store.dispatch(jreIsInstalled()));
ipcRenderer.on(EVENT_JRE_WILL_DOWNLOAD, () => store.dispatch(jreWillDownload()));
ipcRenderer.on(EVENT_JRE_DOWNLOAD_STARTED, (event, size) => store.dispatch(jreDownloadStarted(size))); // eslint-disable-line max-len
ipcRenderer.on(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, (event, bytes) => store.dispatch(jreDownloadHasprogress(bytes))); // eslint-disable-line max-len
ipcRenderer.on(EVENT_JRE_INSTALL_FAILED, (event, err) => store.dispatch(jreDownloadHasFailed(err))); // eslint-disable-line max-len

ipcRenderer.on(EVENT_JOAL_INSTALLED, () => store.dispatch(joalIsInstalled()));
ipcRenderer.on(EVENT_JOAL_WILL_DOWNLOAD, () => store.dispatch(joalWillDownload()));
ipcRenderer.on(EVENT_JOAL_DOWNLOAD_STARTED, (event, size) => store.dispatch(joalDownloadStarted(size))); // eslint-disable-line max-len
ipcRenderer.on(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, (event, bytes) => store.dispatch(joalDownloadHasprogress(bytes))); // eslint-disable-line max-len
ipcRenderer.on(EVENT_JOAL_INSTALL_FAILED, (event, err) => store.dispatch(joalInstallHasFailed(err))); // eslint-disable-line max-len


ipcRenderer.send('renderer-ready');
