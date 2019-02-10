// @flow
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import updatersReducer from '../components/updaters/updaters.reducer';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    updaters: updatersReducer
  });
}
