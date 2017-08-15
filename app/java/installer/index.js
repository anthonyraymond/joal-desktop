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
import rmdir from 'rmdir';
import zlib from 'zlib';
import tar from 'tar-fs';
import request from 'request';
import childProcess from 'child_process';
import { app } from 'electron';
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

class JavaInstaller {
  constructor(reduxStore) {
    this.redduxStore = reduxStore;
    this.jreDir = path.join(app.getPath('userData'), 'jre');
  }

  arch() {
    const arch = os.arch();
    switch (arch) {
      case 'x64': return arch;
      case 'ia32': return 'i586';
      default: this.fail(`unsupported architecture: ${arch}`);
    }
  }
  platform() {
    const platform = os.platform();
    switch (platform) {
      case 'darwin': return 'macosx';
      case 'win32': return 'windows';
      case 'linux': return platform;
      default: this.fail(`unsupported platform: ${platform}`);
    }
  }
  driver() {
    // don't use this.platform() here, since the variable is renamed !
    const platform = os.platform();
    let driver;
    switch (platform) {
      case 'darwin': driver = ['Contents', 'Home', 'bin', 'java']; break;
      case 'win32': driver = ['bin', 'java.exe']; break;
      case 'linux': driver = ['bin', 'java']; break;
      default: this.fail(`unsupported platform: ${platform}`);
    }

    const jreDirs = JavaInstaller.getDirectories(this.jreDir);
    if (jreDirs.length < 1) this.fail('no jre found in archive');
    const d = driver.slice();
    d.unshift(jreDirs[0]);
    d.unshift(this.jreDir);
    return path.join(...d);
  }

  fail(reason) {
    // TODO: dispatch error
    // TODO : throw exception to stop
    console.error(reason);
  }

  static getDirectories(dirPath) {
    return fs.readdirSync(dirPath).filter(file =>
      fs.statSync(path.join(dirPath, file)).isDirectory()
    );
  }

  spawnSync() {
    return childProcess.spawnSync(this.driver(), ['-version'], { encoding: 'utf8' });
  }

  isJavaInstalled() {
    try {
      const javaResponse = childProcess.spawnSync(
        this.driver(),
        ['-version'],
        { encoding: 'utf8' } // this is not a jvm param, it tells childProcess to return raw text instead of a Buffer
      );
      // java -version output is printed to stderr, not a "bug" and Oracle Win't fix : http://bugs.java.com/bugdatabase/view_bug.do?bug_id=4380614
      return javaResponse.stderr && javaResponse.stderr.startsWith(`java version "${javaVestionString}"`);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  url() {
    return `https://download.oracle.com/otn-pub/java/jdk/${version}-b${buildNumber}/${hash}/jre-${version}-${this.platform()}-${this.arch()}.tar.gz`;
  }

  installIfRequired(eventSender) {
    if (this.isJavaInstalled()) {
      eventSender.send(JRE_READY);
      return;
    }

    eventSender.send(JRE_WILL_DOWNLOAD);
    let i = 0;
    let chuckBuffer = 0;
    rmdir(this.jreDir);
    request
      .get({
        url: this.url(),
        rejectUnauthorized: false,
        agent: false,
        headers: {
          connection: 'keep-alive',
          Cookie: 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie'
        }
      })
      .on('response', res => {
        const len = parseInt(res.headers['content-length'], 10);
        eventSender.send(JRE_START_DOWNLOAD, len);

        res.on('data', chunk => {
          i += 1;
          chuckBuffer += chunk.length;
          if (i >= 200) {
            eventSender.send(JRE_DOWNLOAD_HAS_PROGRESSED, chuckBuffer);
            i = 0;
            chuckBuffer = 0;
          }
        });
      })
      .on('error', err => {
        eventSender.send(JRE_DOWNLOAD_FAILED, err);
      })
      .on('end', () => {
        if (this.isJavaInstalled()) {
          eventSender.send(JRE_READY);
        } else {
          eventSender.send(JRE_DOWNLOAD_FAILED, 'Failed to validate jre install');
        }
      })
      .pipe(zlib.createUnzip())
      .pipe(tar.extract(this.jreDir));
  }
}

export default JavaInstaller;
