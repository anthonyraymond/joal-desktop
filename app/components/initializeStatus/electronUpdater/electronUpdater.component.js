// @flow
import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import WaitingIcon from 'material-ui/svg-icons/action/schedule';
import CheckIcon from 'material-ui/svg-icons/action/check-circle';
import WorkingIcon from 'material-ui/svg-icons/action/cached';
import ErrorIcon from 'material-ui/svg-icons/alert/error';
import { lightGreen500, red500 } from 'material-ui/styles/colors';
import filesize from 'filesize';
import styles from './style.css';

type Props = {
  progressCurrentValue: number,
  progressMaxValue: number,
  error?: string,
  isWorking: boolean,
  hasCompleted: boolean
};

const Joal = (props: Props) => {
  const { progressCurrentValue, progressMaxValue, error, hasCompleted, isWorking } = props;

  let icon = <WaitingIcon className={styles.icon} />;
  if (isWorking) {
    icon = <WorkingIcon className={`${styles.icon} ${styles.iconWorking}`} />;
  } else if (error) {
    icon = <ErrorIcon className={styles.icon} color={red500} />;
  } else if (hasCompleted) {
    icon = <CheckIcon className={styles.icon} color={lightGreen500} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {icon}
      <h3 className={styles.title}>Joal-desktop</h3>
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
        { !isWorking && progressCurrentValue !== 0 &&
          <div className={styles.textProgress}>
            {`${filesize(progressCurrentValue, { standard: 'iec' })}/${filesize(progressMaxValue, { standard: 'iec' })}`}
          </div>
        }
        { error && <div>{error}</div> }
      </div>
    </div>
  );
};
Joal.defaultProps = {
  error: ''
};

export default Joal;
