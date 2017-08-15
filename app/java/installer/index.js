import os from 'os';
import fs from 'fs';
import path from 'path';
import rmdir from 'rmdir';
import zlib from 'zlib';
import tar from 'tar-fs';
import request from 'request';
import childProcess from 'child_process';
import { app } from 'electron';

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

  installIfRequired(callbackP) {
    const callback = callbackP || (() => {});

    if (this.isJavaInstalled()) {
      callback();
      return;
    }

    const urlStr = this.url();
    console.log(`Downloading from: ${urlStr}`);
    console.log(`Will install in ${this.jreDir}`);
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
      })/*
      .on('response', res => {
        const len = parseInt(res.headers['content-length'], 10);
        const bar = new ProgressBar('  downloading and preparing JRE [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 80,
          total: len
        });
        res.on('data', chunk => bar.tick(chunk.length));
      })*/
      .on('error', err => {
        // TODO: dispatch error?
        console.log(`problem with request: ${err.message}`);
        callback(err);
      })
      .on('end', () => { if (this.isJavaInstalled()) callback(); else callback('Smoketest failed.'); })
      .pipe(zlib.createUnzip())
      .pipe(tar.extract(this.jreDir));
  }
}

export default JavaInstaller;
