// @flow
/* MIT License
 *
 * Copyright (c) 2016 schreiben, modified by anthony (allow install on runtime)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import os from 'os';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import tar from 'tar-fs';
import request from 'request';
import childProcess from 'child_process';
import events from 'events';
import { app } from 'electron';
import rmdir from '../../utils/rmdir';
import {
  JRE_READY,
  JRE_WILL_DOWNLOAD,
  JRE_START_DOWNLOAD,
  JRE_DOWNLOAD_HAS_PROGRESSED,
  JRE_DOWNLOAD_FAILED
} from './ipcEvents';

const majorVersion = '8';
const updateNumber = '144';
const buildNumber = '01';
const hash = '090f390dda5b47b9b721c7dfaa008135';
const version = `${majorVersion}u${updateNumber}`;
const javaVestionString = `1.${majorVersion}.0_${updateNumber}`;

const arch = () => {
  const architecture = os.arch();
  switch (architecture) {
    case 'x64': return architecture;
    case 'ia32': return 'i586';
    default: throw new Error(`unsupported architecture: ${architecture}`);
  }
};
const platform = () => {
  const systemPlatform = os.platform();
  switch (systemPlatform) {
    case 'darwin': return 'macosx';
    case 'win32': return 'windows';
    case 'linux': return systemPlatform;
    default: throw new Error(`unsupported platform: ${systemPlatform}`);
  }
};
const url = () => (
  `https://download.oracle.com/otn-pub/java/jdk/${version}-b${buildNumber}/${hash}/jre-${version}-${platform()}-${arch()}.tar.gz`
);

class JavaInstaller extends events.EventEmitter {
  constructor() {
    super();

    const self = this;
    self.jreDir = path.join(app.getPath('userData'), 'jre');
  }

  driver() {
    const self = this;
    // don't use platform() here, since the variable is renamed !
    const systemPlatform = os.platform();
    let driver;
    switch (systemPlatform) {
      case 'darwin': driver = ['Contents', 'Home', 'bin', 'java']; break;
      case 'win32': driver = ['bin', 'java.exe']; break;
      case 'linux': driver = ['bin', 'java']; break;
      default: throw new Error(`unsupported platform: ${systemPlatform}`);
    }

    const jreDirs = JavaInstaller.getDirectories(self.jreDir);
    if (jreDirs.length < 1) throw new Error('no jre found');
    const d = driver.slice();
    d.unshift(jreDirs[0]);
    d.unshift(self.jreDir);
    return path.join(...d);
  }

  static getDirectories(dirPath) {
    return fs.readdirSync(dirPath).filter(file =>
      fs.statSync(path.join(dirPath, file)).isDirectory()
    );
  }

  spawnSync() {
    const self = this;
    return childProcess.spawnSync(self.driver(), ['-version'], { encoding: 'utf8' });
  }

  isJavaInstalled() {
    const self = this;
    const javaResponse = childProcess.spawnSync(
      self.driver(),
      ['-version'],
      { encoding: 'utf8' } // this is not a jvm param, it tells childProcess to return raw text instead of a Buffer
    );
    // java -version output is printed to stderr, not a "bug" and Oracle Win't fix : http://bugs.java.com/bugdatabase/view_bug.do?bug_id=4380614
    return javaResponse.stderr && javaResponse.stderr.startsWith(`java version "${javaVestionString}"`);
  }

  async installIfRequired() {
    const self = this;

    try {
      if (self.isJavaInstalled()) {
        self.emit(JRE_READY);
        return;
      }
    } catch (err) {
      // Will fail if java is missing, handling all cases are a pain in the ass, better catch ex
      // If java is not installed skip this and install.
    }

    self.emit(JRE_WILL_DOWNLOAD);

    try {
      await rmdir(self.jreDir);
    } catch (err) {
      self.emit(JRE_DOWNLOAD_FAILED, `An error occured while removing JRE folder before install: ${err.message}`);
      return;
    }

    request
      .get({
        url: url(),
        rejectUnauthorized: false,
        agent: false,
        headers: {
          connection: 'keep-alive',
          Cookie: 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie'
        }
      })
      .on('response', res => {
        const len = parseInt(res.headers['content-length'], 10);
        self.emit(JRE_START_DOWNLOAD, len);

        const hundredthOfLength = Math.floor(len / 100);
        let chunkDownloadedSinceLastEmit = 0;
        res.on('data', chunk => {
          chunkDownloadedSinceLastEmit += chunk.length;
          // We will report at top 100 events per download
          if (chunkDownloadedSinceLastEmit >= hundredthOfLength) {
            const downloadedBytes = chunkDownloadedSinceLastEmit;
            chunkDownloadedSinceLastEmit = 0;
            self.emit(JRE_DOWNLOAD_HAS_PROGRESSED, downloadedBytes);
          }
        });
      })
      .on('error', err => {
        self.emit(JRE_DOWNLOAD_FAILED, err.message);
        rmdir(self.jreDir);
      })
      .pipe(zlib.createUnzip())
      .pipe(tar.extract(self.jreDir))
      .on('finish', () => {
        try {
          if (self.isJavaInstalled()) self.emit(JRE_READY);
          else self.emit(JRE_DOWNLOAD_FAILED, 'Failed to validate jre install:', 'JRE seems not to be installed');
        } catch (err) {
          self.emit(JRE_DOWNLOAD_FAILED, 'Failed to validate jre install:', err.message);
        }
      });
  }
}

export default JavaInstaller;
