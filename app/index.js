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
  EVENT_JRE_INSTALLED,
  EVENT_JRE_WILL_DOWNLOAD,
  EVENT_JRE_DOWNLOAD_STARTED,
  EVENT_JRE_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JRE_INSTALL_FAILED
} from './java/installer/jreInstallerEvent';
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

const { app } = require('electron').remote;

const java = new JavaInstaller(app);
java.on(EVENT_JRE_INSTALLED, () => store.dispatch(jreIsInstalled()));
java.on(EVENT_JRE_WILL_DOWNLOAD, () => store.dispatch(jreWillDownload()));
java.on(EVENT_JRE_DOWNLOAD_STARTED, (size) => store.dispatch(jreDownloadStarted(size)));
java.on(EVENT_JRE_DOWNLOAD_HAS_PROGRESSED, (bytes) => store.dispatch(jreDownloadHasprogress(bytes))); // eslint-disable-line max-len
java.on(EVENT_JRE_INSTALL_FAILED, (err) => store.dispatch(jreDownloadHasFailed(err)));
java.installIfRequired();

const joal = new JoalInstaller(app);
joal.on(EVENT_JOAL_INSTALLED, () => store.dispatch(joalIsInstalled()));
joal.on(EVENT_JOAL_WILL_DOWNLOAD, () => store.dispatch(joalWillDownload()));
joal.on(EVENT_JOAL_DOWNLOAD_STARTED, (size) => store.dispatch(joalDownloadStarted(size)));
joal.on(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, (bytes) => store.dispatch(joalDownloadHasprogress(bytes))); // eslint-disable-line max-len
joal.on(EVENT_JOAL_INSTALL_FAILED, (err) => store.dispatch(joalInstallHasFailed(err)));
joal.installIfNeeded();
