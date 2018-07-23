const config = global;
const ERRORS = require('./errors');
const { executeCommand, executePipeCommand, logger } = require('./utils');

async function install() {
  return new Promise(async(resolve, reject) => {
    try {
      let packagesList = await executeCommand(`adb shell cmd package list packages`, ERRORS.CMD_LIST_PACKAGES);
      logger.debug('Packages Listed');
      logger.debug(packagesList);

      if (packagesList.includes(config.packageName)) {
        await executeCommand(`adb uninstall ${config.packageName}`, ERRORS.UNINSTALL_APK);
        logger.success(`Package Uninstalled : ${config.packageName}`);
      }

      await executeCommand(`adb install ${config.packageAbsolutePath}`, ERRORS.INSTALL_APK);

      logger.success(`Package Installed: ${config.packageName}`);
      resolve();
    } catch (err) {
      reject(err);
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
      await executeCommand(`adb shell logcat -c`, ERRORS.LOGCAT);
      logger.success('Flushed Logs');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function log() {
  return new Promise(async(resolve, reject) => {
    try {
      executePipeCommand('adb', ['shell', 'logcat']);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  install, restart, flushLogs, log
};