// @flow
export const CHECKING_FOR_UPDATES = '@@java/install/CHECKING_FOR_UPDATES';
export const DOWNLOAD_HAS_PROGRESSED = '@@java/install/DOWNLOAD_HAS_PROGRESSED';
export const INSTALLED = '@@java/install/INSTALLED';
export const INSTALL_FAILED = '@@java/install/INSTALL_FAILED';

export function jreCheckingForUpdate() {
  return { type: CHECKING_FOR_UPDATES };
}

export function jreDownloadHasprogress(deltaDownloaded, totalSize) {
  return {
    type: DOWNLOAD_HAS_PROGRESSED,
    deltaDownloaded,
    totalSize
  };
}

export function jreIsInstalled() {
  return { type: INSTALLED };
}

export function jreDownloadHasFailed(error) {
  return {
    type: INSTALL_FAILED,
    error
  };
}
