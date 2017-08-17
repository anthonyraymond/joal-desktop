// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import jreDownloadReducer from '../components/initializeStatus/jre/jre.reducer';
import joalDownloadReducer from '../components/initializeStatus/joal/joal.reducer';

const rootReducer = combineReducers({
  jre: jreDownloadReducer,
  joal: joalDownloadReducer,
  router
});

export default rootReducer;
