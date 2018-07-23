const config = global;
const ERRORS = require('./errors');
const { executeCommand, executePipeCommand, stopChild, logger } = require('./utils');

async function update() {
  return new Promise(async(resolve, reject) => {
    try {
      await executeCommand(`adb install -r ${config.packageAbsolutePath}`, ERRORS.INSTALL_APK);
      logger.success(`Package Installed: ${config.packageName}`);
      resolve();
    } catch (error) {
      let originalError = error.err;
      if (originalError.stderr.includes('more than one device')) {
        reject(ERRORS.MORE_THAN_ONE_DEVICE);
      } else {
        reject(error);
      }
    }
  });
}

async function install() {
  return new Promise(async(resolve, reject) => {
    try {
      let packagesList = await executeCommand(`adb shell cmd package list packages`, ERRORS.CMD_LIST_PACKAGES);
      logger.debug('Packages Listed');
      logger.debug(packagesList);

      if (packagesList.includes(config.packageName)) {
        logger.info(`Uninstalling Package ... `);
        await executeCommand(`adb uninstall ${config.packageName}`, ERRORS.UNINSTALL_APK);
        logger.success(`Package Uninstalled : ${config.packageName}`);
      }

      logger.info(`Installing Package ... `);
      await executeCommand(`adb install ${config.packageAbsolutePath}`, ERRORS.INSTALL_APK);
      logger.success(`Package Installed: ${config.packageName}`);
      resolve();
    } catch (error) {
      let originalError = error.err;
      if (originalError.stderr.includes('more than one device')) {
        reject(ERRORS.MORE_THAN_ONE_DEVICE);
      } else {
        reject(error);
      }
    }
  });
}

async function restart() {
  return new Promise(async(resolve, reject) => {
    try {
      let packagesList = await executeCommand(`adb shell cmd package list packages`, ERRORS.CMD_LIST_PACKAGES);
      logger.debug('Packages Listed');
      logger.debug(packagesList);

      if (!packagesList.includes(config.packageName))
        return reject(ERRORS.APPLICATION_NOT_INSTALLED);

      await executeCommand(`adb shell am force-stop ${config.packageName}`, ERRORS.AM_STOP);
      logger.success('Application Stopped');

      await executeCommand(`adb shell monkey -p ${config.packageName} -c android.intent.category.LAUNCHER 1`, ERRORS.MONKEY_START);
      logger.success('Application Started');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function flushLogs() {
  return new Promise(async(resolve, reject) => {
    try {
      await executeCommand(`adb logcat -c`, ERRORS.LOGCAT);
      logger.success('Flushed Logs');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function liveLog(origin) {
  return new Promise(async(resolve, reject) => {
    try {
      logger.success('Printing Logs:');
      executePipeCommand('adb', ['logcat'],  (data) => {
        data = data.toString();
        let lines = data.split('\n');
        lines.forEach((line) => {
          if (line.includes(origin||''))
            logger.info(`LOG: ${line}`);
        });
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function log() {
  return new Promise(async(resolve, reject) => {
    try {
      let logs = await executeCommand(`adb shell logcat`, ERRORS.LOGCAT);
      let lines = logs.split('\n');
      lines.forEach((line) => {
        if (line.includes('SystemWebChromeClient'))
          logger.info(` ${line}`);
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
async function stopLog() {
  return new Promise((resolve,reject) => {
    stopChild();
    resolve();
  });
}

module.exports = {
  install, restart, flushLogs, log, liveLog, stopLog, update
};


//TODO: INSTALL Loading
//todo:logging