// @flow
import React from 'react';
import JRE from './jre';
import JOAL from './joal';

const InitializeStatus = (props) => {
  return (
    <div>
      <h1>Jre</h1>
      <JRE />
      <h1>Joal</h1>
      <JOAL />
    </div>
  );
};

export default InitializeStatus;
