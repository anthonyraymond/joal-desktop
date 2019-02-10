import React from 'react';
import os from 'os';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import SingleUpdater from './single-updater/single-updater.component';
import pkg from '../../../package.json';
import type { UpdaterState } from './types';

type Props = {
  updaters: UpdaterState,
  classes: {},
  onClickGithubLink: () => void
};

const styles = theme => ({
  paper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginBottom: 80
  },
  updater: {
    marginBottom: 20
  },
  errorMessage: {
    marginTop: 20,
    color: theme.palette.error.light
  }
});

const Updaters = ({ updaters, onClickGithubLink, classes }: Props) => (
  <Grid container direction="column">
    <Paper className={classes.paper}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Checking for updates
        </Typography>
        {`You are using Joal-Desktop v${
          pkg.version
        }. The app is checking for updates.`}
        <br />
        {os.platform() === 'darwin' && (
          <p>
            MacOS does not support automatic updates, please go to{' '}
            <a
              onClick={onClickGithubLink}
              href="https://github.com/anthonyraymond/joal-desktop/releases"
            >
              the Github page
            </a>{' '}
            and check for update manually.
          </p>
        )}
      </Grid>
    </Paper>
    <Grid item xs={12} className={classes.updater}>
      <SingleUpdater updater={updaters.electronApp} name="Desktop app" />
    </Grid>
    <Grid item xs={12} className={classes.updater}>
      <SingleUpdater updater={updaters.joal} name="Joal core" />
    </Grid>
    <Grid item xs={12} className={classes.updater}>
      <SingleUpdater updater={updaters.jre} name="Java Runtime Environment" />
    </Grid>

    {updaters.global.errorMessage && (
      <Grid item xs={12}>
        <Typography variant="caption" className={classes.errorMessage}>
          {updaters.global.errorMessage}
        </Typography>
      </Grid>
    )}
  </Grid>
);

export default withStyles(styles)(Updaters);
