import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Root from './components/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import JavaInstaller from './java/installer';
import JoalInstaller from './java/joal';
import {
  JRE_READY,
  JRE_WILL_DOWNLOAD,
  JRE_START_DOWNLOAD,
  JRE_DOWNLOAD_HAS_PROGRESSED,
  JRE_DOWNLOAD_FAILED
} from './java/installer/jreInstallerEvent';
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

const { app } = require('electron').remote;

const java = new JavaInstaller(app);
java.on(JRE_READY, () => store.dispatch(jreIsReady()));
java.on(JRE_WILL_DOWNLOAD, () => store.dispatch(jreWillDownload()));
java.on(JRE_START_DOWNLOAD, (size) => store.dispatch(jreStartedDownloading(size)));
java.on(JRE_DOWNLOAD_HAS_PROGRESSED, (bytes) => store.dispatch(jreDownloadHasprogress(bytes)));
java.on(JRE_DOWNLOAD_FAILED, (err) => store.dispatch(jreDownloadHasFailed(err)));
java.installIfRequired();

const joal = new JoalInstaller(app);
joal.on(JOAL_IS_INSTALLED, () => store.dispatch(joalIsInstalled()));
joal.on(JOAL_WILL_DOWNLOAD, () => store.dispatch(joalWillDownload()));
joal.on(JOAL_START_DOWNLOAD, (size) => store.dispatch(joalStartedDownloading(size)));
joal.on(JOAL_DOWNLOAD_HAS_PROGRESSED, (bytes) => store.dispatch(joalDownloadHasprogress(bytes)));
joal.on(JOAL_INSTALL_FAILED, (err) => store.dispatch(joalInstallHasFailed(err)));
joal.installIfNeeded();
