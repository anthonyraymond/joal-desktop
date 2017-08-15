// @flow
import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import filesize from 'filesize';
import styles from './style.css';

type Props = {
  progressCurrentValue: number,
  progressMaxValue: number
};

const InitializeStatus = (props: Props) => {
  const { progressCurrentValue, progressMaxValue } = props;
  return (
    <div className={styles.progressWrapper}>
      <div>
        <LinearProgress
          mode="determinate"
          max={progressMaxValue}
          value={progressCurrentValue}
        />
      </div>
      { (progressCurrentValue !== progressMaxValue) && progressCurrentValue !== 0 &&
        <div className={styles.textProgress}>
          {`${filesize(progressCurrentValue, { standard: 'iec' })}/${filesize(progressMaxValue, { standard: 'iec' })}`}
        </div>
      }
    </div>
  );
};

export default InitializeStatus;
