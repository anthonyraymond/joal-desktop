// @flow
import React from 'react';
import JRE from './jre';
import JOAL from './joal';

const InitializeStatus = (props) => {
  return (
    <div>
      <div>
        In order to work JOAL need to download some dependencies, hang tight.
        Do not close the app before downloads ends as it could mess the build.
      </div>
      <h3>Embeded Java</h3>
      <JRE />
      <h3>Joal-core</h3>
      <JOAL />
    </div>
  );
};

export default InitializeStatus;
