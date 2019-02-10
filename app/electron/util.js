import innerIsDev from 'electron-is-dev';

export function isDev() {
  return innerIsDev;
}

let innerLog: (...args: any[]) => void;

if (isDev()) {
  innerLog = (...args: any[]): void => {
    console.log(args);
  };
} else {
  const log = require('electron-log'); // eslint-disable-line no-shadow, global-require
  innerLog = log.info.bind(log);
}

export function log(...args: any[]): void {
  innerLog(args);
}
