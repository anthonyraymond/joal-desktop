import update from 'immutability-helper';
import {
  ELECTRON_CHECKING_FOR_UPDATE,
  ELECTRON_UP_TO_DATE,
  ELECTRON_DOWNLOAD_PROGRESS,
  ELECTRON_HAS_UPDATED,
  ELECTRON_UPDATE_ERROR,
  JOAL_CHECKING_FOR_UPDATE,
  JOAL_UP_TO_DATE,
  JOAL_DOWNLOAD_PROGRESS,
  JOAL_HAS_UPDATED,
  JOAL_UPDATE_ERROR,
  JRE_CHECKING_FOR_UPDATE,
  JRE_UP_TO_DATE,
  JRE_DOWNLOAD_PROGRESS,
  JRE_HAS_UPDATED,
  JRE_UPDATE_ERROR,
  UPDATE_PROCESS_ERROR
} from './updaters.actions';
import createReducer from '../../reducers/createReducer';

const initialState = {
  electronApp: {
    isWaiting: true,
    isChecking: false,
    isDownloading: false,
    isDone: false,
    progress: 0,
    message: '',
    errorMessage: ''
  },
  joal: {
    isWaiting: true,
    isChecking: false,
    isDownloading: false,
    isDone: false,
    progress: 0,
    message: '',
    errorMessage: ''
  },
  jre: {
    isWaiting: true,
    isChecking: false,
    isDownloading: false,
    isDone: false,
    progress: 0,
    message: '',
    errorMessage: ''
  },
  global: {
    errorMessage: ''
  }
};

const handlers = {
  [ELECTRON_CHECKING_FOR_UPDATE](state) {
    return update(state, {
      electronApp: {
        isWaiting: { $set: false },
        isChecking: { $set: true },
        isDownloading: { $set: false },
        isDone: { $set: false }
      }
    });
  },
  [ELECTRON_UP_TO_DATE](state, action) {
    return update(state, {
      electronApp: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Version ${action.version} up to date` }
      }
    });
  },
  [ELECTRON_DOWNLOAD_PROGRESS](state, action) {
    return update(state, {
      electronApp: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: action.progress !== 100 },
        isDone: { $set: action.progress === 100 },
        progress: { $set: action.progress }
      }
    });
  },
  [ELECTRON_HAS_UPDATED](state, action) {
    return update(state, {
      electronApp: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Updated to version ${action.version}` }
      }
    });
  },
  [ELECTRON_UPDATE_ERROR](state, action) {
    return update(state, {
      electronApp: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: false },
        progress: { $set: 100 },
        errorMessage: { $set: `Error while updating: ${action.errMessage}` }
      }
    });
  },
  [JOAL_CHECKING_FOR_UPDATE](state) {
    return update(state, {
      joal: {
        isWaiting: { $set: false },
        isChecking: { $set: true },
        isDownloading: { $set: false },
        isDone: { $set: false }
      }
    });
  },
  [JOAL_UP_TO_DATE](state, action) {
    return update(state, {
      joal: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Version ${action.version} up to date` }
      }
    });
  },
  [JOAL_DOWNLOAD_PROGRESS](state, action) {
    return update(state, {
      joal: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: action.progress !== 100 },
        isDone: { $set: action.progress === 100 },
        progress: { $set: action.progress }
      }
    });
  },
  [JOAL_HAS_UPDATED](state, action) {
    return update(state, {
      joal: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Updated to version ${action.version}` }
      }
    });
  },
  [JOAL_UPDATE_ERROR](state, action) {
    return update(state, {
      joal: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: false },
        progress: { $set: 100 },
        errorMessage: { $set: `Error while updating: ${action.errMessage}` }
      }
    });
  },
  [JRE_CHECKING_FOR_UPDATE](state) {
    return update(state, {
      jre: {
        isWaiting: { $set: false },
        isChecking: { $set: true },
        isDownloading: { $set: false },
        isDone: { $set: false }
      }
    });
  },
  [JRE_UP_TO_DATE](state, action) {
    return update(state, {
      jre: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Version ${action.version} up to date` }
      }
    });
  },
  [JRE_DOWNLOAD_PROGRESS](state, action) {
    return update(state, {
      jre: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: action.progress !== 100 },
        isDone: { $set: action.progress === 100 },
        progress: { $set: action.progress }
      }
    });
  },
  [JRE_HAS_UPDATED](state, action) {
    return update(state, {
      jre: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: true },
        progress: { $set: 100 },
        message: { $set: `Updated to version ${action.version}` }
      }
    });
  },
  [JRE_UPDATE_ERROR](state, action) {
    return update(state, {
      jre: {
        isWaiting: { $set: false },
        isChecking: { $set: false },
        isDownloading: { $set: false },
        isDone: { $set: false },
        progress: { $set: 100 },
        errorMessage: { $set: `Error while updating: ${action.errMessage}` }
      }
    });
  },
  [UPDATE_PROCESS_ERROR](state, action) {
    return update(state, {
      global: {
        errorMessage: { $set: `Error: ${action.errMessage}` }
      }
    });
  }
};

export default createReducer(initialState, handlers);
