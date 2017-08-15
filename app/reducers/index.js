// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import jreDownloadReducer from '../components/initializeStatus/jre/jre.reducer';

const rootReducer = combineReducers({
  jre: jreDownloadReducer,
  router
});

export default rootReducer;
