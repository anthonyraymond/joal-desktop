import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import UpdateDependencyPage from './dependency-updates';

const styles = theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing.unit * 2
  }
});

const App = props => {
  const { classes, history } = props; // eslint-disable-line react/prop-types
  return (
    <Grid container className={classes.root}>
      <Grid item xs={12}>
        <main>
          <ConnectedRouter history={history}>
            <Switch>
              {/* <Route exact path="/dependencies-update" component={UpdateDependencyPage} /> */}
              <Route exact path="/" component={UpdateDependencyPage} />
            </Switch>
          </ConnectedRouter>
        </main>
      </Grid>
    </Grid>
  );
};

export default withStyles(styles)(App);
