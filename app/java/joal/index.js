/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import events from 'events';
import path from 'path';
import { app } from 'electron';


export default class JoalUpdater extends events.EventEmitter {
  constructor() {
    super();

    const self = this;
    self.joalDir = path.join(app.getPath('userData'), 'joal');
    self.downloadUrl = 'https://github.com/anthonyraymond/joal/releases/download/1.0.3/jack-of-all-trades-1.0.3.tar.gz';
  }

  _isLocalInstalled() {
    if (fs.existsSync(this.joalDir)) return false;
    const jarFiles = fs.readdirSync(this.joalDir).filter(fileName =>
      fileName.endsWith('.jar')
    );
    if (jarFiles.length === 0) return false;

    return true;
  }
  /*
  _getLocalVersion() {
    if (fs.existsSync(this.joalDir)) return '0.0.0';
    const jarFiles = fs.readdirSync(this.joalDir).filter(fileName =>
      fileName.endsWith('.jar')
    );
    if (jarFiles.length === 0) return '0.0.0';

    const match = /.*?([0-9]+\.[0-9]+\.[0-9]+)\.jar/.exec(jarFiles[0]);
    if (!match[1]) return '0.0.0';
    return match[1];
  }

  _getLatestTagVersion() {
    const url = `${this.repoUrl}/releases/latest`;
    return got.head(url, { headers: { 'User-Agent': 'joal-desktop' } })
      .then(res => {
        const latestTag = res.socket._httpMessage.path.split('/').pop();
        return latestTag;
      })
      .catch(err => {
        if (err) throw new Error('Unable to get latest release tag from Github.');
      });
  }*/

  installIfNeeded() {
    if (this._isLocalInstalled()) {
      // TODO: dispatch JOAL ready
      return;
    }

    // NOTE: events examples https://github.com/Gozala/events/blob/master/tests/check-listener-leaks.js
    // NOTE: pour dispatch => this.emit('event-name', args)

    // TODO: download joal tar.gz
    // TODO: unzip to /update-tmp
    // TODO: delete folder /clients
    // TODO: copy /update-tmp/clients to /clients
    // TODO: delete .jar
    // TODO: copy /update-tmp/.jar to /.jar
    // TODO: delete folder /update-tmp
  }


}
