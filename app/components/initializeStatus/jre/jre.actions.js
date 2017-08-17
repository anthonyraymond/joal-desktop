// @flow
export const INSTALLED = '@@java/install/INSTALLED';
export const WILL_DOWNLOAD = '@@java/install/WILL_DOWNLOAD';
export const DOWNLOAD_STARTED = '@@java/install/DOWNLOAD_STARTED';
export const DOWNLOAD_HAS_PROGRESSED = '@@java/install/DOWNLOAD_HAS_PROGRESSED';
export const INSTALL_FAILED = '@@java/install/INSTALL_FAILED';


export function jreIsInstalled() {
  return { type: INSTALLED };
}

export function jreWillDownload() {
  return { type: WILL_DOWNLOAD };
}

export function jreDownloadStarted(length) {
  return {
    type: DOWNLOAD_STARTED,
    length
  };
}

export function jreDownloadHasprogress(deltaDownloaded) {
  return {
    type: DOWNLOAD_HAS_PROGRESSED,
    deltaDownloaded
  };
}

export function jreDownloadHasFailed(error) {
  return {
    type: INSTALL_FAILED,
    error
  };
}
