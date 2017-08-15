// @flow
import update from 'immutability-helper';
import {
  JRE_READY,
  JRE_WILL_DOWNLOAD,
  JRE_START_DOWNLOAD,
  JRE_DOWNLOAD_HAS_PROGRESSED,
  JRE_DOWNLOAD_FAILED
} from './jre.action';

const initialState = {
  installed: false,
  error: '',
  downloadStats: {
    length: 0,
    downloaded: 0
  }
};

export default function counter(state = initialState, action) {
  switch (action.type) {
    case JRE_READY:
      return update(state, {
        installed: { $set: true },
        downloadStats: { length: { $set: 100 }, downloaded: { $set: 100 } }
      });
    case JRE_WILL_DOWNLOAD:
      return update(state, {
        installed: { $set: false },
        error: { $set: '' }
      });
    case JRE_START_DOWNLOAD:
      return update(state, {
        downloadStats: {
          length: { $set: action.length },
          downloaded: { $set: 0 }
        }
      });
    case JRE_DOWNLOAD_HAS_PROGRESSED:
      return update(state, {
        downloadStats: {
          downloaded: { $set: (state.downloadStats.downloaded + action.deltaDownloaded) }
        }
      });
    case JRE_DOWNLOAD_FAILED:
      return update(state, {
        error: { $set: action.error }
      });
    default:
      return state;
  }
}
