// Wrapper for Promise
import fs from 'fs';
import _rmdir from 'rmdir';

/* Remove a directory and all of his content (no error if not exist) */
const rmdirSafe = (path, options = {}) => {
  if (!fs.existsSync(path)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    _rmdir(path, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default rmdirSafe;
