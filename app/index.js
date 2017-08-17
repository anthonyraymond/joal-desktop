import { ipcRenderer } from 'electron';
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Root from './components/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import {
  JRE_READY,
  JRE_WILL_DOWNLOAD,
  JRE_START_DOWNLOAD,
  JRE_DOWNLOAD_HAS_PROGRESSED,
  JRE_DOWNLOAD_FAILED
} from './java/installer/ipcEvents';
import {
  jreIsReady,
  jreWillDownload,
  jreStartedDownloading,
  jreDownloadHasprogress,
  jreDownloadHasFailed
} from './components/initializeStatus/jre/jre.actions';
import {
  JOAL_IS_INSTALLED,
  JOAL_WILL_DOWNLOAD,
  JOAL_START_DOWNLOAD,
  JOAL_DOWNLOAD_HAS_PROGRESSED,
  JOAL_INSTALL_FAILED
} from './java/joal/joalInstallerEvents';
import {
  joalIsInstalled,
  joalWillDownload,
  joalStartedDownloading,
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

ipcRenderer.on(JRE_READY, () => {
  store.dispatch(jreIsReady());
});
ipcRenderer.on(JRE_WILL_DOWNLOAD, () => {
  store.dispatch(jreWillDownload());
});
ipcRenderer.on(JRE_START_DOWNLOAD, (event, length) => {
  store.dispatch(jreStartedDownloading(length));
});
ipcRenderer.on(JRE_DOWNLOAD_HAS_PROGRESSED, (event, downloaded) => {
  store.dispatch(jreDownloadHasprogress(downloaded));
});
ipcRenderer.on(JRE_DOWNLOAD_FAILED, (event, error) => {
  store.dispatch(jreDownloadHasFailed(error));
});

ipcRenderer.on(JOAL_IS_INSTALLED, () => {
  store.dispatch(joalIsInstalled());
});
ipcRenderer.on(JOAL_WILL_DOWNLOAD, () => {
  store.dispatch(joalWillDownload());
});
ipcRenderer.on(JOAL_START_DOWNLOAD, (event, length) => {
  store.dispatch(joalStartedDownloading(length));
});
ipcRenderer.on(JOAL_DOWNLOAD_HAS_PROGRESSED, (event, downloaded) => {
  store.dispatch(joalDownloadHasprogress(downloaded));
});
ipcRenderer.on(JOAL_INSTALL_FAILED, (event, error) => {
  store.dispatch(joalInstallHasFailed(error));
});

ipcRenderer.send('install-jre-if-needed');
