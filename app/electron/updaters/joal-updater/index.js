import PProgress from 'p-progress';
import tar from 'tar-fs';
import fs from 'fs';
import rimraf from 'rimraf';
import request from 'request';
import { app } from 'electron';
import path from 'path';
import zlib from 'zlib';
import { copyFolderRecursiveSync, copyFileSync } from '../../../utils/cp';

const ROOT_INSTALL_FOLDER = path.join(app.getPath('userData'), 'joal-core');
const TMP_UPDATE_DIR = path.join(ROOT_INSTALL_FOLDER, 'update-tmp');
const CLIENT_FILES_DIR = path.join(ROOT_INSTALL_FOLDER, 'clients');
const TORRENTS_DIR = path.join(ROOT_INSTALL_FOLDER, 'torrents');
const ARCHIVED_TORRENTS_DIR = path.join(TORRENTS_DIR, 'archived');
const JOAL_CORE_VERSION_FILE = path.join(ROOT_INSTALL_FOLDER, '.joal-core');
const JOAL_CORE_VERSION = '2.1.26';
const JAR_NAME = `jack-of-all-trades-${JOAL_CORE_VERSION}.jar`;
const DOWNLOAD_URL = `https://github.com/anthonyraymond/joal/releases/download/${JOAL_CORE_VERSION}/joal.tar.gz`;

export const getJoalJarPath = () => path.join(ROOT_INSTALL_FOLDER, JAR_NAME);
export const getJoalConfigPath = () => ROOT_INSTALL_FOLDER;

const isInstalledAndDoesNotRequiresUpdates = () => {
  // check for joal directory
  if (!fs.existsSync(ROOT_INSTALL_FOLDER)) return false;
  // check for jar
  if (!fs.existsSync(getJoalJarPath())) return false;

  // check for client files
  if (!fs.existsSync(CLIENT_FILES_DIR)) return false;
  const areClientFilesPresents = fs
    .readdirSync(CLIENT_FILES_DIR)
    .find(fileName => fileName.endsWith('.client'));
  if (areClientFilesPresents === undefined) return false;

  // check for torrents folder
  if (!fs.existsSync(TORRENTS_DIR)) return false;

  // check config.json
  if (!fs.existsSync(path.join(ROOT_INSTALL_FOLDER, 'config.json')))
    return false;

  // check if the version file is present, and that the version matches
  if (!fs.existsSync(JOAL_CORE_VERSION_FILE)) return false;
  if (
    fs.readFileSync(JOAL_CORE_VERSION_FILE, { encoding: 'utf8' }) !==
    JOAL_CORE_VERSION
  )
    return false;

  return true;
};

const mergeConfigFilesAndWriteNewOne = () => {
  // get previous config.json (if exists)
  const previousConfigFile = path.join(ROOT_INSTALL_FOLDER, 'config.json');
  const newJsonConfigFile = path.join(TMP_UPDATE_DIR, 'config.json');

  let previousConfig;
  if (fs.existsSync(previousConfigFile)) {
    try {
      previousConfig = JSON.parse(
        fs.readFileSync(previousConfigFile, { encoding: 'utf8' })
      );
    } catch (err) {
      previousConfig = {}; // if we can't read the config consider empty
    }
  }
  // get new config.json
  let newConfig;
  if (!fs.existsSync(newJsonConfigFile))
    throw new Error(`File not found: ${newJsonConfigFile}`);
  try {
    newConfig = JSON.parse(
      fs.readFileSync(newJsonConfigFile, { encoding: 'utf8' })
    );
  } catch (err) {
    throw new Error(`Failed to parse new config.json: ${err}`);
  }

  // merge the two config (with old overriding new)
  const mergedConfig = Object.assign({}, newConfig, previousConfig);
  fs.writeFileSync(
    path.join(ROOT_INSTALL_FOLDER, 'config.json'),
    JSON.stringify(mergedConfig, null, 2)
  );
};

const cleanInstallFolder = () => {
  if (fs.existsSync(ROOT_INSTALL_FOLDER)) {
    fs.readdirSync(ROOT_INSTALL_FOLDER) // delete all .jar
      .filter(fileName => fileName.endsWith('.jar'))
      .forEach(jar => rimraf.sync(path.join(ROOT_INSTALL_FOLDER, jar)));
  }

  if (fs.existsSync(TMP_UPDATE_DIR)) {
    rimraf.sync(TMP_UPDATE_DIR);
  }

  if (fs.existsSync(JOAL_CORE_VERSION_FILE)) {
    rimraf.sync(JOAL_CORE_VERSION_FILE);
  }
};

const install = () =>
  new PProgress((resolve, reject, progress) => {
    console.log('Asked to install joal');
    if (isInstalledAndDoesNotRequiresUpdates()) {
      console.log('Joal is already installed and does not needs to update');
      resolve({
        wasUpToDate: true,
        updateInfo: { version: JOAL_CORE_VERSION }
      });
      return;
    }
    try {
      cleanInstallFolder(); // clean before install
    } catch (e) {
      console.log('Joal failed to clean install folder before install');
      reject(e);
    }

    console.log('Joal is not installed yet, pulling from github');
    let downloaded = 0;
    let totalDownloadLength = 0;
    let hundredthOfTotalDownloadlength = 0;
    let downloadedSinceLastProgressReport = 0;

    request({
      url: DOWNLOAD_URL,
      headers: {
        'User-Agent': 'joal-desktop-downloader',
        connection: 'keep-alive'
      }
    })
      .on('error', e => {
        console.log('Failed to download JOAL:', e);
        cleanInstallFolder();
        reject(e);
      })
      .on('response', res => {
        if (res.statusCode !== 200) {
          console.log(
            `Failed to download JOAL: status code is ${res.statusCode}`
          );
          reject(`Failed to download JOAL: status code is ${res.statusCode}`);
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
        console.log('Successfully downloaded joal archive');
      })
      .pipe(zlib.createGunzip())
      .on('error', e => {
        // TODO: replace with Gunzip instead of Unzip
        console.log('Failed to unzip joal', e);
        cleanInstallFolder();
        reject(e);
      })
      .on('end', () => {
        console.log('Successfully unziped joal');
      })
      .pipe(tar.extract(TMP_UPDATE_DIR))
      .on('error', e => {
        console.log("Failed to extract joal's tar", e);
        cleanInstallFolder();
        reject(e);
      })
      .on('finish', () => {
        console.log("Successfully extracted joal's tar");

        try {
          console.log(`Copying clients folder to ${CLIENT_FILES_DIR}`);
          copyFolderRecursiveSync(
            path.join(TMP_UPDATE_DIR, 'clients'),
            ROOT_INSTALL_FOLDER
          );

          mergeConfigFilesAndWriteNewOne();

          // Replace old jar with new one
          fs.readdirSync(TMP_UPDATE_DIR)
            .filter(fileName => fileName.endsWith('.jar'))
            .map(jar =>
              copyFileSync(
                path.join(TMP_UPDATE_DIR, jar),
                path.join(ROOT_INSTALL_FOLDER, jar)
              )
            );

          rimraf.sync(TMP_UPDATE_DIR);

          // create torrent folder
          if (!fs.existsSync(TORRENTS_DIR)) fs.mkdirSync(TORRENTS_DIR);

          // create archived torrent folder
          if (!fs.existsSync(ARCHIVED_TORRENTS_DIR))
            fs.mkdirSync(ARCHIVED_TORRENTS_DIR);

          // Write version file
          fs.writeFileSync(JOAL_CORE_VERSION_FILE, JOAL_CORE_VERSION);

          if (isInstalledAndDoesNotRequiresUpdates()) {
            // check for proper install
            resolve({
              wasUpToDate: false,
              updateInfo: { version: JOAL_CORE_VERSION }
            }); // After the whole archive has been extracted sent the progress(1) using the resolve method
          } else {
            // eslint-disable-line no-else-return
            console.log('Failed to validate joal deployement.');
            throw new Error('Failed to validate joal deployement.');
          }
        } catch (err) {
          cleanInstallFolder();
          throw err;
        }
      });
  });

export default install;
