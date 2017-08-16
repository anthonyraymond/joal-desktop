/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import events from 'events';
import path from 'path';
import request from 'request';
import zlib from 'zlib'; // FIXME: apparament zlib est intégré a NodeJs, donc on peut peut être enlever la dep du package.json
import tar from 'tar-fs';
import { app } from 'electron';
import mkdir from '../../utils/mkdir';
import rmdir from '../../utils/rmdir';
import cp from '../../utils/cp';
import {
  JOAL_INSTALL_FAILED
} from './joalInstallerEvents';


export default class JoalUpdater extends events.EventEmitter {
  constructor() {
    super();

    const self = this;
    self.joalDir = path.join(app.getPath('userData'), 'joal-core');
    self.tempUpdateDir = path.join(self.joalDir, 'update-tmp');
    self.clientFilesDir = path.join(self.joalDir, 'clients');
    self.torrentsDir = path.join(self.joalDir, 'torrents');
    self.archivedTorrentsDir = path.join(self.torrentsDir, 'archived');
    self.joalCoreVersionFile = path.join(self.joalDir, '.joal-core');
    self.joalCoreVersion = '1.0.3';
    self.downloadUrl = `https://github.com/anthonyraymond/joal/releases/download/${self.joalCoreVersion}/test-do-not-download.tar.gz`;
  }

  _isLocalInstalled() {
    const self = this;

    // check for jar
    if (!fs.existsSync(self.joalDir)) return false;
    const isJarPresent = fs.readdirSync(self.joalDir).filter(fileName =>
      fileName.endsWith('.jar')
    ).length > 0;
    if (!isJarPresent) return false;

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

  async installIfNeeded() {
    const self = this;

    if (self._isLocalInstalled()) {
      console.log('already installed');
      // TODO: dispatch JOAL ready
      return;
    }

    // FIXME: this.eventSender.send(JRE_WILL_DOWNLOAD);

    const oldJsonConfigFile = path.join(self.joalDir, 'config.json');
    const newJsonConfigFile = path.join(self.tempUpdateDir, 'config.json');

    await rmdir(self.tempUpdateDir);

    let i = 0;
    let chuckBuffer = 0;

    request.get({
      url: self.downloadUrl,
      rejectUnauthorized: false,
      agent: false,
      headers: {
        'User-Agent': 'Joal Desktop', // We pull GitHub, let's be nice and tell who we are.
        connection: 'keep-alive'
      }
    })
    .on('response', res => {
      const len = parseInt(res.headers['content-length'], 10);
      // FIXME: this.eventSender.send(JRE_START_DOWNLOAD, len);
      res.on('data', chunk => {
        i += 1;
        chuckBuffer += chunk.length;
        if (i >= 200) {
          // FIXME: this.eventSender.send(JRE_DOWNLOAD_HAS_PROGRESSED, chuckBuffer);
          i = 0;
          chuckBuffer = 0;
        }
      });
    })
    .on('error', err => {
      self.emit(JOAL_INSTALL_FAILED, `Failed to download archive: ${err}`);
      // TODO: remove all but config.json
      rmdir(self.joalDir);
      // FIXME: this.eventSender.send(JRE_DOWNLOAD_FAILED, err.message);
    })
    .pipe(zlib.createUnzip())
    .pipe(tar.extract(self.tempUpdateDir, {
      ignore: (name, header) => header.type === 'directory' && name === 'torrents'
    }))
    .on('finish', () => { // FIXME: does 'end' set a param? maybe an error message on fail.
      // delete the old clients folder
      rmdir(self.clientFilesDir).then(() => (
        cp(path.join(self.tempUpdateDir, 'clients'), self.clientFilesDir)
      ))
      .then(() => { /* eslint-disable promise/always-return */
        // get previous config.json (if exists)
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
        // TODO: check if deleting first is needed
        fs.writeFileSync(oldJsonConfigFile, JSON.stringify(mergedConfig, null, 2));
      }) /* eslint-enable promise/always-return */
      .then(() => (
        // delete .jar
        Promise.all(fs.readdirSync(self.joalDir)
          .filter(fileName => fileName.endsWith('.jar'))
          .map(jar => rmdir(path.join(self.joalDir, jar)))
        )
      ))
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
        const promises = [];
        if (!fs.existsSync(self.torrentsDir)) promises.push(mkdir(self.torrentsDir));
        // eslint-disable-next-line max-len
        if (!fs.existsSync(self.archivedTorrentsDir)) promises.push(mkdir(self.archivedTorrentsDir));
        return Promise.all(promises);
      })
      .then(() => { // eslint-disable-line promise/always-return
        fs.writeFileSync(self.joalCoreVersionFile, self.joalCoreVersion);
      }) /* eslint-enable promise/always-return */
      .then(() => { /* eslint-disable promise/always-return */
        if (self._isLocalInstalled()) {
          // FIXME: this.eventSender.send(JRE_READY);
          console.log('install succeed');
        } else {
          console.log('install failed');
          throw new Error('Failed to validate joal deployement.');
        }
      })
      .catch((err) => {
        self.emit(JOAL_INSTALL_FAILED, `An error occured while deploying JOAL: ${err}`);
        // TODO: remove all but config.json
        console.log(err);
        rmdir(self.joalDir);
      });
    });
  }

}
