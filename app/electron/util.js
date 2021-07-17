import innerIsDev from 'electron-is-dev';

export function isDev() {
  return innerIsDev;
}

let innerLog;

if (isDev()) {
  innerLog = (...args) => {
    console.log(args);
  };
} else {
  const log = require('electron-log'); // eslint-disable-line no-shadow, global-require
  innerLog = log.info.bind(log);
}

export function log(...args) {
  innerLog(args);
}
