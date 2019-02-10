import os from 'os';
import { app } from 'electron';
import path from 'path';
import request from 'request';
import rimraf from 'rimraf';
import zlib from 'zlib';
import tar from 'tar-fs';
import PProgress from 'p-progress';
import childProcess from 'child_process';

const ROOT_INSTALL_FOLDER = path.join(app.getPath('userData'), 'jre');
const JRE_MAJOR_VERSION = '8';
const JRE_UPDATE_NUMBER = '202';
const JRE_BUILD_NUMBER = '1467.3';
const JRE_VERSION = `${JRE_MAJOR_VERSION}u${JRE_UPDATE_NUMBER}`;

const jetbrainsPlatformName = () => {
  const systemPlatform = os.platform();
  switch (systemPlatform) {
    case 'darwin':
      return 'osx';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      throw new Error(`unsupported platform: ${systemPlatform}`);
  }
};

// Full list at : https://jetbrains.bintray.com/intellij-jdk/ (be sure to search for "jbrex" as it also contains JDK)
const url = () =>
  `https://bintray.com/jetbrains/intellij-jdk/download_file?file_path=jbrex${JRE_VERSION}b${JRE_BUILD_NUMBER}_${jetbrainsPlatformName()}_x64.tar.gz`;

export const getJreBinaryPath = () => {
  const systemPlatform = os.platform();
  let relativePath;
  switch (systemPlatform) {
    case 'darwin':
      relativePath = ['jdk', 'Contents', 'Home', 'jre', 'bin', 'java'];
      break;
    case 'win32':
      relativePath = ['jre', 'bin', 'java.exe'];
      break;
    case 'linux':
      relativePath = ['jre', 'bin', 'java'];
      break;
    default:
      throw new Error(`unsupported platform for JRE: ${systemPlatform}`);
  }

  return path.join(ROOT_INSTALL_FOLDER, ...relativePath);
};

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

  const versionMatch = new RegExp(
    `\\w+ version "\\d\\.${JRE_MAJOR_VERSION}\\.\\d_${JRE_UPDATE_NUMBER}-\\w+"`
  ).test(javaResponse.stderr);

  if (!versionMatch) {
    console.log(
      `The output of java-version didn\t passed the regex version test. Expected version ${JRE_MAJOR_VERSION} ${JRE_UPDATE_NUMBER}, output of the command was:`,
      javaResponse.stderr
    );
  }
  return versionMatch;
};

const cleanInstallFolder = () => {
  rimraf.sync(ROOT_INSTALL_FOLDER);
};

const install = () =>
  new PProgress((resolve, reject, progress) => {
    console.log('Asked to install jre');
    if (isInstalledAndDoesNotRequiresUpdates()) {
      console.log('Jre is already installed and does not needs to update');
      resolve({
        wasUpToDate: true,
        updateInfo: { version: JRE_VERSION }
      });
      return;
    }

    console.log(`Jre is not installed yet, pulling it from ${url()}`);
    let downloaded = 0;
    let totalDownloadLength = 0;
    let hundredthOfTotalDownloadlength = 0;
    let downloadedSinceLastProgressReport = 0;

    request(url())
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
        if (
          downloadedSinceLastProgressReport >= hundredthOfTotalDownloadlength
        ) {
          downloadedSinceLastProgressReport = 0;
          progress(downloaded / totalDownloadLength);
        }
      })
      .on('end', () => {
        // Do not send the progress(1) it's automatically sent on resolve() call
        console.log('Successfully downloaded jre archive');
      })
      .pipe(zlib.createGunzip())
      .on('error', e => {
        console.log('Failed to unzip jre', e);
        cleanInstallFolder();
        reject(e);
      })
      .on('end', () => {
        console.log('Successfully unziped jre');
      })
      .pipe(tar.extract(ROOT_INSTALL_FOLDER))
      .on('error', e => {
        console.log("Failed to extract jre's tar", e);
        cleanInstallFolder();
        reject(e);
      })
      .on('finish', () => {
        console.log("Successfully extracted jre's tar");

        try {
          if (isInstalledAndDoesNotRequiresUpdates()) {
            resolve({
              wasUpToDate: false,
              updateInfo: { version: JRE_VERSION }
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
