import chalk from 'chalk';
import detectPort from 'detect-port';

(function CheckPortInUse() {
  const port: string = process.env.PORT || '1212';

  detectPort(port, (err, availablePort) => {
    if (port !== String(availablePort)) {
      throw new Error(
        chalk.whiteBright.bgRed.bold(
          `Port "${port}" on "127.0.0.1" is already in use. Please use another port. ex: PORT=4343 yarn dev`
        )
      );
    } else {
      process.exit(0);
    }
  });
})();
