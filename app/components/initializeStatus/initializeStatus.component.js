// @flow
import React from 'react';
import Electronupdater from './electronUpdater';
import JRE from './jre';
import JOAL from './joal';

const InitializeStatus = () => (
  <div>
    <h1>Checking for updates</h1>
    <Electronupdater />
    <JRE />
    <JOAL />
  </div>
);

export default InitializeStatus;
