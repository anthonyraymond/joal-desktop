// Wrapper for Promise
import _ncp from 'ncp';

/* Remove a directory and all of his content (no error if not exist) */
const cp = (src, dest, options = {}) => (
  new Promise((resolve, reject) => {
    _ncp(src, dest, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
);

export default cp;
