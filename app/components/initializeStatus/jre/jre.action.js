// @flow
export const JRE_READY = '@@java/install/JRE_READY';
export const JRE_WILL_DOWNLOAD = '@@java/install/JRE_WILL_DOWNLOAD';
export const JRE_START_DOWNLOAD = '@@java/install/JRE_START_DOWNLOAD';
export const JRE_DOWNLOAD_HAS_PROGRESSED = '@@java/install/JRE_DOWNLOAD_HAS_PROGRESSED';
export const JRE_DOWNLOAD_FAILED = '@@java/install/JRE_DOWNLOAD_FAILED';


export function jreIsReady() {
  return { type: JRE_READY };
}

export function jreWillDownload() {
  return { type: JRE_WILL_DOWNLOAD };
}

export function jreStartedDownloading(length) {
  return {
    type: JRE_START_DOWNLOAD,
    length
  };
}

export function jreDownloadHasprogress(deltaDownloaded) {
  return {
    type: JRE_DOWNLOAD_HAS_PROGRESSED,
    deltaDownloaded
  };
}

export function jreDownloadHasFailed(error) {
  return {
    type: JRE_DOWNLOAD_FAILED,
    error
  };
}
