export const ELECTRON_CHECKING_FOR_UPDATE =
  '@@updaters/electron/CHECKING_FOR_UPDATE';
export const ELECTRON_UP_TO_DATE = '@@updaters/electron/ALREADY_UP_TO_DATE';
export const ELECTRON_DOWNLOAD_PROGRESS =
  '@@updaters/electron/DOWNLOAD_PROGRESS';
export const ELECTRON_HAS_UPDATED = '@@updaters/electron/HAS_UPDATED';
export const ELECTRON_UPDATE_ERROR = '@@updaters/electron/UPDATE_ERROR';

export const JOAL_CHECKING_FOR_UPDATE = '@@updaters/joal/CHECKING_FOR_UPDATE';
export const JOAL_UP_TO_DATE = '@@updaters/joal/ALREADY_UP_TO_DATE';
export const JOAL_DOWNLOAD_PROGRESS = '@@updaters/joal/DOWNLOAD_PROGRESS';
export const JOAL_HAS_UPDATED = '@@updaters/joal/HAS_UPDATED';
export const JOAL_UPDATE_ERROR = '@@updaters/joal/UPDATE_ERROR';

export const JRE_CHECKING_FOR_UPDATE = '@@updaters/jre/CHECKING_FOR_UPDATE';
export const JRE_UP_TO_DATE = '@@updaters/jre/ALREADY_UP_TO_DATE';
export const JRE_DOWNLOAD_PROGRESS = '@@updaters/jre/DOWNLOAD_PROGRESS';
export const JRE_HAS_UPDATED = '@@updaters/jre/HAS_UPDATED';
export const JRE_UPDATE_ERROR = '@@updaters/jre/UPDATE_ERROR';

export const UPDATE_PROCESS_DONE = '@@updaters/all/UPDATE_PROCESS_DONE';
export const UPDATE_PROCESS_ERROR = '@@updaters/all/UPDATE_PROCESS_ERROR';

export const electronCheckingForUpdate = () => ({
  type: ELECTRON_CHECKING_FOR_UPDATE
});
export const electronUpToDate = version => ({
  type: ELECTRON_UP_TO_DATE,
  version
});
export const electronDownloadProgress = progress => ({
  type: ELECTRON_DOWNLOAD_PROGRESS,
  progress
});
export const electronHasUpdated = version => ({
  type: ELECTRON_HAS_UPDATED,
  version
});
export const electronUpdateError = errMessage => ({
  type: ELECTRON_UPDATE_ERROR,
  errMessage
});

export const joalCheckingForUpdate = () => ({
  type: JOAL_CHECKING_FOR_UPDATE
});
export const joalUpToDate = version => ({
  type: JOAL_UP_TO_DATE,
  version
});
export const joalDownloadProgress = progress => ({
  type: JOAL_DOWNLOAD_PROGRESS,
  progress
});
export const joalHasUpdated = version => ({
  type: JOAL_HAS_UPDATED,
  version
});
export const joalUpdateError = errMessage => ({
  type: JOAL_UPDATE_ERROR,
  errMessage
});

export const jreCheckingForUpdate = () => ({
  type: JRE_CHECKING_FOR_UPDATE
});
export const jreUpToDate = version => ({
  type: JRE_UP_TO_DATE,
  version
});
export const jreDownloadProgress = progress => ({
  type: JRE_DOWNLOAD_PROGRESS,
  progress
});
export const jreHasUpdated = version => ({
  type: JRE_HAS_UPDATED,
  version
});
export const jreUpdateError = errMessage => ({
  type: JRE_UPDATE_ERROR,
  errMessage
});

export const updateProcessDone = () => ({
  type: UPDATE_PROCESS_DONE
});
export const updateProcessError = errMessage => ({
  type: UPDATE_PROCESS_ERROR,
  errMessage
});
