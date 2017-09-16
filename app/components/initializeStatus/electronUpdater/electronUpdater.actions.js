// @flow
export const CHECKING_FOR_UPDATE = '@@electronUpdater/update/CHECKING_FOR_UPDATE';
export const DOWNLOAD_HAS_PROGRESSED = '@@electronUpdater/update/DOWNLOAD_HAS_PROGRESSED';
export const INSTALLED = '@@electronUpdater/update/INSTALLED';
export const INSTALL_FAILED = '@@electronUpdater/update/INSTALL_FAILED';


export function electronUpdaterCheckingForUpdate() {
  return {
    type: CHECKING_FOR_UPDATE
  };
}

export function electronUpdaterDownloadHasprogress(bytesDownloaded, totalSize) {
  return {
    type: DOWNLOAD_HAS_PROGRESSED,
    bytesDownloaded,
    totalSize
  };
}

export function electronUpdaterIsInstalled() {
  return { type: INSTALLED };
}

export function electronUpdaterInstallHasFailed(error) {
  return {
    type: INSTALL_FAILED,
    error
  };
}
