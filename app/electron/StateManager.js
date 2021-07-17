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

  data;

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

  restoreWindow() {
    const data = this.getOrLoadData();
    data.window = defaultWindow();
    this.store.all = data;
  }

  getOrLoadData() {
    let { data } = this;
    if (data === undefined) {
      data = this.store.all;
      this.data = data;
    }
    return data;
  }

  getWindow() {
    return this.getOrLoadData().window;
  }

  save() {
    const { data } = this;
    if (data !== undefined) {
      this.store.all = data;
    }
  }
}
