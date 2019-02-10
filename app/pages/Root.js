import React from 'react';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import primary from '@material-ui/core/colors/blue';
import secondary from '@material-ui/core/colors/lightGreen';
import App from './App';

type Props = {
  store: {},
  history: {}
};

const muiTheme = createMuiTheme({
  palette: {
    primary: {
      light: primary[300],
      main: primary[500],
      dark: primary[700]
    },
    secondary: {
      light: secondary[300],
      main: secondary[500],
      dark: secondary[700]
    },
    type: 'light'
  },
  typography: {
    useNextVariants: true
  }
});

const Root = ({ store, history }: Props) => (
  <Provider store={store}>
    <MuiThemeProvider theme={muiTheme}>
      <App history={history} />
    </MuiThemeProvider>
  </Provider>
);

export default Root;
