// @flow
export const CHECKING_FOR_UPDATES = '@@joal/install/CHECKING_FOR_UPDATES';
export const DOWNLOAD_HAS_PROGRESSED = '@@joal/install/DOWNLOAD_HAS_PROGRESSED';
export const INSTALLED = '@@joal/install/INSTALLED';
export const INSTALL_FAILED = '@@joal/install/INSTALL_FAILED';

export function joalCheckingForUpdate() {
  return { type: CHECKING_FOR_UPDATES };
}

export function joalDownloadHasprogress(deltaDownloaded, totalSize) {
  return {
    type: DOWNLOAD_HAS_PROGRESSED,
    deltaDownloaded,
    totalSize
  };
}

export function joalIsInstalled() {
  return { type: INSTALLED };
}

export function joalInstallHasFailed(error) {
  return {
    type: INSTALL_FAILED,
    error
  };
}
