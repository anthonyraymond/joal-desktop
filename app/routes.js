/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './components/App';
import InitializeStatus from './components/initializeStatus';

export default () => (
  <App>
    <Switch>
      <Route path="/" component={InitializeStatus} />
    </Switch>
  </App>
);
