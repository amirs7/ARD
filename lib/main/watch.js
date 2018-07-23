const fs = require('fs');

const { install, restart, stopLog, liveLog } = require('../build');
const { logger } = require('../utils');

class Watcher {
  constructor() {
    this.watching = false;
  }
  initialize(){
    fs.watchFile(global.packageAbsolutePath, {}, async(event) => {
      if (this.watching) {
        try {
          await install();
          await restart();
        } catch (error) {
          logger.debug(event);
          logger.error(error.message);
          logger.hint(error.hint);
        }
      } else {
      }
    });
  }
  static async startWatch() {
    return new Promise(async(resolve, reject) => {
      try {
        this.watching = true;
        await install();
        await restart();
        await liveLog('SystemWebChromeClient');
        resolve();
      } catch (error) {
        this.watching = false;
        logger.error(error.message);
        logger.hint(error.hint);
        reject(error);
      }
    });
  }
  static async stopWatch() {
    return new Promise(async(resolve, reject) => {
      this.watching = false;
      await stopLog();
      resolve();
    });
  }
}

module.exports = Watcher;