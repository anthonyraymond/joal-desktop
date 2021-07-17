import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import updatersReducer from '../components/updaters/updaters.reducer';

export default function createRootReducer(history) {
  return combineReducers({
    router: connectRouter(history),
    updaters: updatersReducer
  });
}
