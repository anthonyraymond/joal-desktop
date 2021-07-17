import os from 'os';
import { app } from 'electron';
import path from 'path';
import request from 'request';
import fs from 'fs';
import rimraf from 'rimraf';
import gunzipMaybe from 'gunzip-maybe';
import tar from 'tar-fs';
import PProgress from 'p-progress';
import childProcess from 'child_process';
import unzipper from 'unzipper';

const ROOT_INSTALL_FOLDER = path.join(app.getPath('userData'), 'jre');
const JRE_MAJOR_VERSION = '11';
const JRE_MINOR_NUMBER = '0';
const JRE_PATCH_NUMBER = '11';
const JRE_BUILD_NUMBER = '9';
const JAVA_VERSION_STRING = `${JRE_MAJOR_VERSION}.${JRE_MINOR_NUMBER}.${JRE_PATCH_NUMBER}+${JRE_BUILD_NUMBER}`;

const systemPlatform = os.platform();

const download = (resolve, reject, progress) => {
  let patformName = '';
  let downloadedArchiveExtension = 'tar.gz';
  switch (systemPlatform) {
    case 'darwin':
      patformName = 'mac';
      downloadedArchiveExtension = 'tar.gz';
      break;
    case 'win32':
      patformName = 'windows';
      downloadedArchiveExtension = 'zip';
      break;
    case 'linux':
      patformName = 'linux';
      downloadedArchiveExtension = 'tar.gz';
      break;
    default:
      throw new Error(`unsupported platform: ${systemPlatform}`);
  }

  const url = `https://github.com/AdoptOpenJDK/openjdk11-binaries/releases/download/jdk-${JRE_MAJOR_VERSION}.${JRE_MINOR_NUMBER}.${JRE_PATCH_NUMBER}%2B${JRE_BUILD_NUMBER}/OpenJDK11U-jre_x64_${patformName}_hotspot_${JRE_MAJOR_VERSION}.${JRE_MINOR_NUMBER}.${JRE_PATCH_NUMBER}_${JRE_BUILD_NUMBER}.${downloadedArchiveExtension}`;

  let downloaded = 0;
  let totalDownloadLength = 0;
  let hundredthOfTotalDownloadlength = 0;
  let downloadedSinceLastProgressReport = 0;

  console.log(`download jre from: ${url}`);
  return request(url)
    .on('error', e => {
      console.log('Failed to download JRE:', e);
      cleanInstallFolder();
      reject(e);
    })
    .on('response', res => {
      if (res.statusCode !== 200) {
        reject(`Failed to download JRE: status code is ${res.statusCode}`);
      }
      totalDownloadLength = parseInt(res.headers['content-length'], 10);
      hundredthOfTotalDownloadlength = Math.floor(totalDownloadLength / 100);
    })
    .on('data', chunk => {
      downloaded += chunk.length;
      downloadedSinceLastProgressReport += chunk.length;
      // Report at max 100 events per download
      if (downloadedSinceLastProgressReport >= hundredthOfTotalDownloadlength) {
        downloadedSinceLastProgressReport = 0;
        progress(downloaded / totalDownloadLength);
      }
    })
    .on('end', () => {
      // Do not send the progress(1) it's automatically sent on resolve() call
      console.log('Successfully downloaded jre archive');
    });
};

const extract = (resolve, reject) => {
  let extractorStream;
  const pathInArchive = {
    win: [],
    mac: ['Contents', 'Home'],
    linux: []
  };

  switch (systemPlatform) {
    case 'darwin':
      extractorStream = tar.extract(ROOT_INSTALL_FOLDER, {
        ignore: (_, header) => {
          let filepath = header.name.replace(/j.*?\//, '');
          pathInArchive.mac.forEach(p => {
            filepath = filepath.replace(new RegExp(`${p}/`, 'g'), '');
          });

          return filepath === '';
        },
        map: header => {
          // trim the folder named after the jre version (jdk-11.0.11+9-jre or so)
          let filepath = header.name.replace(/j.*?\//, '');
          pathInArchive.mac.forEach(p => {
            filepath = filepath.replace(new RegExp(`${p}/`, 'g'), '');
          });

          header.name = filepath; // eslint-disable-line no-param-reassign
          return header;
        }
      });
      break;
    case 'win32':
      extractorStream = unzipper.Parse().on('entry', entry => {
        // trim the folder named after the jre version (jdk-11.0.11+9-jre or so)
        let filepath = entry.path.replace(/j.*?\//, '');
        pathInArchive.win.forEach(p => {
          filepath = filepath.replace(new RegExp(`${p}/`, 'g'), '');
        });

        if (filepath === '') {
          entry.autodrain();
        } else if (entry.type === 'Directory') {
          fs.mkdirSync(path.join(ROOT_INSTALL_FOLDER, filepath));
        } else {
          entry.pipe(
            fs.createWriteStream(path.join(ROOT_INSTALL_FOLDER, filepath))
          );
        }
      });
      break;
    case 'linux':
      extractorStream = tar.extract(ROOT_INSTALL_FOLDER, {
        ignore: (_, header) => {
          let filepath = header.name.replace(/j.*?\//, '');
          pathInArchive.linux.forEach(p => {
            filepath = filepath.replace(new RegExp(`${p}/`, 'g'), '');
          });
          return filepath === '';
        },
        map: header => {
          // trim the folder named after the jre version (jdk-11.0.11+9-jre or so)
          let filepath = header.name.replace(/j.*?\//, '');
          pathInArchive.linux.forEach(p => {
            filepath = filepath.replace(new RegExp(`${p}/`, 'g'), '');
          });

          header.name = filepath; // eslint-disable-line no-param-reassign
          return header;
        }
      });
      break;
    default:
      throw new Error(`unsupported platform: ${systemPlatform}`);
  }

  return extractorStream
    .on('error', e => {
      console.log('Failed to extract jre', e);
      cleanInstallFolder();
      reject(e);
    })
    .on('end', () => {
      console.log('Successfully extracted jre');
    });
};

export const getJreBinaryPath = () =>
  path.join(ROOT_INSTALL_FOLDER, 'bin', 'java');

const isInstalledAndDoesNotRequiresUpdates = () => {
  const javaResponse = childProcess.spawnSync(
    getJreBinaryPath(),
    ['-version'],
    { encoding: 'utf8' } // this is not a jvm param, it tells childProcess to return raw text instead of a Buffer
  );

  // java -version output is printed to stderr, not a "bug" and Oracle Win't fix : http://bugs.java.com/bugdatabase/view_bug.do?bug_id=4380614
  if (!javaResponse.stderr || javaResponse.stderr.length < 1) {
    console.log('java -version returned an empty string, not installed');
    return false;
  }

  if (!javaResponse.stderr.includes(JAVA_VERSION_STRING)) {
    console.log(
      `The output of java-version didn\t contains ${JAVA_VERSION_STRING}, output of the command was:`,
      javaResponse.stderr
    );
    return false;
  }
  return true;
};

const cleanInstallFolder = () => {
  if (fs.existsSync(ROOT_INSTALL_FOLDER)) {
    rimraf.sync(ROOT_INSTALL_FOLDER);
  }
};

const install = () =>
  new PProgress((resolve, reject, progress) => {
    console.log('Asked to install jre');
    if (isInstalledAndDoesNotRequiresUpdates()) {
      console.log('Jre is already installed and does not needs to update');
      resolve({
        wasUpToDate: true,
        updateInfo: { version: JAVA_VERSION_STRING }
      });
      return;
    }

    try {
      cleanInstallFolder(); // clean before install
    } catch (e) {
      console.log('Jre failed to clean install folder before install');
      reject(e);
    }

    console.log(`Jre is not installed yet, going to install`);
    fs.mkdirSync(ROOT_INSTALL_FOLDER);
    download(resolve, reject, progress)
      .pipe(gunzipMaybe())
      .pipe(extract(resolve, reject))
      .on('finish', () => {
        console.log('checking jre installation');
        try {
          if (isInstalledAndDoesNotRequiresUpdates()) {
            resolve({
              wasUpToDate: false,
              updateInfo: { version: JAVA_VERSION_STRING }
            });
          } else {
            cleanInstallFolder();
            throw new Error('Failed to validate jre install.');
          }
        } catch (err) {
          console.log(`Failed to validate jre install: ${err.message}`);
          cleanInstallFolder();
          throw err;
        }
      });
  });

export default install;
