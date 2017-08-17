// @flow
export const READY = '@@joal/install/READY';
export const WILL_DOWNLOAD = '@@joal/install/WILL_DOWNLOAD';
export const DOWNLOAD_STARTED = '@@joal/install/DOWNLOAD_STARTED';
export const DOWNLOAD_HAS_PROGRESSED = '@@joal/install/DOWNLOAD_HAS_PROGRESSED';
export const INSTALL_FAILED = '@@joal/install/INSTALL_FAILED';


export function joalIsInstalled() {
  return { type: READY };
}

export function joalWillDownload() {
  return { type: WILL_DOWNLOAD };
}

export function joalStartedDownloading(length) {
  return {
    type: DOWNLOAD_STARTED,
    length
  };
}

export function joalDownloadHasprogress(deltaDownloaded) {
  return {
    type: DOWNLOAD_HAS_PROGRESSED,
    deltaDownloaded
  };
}

export function joalInstallHasFailed(error) {
  return {
    type: INSTALL_FAILED,
    error
  };
}
