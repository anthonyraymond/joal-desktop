// @flow
import update from 'immutability-helper';
import {
  CHECKING_FOR_UPDATE,
  DOWNLOAD_HAS_PROGRESSED,
  INSTALLED,
  INSTALL_FAILED
} from './electronUpdater.actions';

const initialState = {
  isWorking: false,
  hasCompleted: false,
  error: '',
  downloadStats: {
    length: 100,
    downloaded: 0
  }
};

export default function counter(state = initialState, action) {
  switch (action.type) {
    case CHECKING_FOR_UPDATE:
      return update(state, {
        isWorking: { $set: true }
      });
    case DOWNLOAD_HAS_PROGRESSED:
      return update(state, {
        downloadStats: {
          downloaded: { $set: action.bytesDownloaded },
          length: { $set: action.totalSize }
        }
      });
    case INSTALLED:
      return update(state, {
        isWorking: { $set: false },
        hasCompleted: { $set: true },
        downloadStats: { length: { $set: 100 }, downloaded: { $set: 100 } }
      });
    case INSTALL_FAILED:
      return update(state, {
        isWorking: { $set: false },
        hasCompleted: { $set: true },
        error: { $set: action.error }
      });
    default:
      return state;
  }
}
