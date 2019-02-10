type Updater = {
  isWaiting: boolean,
  isChecking: boolean,
  isDownloading: boolean,
  isDone: boolean,
  progress: number,
  message?: string,
  errorMessage?: string
};

type UpdaterState = {
  electronApp: Updater,
  joal: Updater,
  jre: Updater
};

export { UpdaterState, Updater };
