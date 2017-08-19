// @flow
import update from 'immutability-helper';
import {
  INSTALLED,
  WILL_DOWNLOAD,
  DOWNLOAD_STARTED,
  DOWNLOAD_HAS_PROGRESSED,
  INSTALL_FAILED
} from './joal.actions';

const initialState = {
  installed: false,
  hasCompleted: false,
  error: '',
  downloadStats: {
    length: 0,
    downloaded: 0
  }
};

export default function counter(state = initialState, action) {
  switch (action.type) {
    case INSTALLED:
      return update(state, {
        installed: { $set: true },
        hasCompleted: { $set: true },
        downloadStats: { length: { $set: 100 }, downloaded: { $set: 100 } }
      });
    case WILL_DOWNLOAD:
      return update(state, {
        installed: { $set: false },
        error: { $set: '' }
      });
    case DOWNLOAD_STARTED:
      return update(state, {
        downloadStats: {
          length: { $set: action.length },
          downloaded: { $set: 0 }
        }
      });
    case DOWNLOAD_HAS_PROGRESSED:
      return update(state, {
        downloadStats: {
          downloaded: { $set: (state.downloadStats.downloaded + action.deltaDownloaded) }
        }
      });
    case INSTALL_FAILED:
      return update(state, {
        hasCompleted: { $set: true },
        error: { $set: action.error }
      });
    default:
      return state;
  }
}
