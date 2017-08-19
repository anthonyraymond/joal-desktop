// @flow
import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import filesize from 'filesize';
import styles from './style.css';

type Props = {
  progressCurrentValue: number,
  progressMaxValue: number,
  error?: string,
  hasCompleted: boolean
};

const Jre = (props: Props) => {
  const { progressCurrentValue, progressMaxValue, error, hasCompleted } = props;
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
      { !hasCompleted && progressCurrentValue !== 0 &&
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
Jre.defaultProps = {
  error: ''
};

export default Jre;
