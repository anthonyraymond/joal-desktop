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
} from './components/initializeStatus/jre/jre.action';

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
  store.dispatch(jreDownloadHasFailed(error.message));
});
ipcRenderer.send('install-jre-if-needed');
