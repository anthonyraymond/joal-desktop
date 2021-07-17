import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import LoadingIcon from '@material-ui/icons/Loop';
import DoneIcon from '@material-ui/icons/Done';
import AwaitIcon from '@material-ui/icons/Pause';
import ErrorIcon from '@material-ui/icons/Close';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

const styles = theme => ({
  statusIcon: {
    marginTop: -3,
    marginRight: theme.spacing.unit
  },
  successIcon: {
    color: theme.palette.secondary.main
  },
  errorIcon: {
    color: theme.palette.error.light
  },
  '@keyframes rotate': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  },
  rotate: {
    transitionProperty: 'transform',
    transitionDuration: '1s',
    animationName: 'rotate',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear'
  },
  errorMessage: {
    color: theme.palette.error.light
  }
});
// eslint-disable-next-line react/prop-types
const UpdaterComponent = ({ name, updater, classes }) => {
  let Message;
  if (updater.error) {
    Message = (
      <Typography className={classes.errorMessage}>
        {updater.errorMessage}
      </Typography>
    );
  } else {
    Message = <Typography>{updater.message}</Typography>;
  }

  let StatusIcon;
  if (updater.errorMessage)
    StatusIcon = (
      <ErrorIcon
        className={classnames(classes.statusIcon, classes.errorIcon)}
      />
    );
  else if (updater.isWaiting)
    StatusIcon = <AwaitIcon className={classes.statusIcon} />;
  else if (updater.isDownloading || updater.isChecking)
    StatusIcon = (
      <LoadingIcon className={classnames(classes.statusIcon, classes.rotate)} />
    );
  else
    StatusIcon = (
      <DoneIcon
        className={classnames(classes.statusIcon, classes.successIcon)}
      />
    );

  return (
    <div>
      <Grid container direction="row" justify="flex-start" alignItems="center">
        <Grid item>{StatusIcon}</Grid>
        <Grid item>
          <Typography variant="h6" gutterBottom>
            {name}
          </Typography>
        </Grid>
      </Grid>
      <LinearProgress variant="determinate" value={updater.progress} />
      {Message}
    </div>
  );
};

export default withStyles(styles)(UpdaterComponent);
