// Wrapper for Promise
import fs from 'fs';

/* Remove a directory and all of his content (no error if not exist) */
const cp = (path, mode = undefined) => (
  new Promise((resolve, reject) => {
    const callback = (err) => {
      if (err) reject(err);
      else resolve();
    };

    if (mode === undefined) fs.mkdir(path, callback);
    else fs.mkdir(path, mode, callback);
  })
);

export default cp;
