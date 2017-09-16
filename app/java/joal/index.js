/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import events from 'events';
import path from 'path';
import request from 'request';
import zlib from 'zlib'; // FIXME: apparament zlib est intégré a NodeJs, donc on peut peut être enlever la dep du package.json
import tar from 'tar-fs';
import mkdir from '../../utils/mkdir';
import rmdir from '../../utils/rmdir';
import cp from '../../utils/cp';
import {
  EVENT_JOAL_CHECK_FOR_UPDATES,
  EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED,
  EVENT_JOAL_INSTALLED,
  EVENT_JOAL_INSTALL_FAILED
} from './joalInstallerEvents';


export default class JoalUpdater extends events.EventEmitter {
  constructor(app) {
    // we can't import app here, because it change if called from main or renderer process
    //  so we get it as an argument
    super();
    const self = this;

    self.app = app;
    self.joalDir = path.join(app.getPath('userData'), 'joal-core');
    self.tempUpdateDir = path.join(self.joalDir, 'update-tmp');
    self.clientFilesDir = path.join(self.joalDir, 'clients');
    self.torrentsDir = path.join(self.joalDir, 'torrents');
    self.archivedTorrentsDir = path.join(self.torrentsDir, 'archived');
    self.joalCoreVersionFile = path.join(self.joalDir, '.joal-core');
    self.joalCoreVersion = '2.0.0';
    self.jarName = `jack-of-all-trades-${self.joalCoreVersion}.jar`;
    self.downloadUrl = `https://github.com/anthonyraymond/joal/releases/download/v${self.joalCoreVersion}/joal.tar.gz`;
  }

  getJoalJarName() {
    return this.jarName;
  }

  _isLocalInstalled() {
    const self = this;

    // check for joal directory
    if (!fs.existsSync(self.joalDir)) return false;
    // check for jar
    if (!fs.existsSync(path.join(self.joalDir, self.jarName))) return false;

    // check for client files
    if (!fs.existsSync(self.clientFilesDir)) return false;
    const areClientFilesPresents = fs.readdirSync(self.clientFilesDir).filter(fileName =>
      fileName.endsWith('.client')
    ).length > 0;
    if (!areClientFilesPresents) return false;

    // check for torrents folder
    if (!fs.existsSync(self.torrentsDir)) return false;

    // check config.json
    if (!fs.existsSync(path.join(self.joalDir, 'config.json'))) return false;

    // check if the version file is present, and it the version matches
    if (!fs.existsSync(self.joalCoreVersionFile)) return false;
    if (fs.readFileSync(self.joalCoreVersionFile, { encoding: 'utf8' }) !== self.joalCoreVersion) return false;

    return true;
  }

  async _cleanJoalFolder() {
    // Remvoe everything but 'config.json' and 'torrents' folder
    const self = this;

    const jarFilesPromises = [];
    if (fs.existsSync(self.joalDir)) {
      fs.readdirSync(self.joalDir) // delete all .jar
        .filter(fileName => fileName.endsWith('.jar'))
        .map(jar => rmdir(path.join(self.joalDir, jar)))
        .forEach(promise => jarFilesPromises.push(promise));
    }

    await Promise.all([
      rmdir(self.tempUpdateDir),
      rmdir(self.clientFilesDir),
      rmdir(self.joalCoreVersionFile),
      ...jarFilesPromises
    ]);
  }

  installIfNeeded() {
    const self = this;

    self.emit(EVENT_JOAL_CHECK_FOR_UPDATES);

    return new Promise((resolve, reject) => {
      if (self._isLocalInstalled()) {
        self.emit(EVENT_JOAL_INSTALLED);
        resolve();
        return;
      }

      try {
        self._cleanJoalFolder();
      } catch (err) {
        self.emit(EVENT_JOAL_INSTALL_FAILED, `An error occured while cleaning JOAL folder before install: ${err}`);
        reject();
        return;
      }
      request.get({
        url: self.downloadUrl,
        rejectUnauthorized: false,
        agent: false,
        headers: {
          'user-agent': 'joal-desktop-initializer', // We pull GitHub, let's be nice and tell who we are.
          connection: 'keep-alive'
        }
      })
      .on('response', res => {
        // TODO: Si on tombe sur un 404, on arrive ici?
        const len = parseInt(res.headers['content-length'], 10);

        const hundredthOfLength = Math.floor(len / 100);
        let chunkDownloadedSinceLastEmit = 0;
        res.on('data', chunk => {
          chunkDownloadedSinceLastEmit += chunk.length;
          // We will report at top 100 events per download
          if (chunkDownloadedSinceLastEmit >= hundredthOfLength) {
            const downloadedBytes = chunkDownloadedSinceLastEmit;
            chunkDownloadedSinceLastEmit = 0;
            self.emit(EVENT_JOAL_DOWNLOAD_HAS_PROGRESSED, downloadedBytes, len);
          }
        });
      })
      .on('error', err => {
        self.emit(EVENT_JOAL_INSTALL_FAILED, `Failed to download archive: ${err}`);
        self._cleanJoalFolder();
        reject();
      })
      .pipe(zlib.createUnzip())
      .pipe(tar.extract(self.tempUpdateDir))
      .on('finish', () => { // FIXME: does 'end' set a param? maybe an error message on fail.
        // delete the old clients folder
        cp(path.join(self.tempUpdateDir, 'clients'), self.clientFilesDir)
        .then(() => {
          // get previous config.json (if exists)
          const oldJsonConfigFile = path.join(self.joalDir, 'config.json');
          const newJsonConfigFile = path.join(self.tempUpdateDir, 'config.json');

          let oldConfig = {};
          if (fs.existsSync(oldJsonConfigFile)) {
            try {
              oldConfig = JSON.parse(fs.readFileSync(oldJsonConfigFile, { encoding: 'utf8' }));
            } catch (err) {} // eslint-disable-line no-empty
          }
          // get new config.json
          let newConfig;
          if (!fs.existsSync(newJsonConfigFile)) throw new Error(`File not found: ${newJsonConfigFile}`);
          try {
            newConfig = JSON.parse(fs.readFileSync(newJsonConfigFile, { encoding: 'utf8' }));
          } catch (err) {
            throw new Error(`Failed to parse new config.json: ${err}`);
          }

          // merge the two config (with old overriding new)
          const mergedConfig = Object.assign({}, newConfig, oldConfig);
          fs.writeFileSync(oldJsonConfigFile, JSON.stringify(mergedConfig, null, 2));
          return Promise.resolve();
        })
        .then(() => (
          // copy /update-tmp/.jar to /.jar
          Promise.all(fs.readdirSync(self.tempUpdateDir)
            .filter(fileName => fileName.endsWith('.jar'))
            .map(jar => cp(path.join(self.tempUpdateDir, jar), path.join(self.joalDir, jar)))
          )
        ))
        .then(() => (
          // remove temporary update folder
          rmdir(self.tempUpdateDir)
        ))
        .then(() => {
          // create torrent folder
          if (!fs.existsSync(self.torrentsDir)) return mkdir(self.torrentsDir);
          return Promise.resolve();
        })
        .then(() => {
          if (!fs.existsSync(self.archivedTorrentsDir)) return mkdir(self.archivedTorrentsDir);
          return Promise.resolve();
        })
        .then(() => {
          // write version file
          fs.writeFileSync(self.joalCoreVersionFile, self.joalCoreVersion);
          return Promise.resolve();
        })
        .then(() => {
          // eslint-disable-next-line promise/always-return
          if (self._isLocalInstalled()) {
            self.emit(EVENT_JOAL_INSTALLED);
            resolve();
          } else { // eslint-disable-line no-else-return
            throw new Error('Failed to validate joal deployement.');
          }
        })
        .catch((err) => {
          self.emit(EVENT_JOAL_INSTALL_FAILED, `An error occured while deploying JOAL: ${err}`);
          self._cleanJoalFolder();
          reject();
        });
      });
    });
  }

}
