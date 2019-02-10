import os from 'os';
import path from 'path';
import ConfigStore from 'configstore';
import { isDev } from './util';

const defaultWindow = () => ({
  width: 1024,
  height: 728
});

export default class StateManager {
  store;

  data: Config;

  constructor() {
    this.store = new ConfigStore('joal-desktop', { window: defaultWindow() });
    if (os.platform() === 'darwin') {
      this.store.path = path.join(
        os.homedir(),
        'Library',
        'Preferences',
        `org.araymond.joal.desktop${isDev() ? '-dev' : ''}.json`
      );
    }
  }

  restoreWindow(): void {
    const data = this.getOrLoadData();
    data.window = defaultWindow();
    this.store.all = data;
  }

  getOrLoadData(): Config {
    let { data } = this;
    if (data === undefined) {
      data = this.store.all;
      this.data = data;
    }
    return data;
  }

  getWindow(): WindowItem {
    return this.getOrLoadData().window;
  }

  save(): void {
    const { data } = this;
    if (data !== undefined) {
      this.store.all = data;
    }
  }
}

type Config = {
  window: WindowItem
};

export type WindowItem = {
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  maximized?: boolean
};
