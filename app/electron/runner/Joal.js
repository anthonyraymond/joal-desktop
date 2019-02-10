import os from 'os';
import childProcess from 'child_process';
import treeKill from 'tree-kill';
import { getJreBinaryPath } from '../updaters/jre-updater';
import { getJoalJarPath, getJoalConfigPath } from '../updaters/joal-updater';

export type WebUiConfig = {
  host: string,
  port: number,
  pathPrefix: string,
  secretToken: string
};

const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; // eslint-disable-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8; // eslint-disable-line no-mixed-operators, no-bitwise
    return v.toString(16);
  });

const createJoalRancomWebUiConfig = (): WebUiConfig => ({
  host: 'localhost',
  port: 5081,
  pathPrefix: uuidv4(),
  secretToken: uuidv4()
});

export default class Joal {
  currentConfig: WebUiConfig;

  constructor() {
    this.currentConfig = createJoalRancomWebUiConfig();
  }

  start(): WebUiConfig {
    if (this.joalProcess) {
      this.joalProcess.kill('SIGINT');
    }

    console.log('Running joal with config: ', this.currentConfig);
    const shouldRunDetached = !os.platform().startsWith('win');
    this.joalProcess = childProcess.spawn(
      getJreBinaryPath(),
      [
        '-jar',
        `${getJoalJarPath()}`,
        `--joal-conf=${getJoalConfigPath()}`,
        '--spring.main.web-environment=true',
        `--server.port=${this.currentConfig.port}`,
        `--joal.ui.path.prefix=${this.currentConfig.pathPrefix}`,
        `--joal.ui.secret-token=${this.currentConfig.secretToken}`,
        '--server.address=localhost'
      ],
      { encoding: 'utf8', detached: shouldRunDetached }
    );

    this.joalProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });
    this.joalProcess.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
    });
    return this.currentConfig;
  }

  kill(callback: () => void): void {
    let callbackFn = () => {};
    if (callback) {
      callbackFn = callback;
    }
    console.log('Killing joal');

    if (this.joalProcess) {
      treeKill(this.joalProcess.pid, 'SIGINT', err => {
        if (!err) {
          return callbackFn();
        }
        treeKill(this.joalProcess.pid, 'SIGKILL', error => {
          if (error) {
            console.error('failed to kill joal before quit: ', error);
          }
          return callbackFn();
        });
      });
    }
    return callbackFn();
  }
}
