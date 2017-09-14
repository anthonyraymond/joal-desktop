// @flow
import React from 'react';
import Divider from 'material-ui/Divider';
import JRE from './jre';
import JOAL from './joal';

const InitializeStatus = () => (
  <div>
    <div>
      In order to work JOAL need to download some dependencies, hang tight.
      Do not close the app before downloads ends as it could mess the build.
    </div>
    <Divider style={{ marginTop: 15, backgroundColor: 'rgb(206, 206, 206)' }} />
    <JRE />
    <JOAL />
  </div>
);

export default InitializeStatus;
