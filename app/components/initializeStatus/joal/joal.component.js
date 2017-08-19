// @flow
import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import filesize from 'filesize';
import styles from './style.css';

type Props = {
  progressCurrentValue: number,
  progressMaxValue: number,
  error?: string
};

const Joal = (props: Props) => {
  const { progressCurrentValue, progressMaxValue, error } = props;
  return (
    <div className={styles.progressWrapper}>
      { !error &&
        <div>
          <LinearProgress
            mode="determinate"
            max={progressMaxValue}
            value={progressCurrentValue}
          />
        </div>
      }
      { (progressCurrentValue !== progressMaxValue) && progressCurrentValue !== 0 &&
        <div className={styles.textProgress}>
          {`${filesize(progressCurrentValue, { standard: 'iec' })}/${filesize(progressMaxValue, { standard: 'iec' })}`}
        </div>
      }
      { error &&
        <div>{error}</div>
      }
    </div>
  );
};
Joal.defaultProps = {
  error: ''
};

export default Joal;
