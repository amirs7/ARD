const fs = require('fs');

const { install, restart, stopLog } = require('../debugger');
const { logger } = require('../utils/index');

class Watcher {
  static async startWatch() {
    return new Promise(async(resolve, reject) => {
      fs.watchFile(global.packageAbsolutePath, {}, async(event) => {
        if (event.mode === 0) {
          logger.error('File deleted');
          return reject();
        }
        logger.debug(event);
        try {
          await install();
          await restart();
        } catch (error) {
          logger.error(error.message);
          logger.hint(error.hint);
        }
      });
      resolve();
    });
  }

  static async stopWatch() {
    return new Promise(async(resolve, reject) => {
      fs.unwatchFile(global.packageAbsolutePath);
      await stopLog();
      resolve();
    });
  }
}

module.exports = Watcher;