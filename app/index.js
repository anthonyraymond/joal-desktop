import { ipcRenderer } from 'electron';
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './pages/Root';
import { configureStore, history } from './store/configureStore';
import { UPDATE_PROCESS_DONE } from './components/updaters/updaters.actions';
import './app.global.css';

const store = configureStore();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./pages/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./pages/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}

ipcRenderer.on(
  'forward-update-message-to-renderer',
  (ipcChannel, forwardedAction) => {
    store.dispatch(forwardedAction);
    if (forwardedAction.type === UPDATE_PROCESS_DONE) {
      ipcRenderer.send('renderer-ready-to-start-joal');
    }
  }
);

ipcRenderer.send('renderer-ready-to-update');
