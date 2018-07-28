const fs = require('fs');
const ERRORS = require('../errors');
const { executeCommand, executePipeCommand, stopChild, logger } = require('../utils/index');
const ADB = require('../adb');
const AutoTouch = require('../utils/autoTouch');
const Watcher = require('../main/watch');

function checkForCommonError(error) {
  if (error.stderr.includes('more than one device'))
    return ERRORS.MORE_THAN_ONE_DEVICE;
  return null;
}

function getIPAddress(WLANInterfaceName) {
  return new Promise(async(resolve, reject) => {
    try {
      let WLANInterfaceDetails = await ADB.ifconfig(WLANInterfaceName);
      logger.debug('IFCONFIG Interface Executed');
      logger.debug(WLANInterfaceDetails);
      WLANInterfaceDetails = WLANInterfaceDetails.split(' ');
      let IPAddress = WLANInterfaceDetails[WLANInterfaceDetails.findIndex((word) => {
        if (word.includes('inet'))
          return true;
      }) + 1].replace('addr:', '');
      logger.debug(`IP Address Extracted: ${IPAddress}`);
      return resolve(IPAddress);
    } catch (error) {
      logger.debug(error);
      if (checkForCommonError(error.err))
        reject(checkForCommonError(error.err));
      else
        reject({ message: `Could not execute IFCONFIG for ${WLANInterfaceName}` });
    }
  });
}

async function getWLANInterfaceName() {
  return new Promise(async(resolve, reject) => {
    let WLANInterfaceName = 'wlan';
    try {
      let allInterfaceDetails = await ADB.ifconfig();
      logger.debug('IFCONFIG Executed');
      logger.debug(allInterfaceDetails);
      allInterfaceDetails = allInterfaceDetails.split('\n');
      allInterfaceDetails.forEach((line) => {
        if (line.includes('Link encap')) {
          line = line.split(' ');
          if (line[0].includes('wlan'))
            WLANInterfaceName = line[0];
        }
      });
      resolve(WLANInterfaceName);
    } catch (error) {
      logger.debug(error);
      if (checkForCommonError(error.err))
        reject(checkForCommonError(error.err));
      else
        reject({ message: 'Could not execute IFCONFIG' });
    }
  });
}

class Debugger {
  constructor(config) {
    this.packageName = config.packageName;
    this.packageAbsolutePath = config.packageAbsolutePath;
    this.port = config.ADBPort;
    this.password = config.password;
    this.connectionInterval = 1000;
    this.connectionTimeout = 10000;
    this.deviceIP = config.deviceIP;
    this.searchForDeviceInterval = 1000;
    this.searchForDeviceTimeout = 10000;
    this.connectionType = 'None';
    this.state = 'ready';
    this.autoTouch = new AutoTouch();
    this.watcher = new Watcher(config);
  }

  async unlockDeviceWithPassword() {
    return new Promise(async(resolve) => {
      try {
        await this.autoTouch.emulatePassword(this.password);
        logger.success(`Device unlock emulated`);
        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async update() {
    return new Promise(async(resolve) => {
      try {
        await ADB.update(this.packageAbsolutePath);
        logger.success(`Package Installed: ${this.packageName}`);
        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async install() {
    return new Promise(async(resolve) => {
      try {
        let packagesList = await ADB.listPackages();
        logger.debug('Packages Listed');

        if (packagesList.includes(this.packageName)) {
          logger.info(`Uninstalling Package ... `);
          await ADB.uninstall(this.packageName);
          logger.success(`Package Uninstalled : ${this.packageName}`);
        }

        logger.info(`Installing Package ... `);
        await ADB.install(this.packageAbsolutePath);
        logger.success(`Package Installed: ${this.packageName}`);
        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async uninstall() {
    return new Promise(async(resolve, reject) => {
      try {
        let packagesList = await ADB.listPackages();
        logger.debug('Packages Listed');

        if (packagesList.includes(this.packageName)) {
          logger.info(`Uninstalling Package ... `);
          await ADB.uninstall(this.packageName);
          logger.success(`Package Uninstalled : ${this.packageName}`);
          resolve();
        } else {
          logger.error(`Debugger: package is not installed`);
          reject();
        }
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async start() {
    return new Promise(async(resolve, reject) => {
      try {
        let packagesList = await ADB.listPackages();
        logger.debug('Packages Listed');

        if (!packagesList.includes(this.packageName))
          return reject(ERRORS.APPLICATION_NOT_INSTALLED);

        await ADB.startPackage(this.packageName);
        logger.success('Application Started');

        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async stop() {
    return new Promise(async(resolve, reject) => {
      try {
        let packagesList = await ADB.listPackages();
        logger.debug('Packages Listed');

        if (!packagesList.includes(this.packageName))
          return reject(ERRORS.APPLICATION_NOT_INSTALLED);

        await ADB.stopPackage(this.packageName);
        logger.success('Application Stopped');

        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async restart() {
    return new Promise(async(resolve, reject) => {
      try {
        let packagesList = await ADB.listPackages();
        logger.debug('Packages Listed');

        if (!packagesList.includes(this.packageName))
          return reject(ERRORS.APPLICATION_NOT_INSTALLED);

        await ADB.stopPackage(this.packageName);
        logger.success('Application Stopped');

        await ADB.startPackage(this.packageName);
        logger.success('Application Started');
        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async flushLogs() {
    return new Promise(async(resolve, reject) => {
      try {
        await ADB.flushAllLogs();
        logger.success('Flushed Logs');
        resolve();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async startWatch() {
    return new Promise(async(resolve, reject) => {
      logger.success('Watch started');
      fs.watchFile(this.packageAbsolutePath, {}, async(event) => {
        if (event.mode === 0) {
          logger.error('File deleted');
          return reject();
        }
        logger.debug(event);
        try {
          await this.install();
          await this.restart();
        } catch (error) {
          logger.error(error.message);
          logger.hint(error.hint);
        }
      });
      resolve();
    });
  }

  async stopWatch() {
    return new Promise(async(resolve, reject) => {
      fs.unwatchFile(this.packageAbsolutePath);
      await this.stopLog();
      logger.success('Watch stopped');
      resolve();
    });
  }

  liveLog(origin) {
    return new Promise(async(resolve, reject) => {
      try {
        logger.success('Printing Logs:');
        executePipeCommand('adb', ['logcat'], (data) => {
          data = data.toString();
          let lines = data.split('\n');
          lines.forEach((line) => {
            if (line.includes(origin || ''))
              logger.info(`LOG: ${line}`);
          });
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  log() {
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

  async stopLog() {
    return new Promise((resolve, reject) => {
      stopChild();
      logger.success('Logging stopped');
      resolve();
    });
  }

  async connect() {
    return new Promise(async(resolve, reject) => {
      try {
        await ADB.killServer();
        logger.success('ADB Server Stopped');

        await ADB.startServer();
        logger.success('ADB Server Started');

        await ADB.startInUSBMode();
        logger.success('ADB Server Started in USB Mode');

        await this.searchForDevice();
        logger.success('Connected to Device via USB');

        await this.connectOverWIFI();
      } catch (error) {
        logger.error(`Debugger:: ${error.message}`);
        logger.hint(error.hint);
      }
    });
  }

  async connectOverWIFIWithIP(ip) {
    return new Promise(async(resolve, reject) => {
      if (ip)
        this.deviceIP = ip;
      try {
        logger.debug(`Connecting to ${this.deviceIP}`);
        await this.tryToConnect(this.deviceIP, this.port);
        logger.success('Connected to Device via WIFI');
      } catch (error) {
        this.deviceIP = null;
        logger.debug(error);
        logger.error(error.message);
        logger.hint(error.hint);
        reject({
          message: 'Could Not Connect to Device over WIFI',
          hint: 'Check if Device Connected to the Same Network'
        });
      }
    });
  }

  async connectOverWIFI() {
    return new Promise(async(resolve, reject) => {
      try {
        let WLANInterfaceName = await getWLANInterfaceName();
        logger.debug(`Got WLAN Interface Name: ${WLANInterfaceName}`);

        let IPAddress = await getIPAddress(WLANInterfaceName);
        logger.debug(`Got IP Address: ${IPAddress}`);
        this.deviceIP = IPAddress;

        await ADB.startInTCPMode(this.port);
        logger.success('ADB started in TCP/IP Mode');

        await this.tryToConnect(IPAddress, this.port);
        logger.success('Connected to Device via WIFI');
      } catch (error) {
        logger.debug(error);
        logger.error(error.message);
        logger.hint(error.hint);
        return reject({
          message: 'Could Not Connect to Device over WIFI',
          hint: 'Check if Device Connected to the Same Network'
        });
      }
    });
  }

  async searchForDevice() {
    return new Promise((resolve, reject) => {
      logger.info('Searching for Devices');
      let interId = setInterval(async() => {
        let devicesList = await ADB.listDevices();
        logger.debug(devicesList);
        if (devicesList.split('\n').length > 3) {
          clearInterval(interId);
          return resolve();
        }
      }, this.searchForDeviceInterval);
      setTimeout(() => {
        clearInterval(interId);
        reject(ERRORS.DEVICES_LIST_TIMEOUT);
      }, this.searchForDeviceTimeout);
    });
  }

  async tryToConnect(ip, port) {
    return new Promise(async(resolve, reject) => {
      logger.info(`Connecting to ${ip}:${port}`);

      let interId = setInterval(async() => {
        try {
          let output = await ADB.connect(ip, port);
          logger.debug(output);
          if (output.includes('connected')) {
            clearInterval(interId);
            return resolve();
          }
        } catch (error) {
          logger.debug(error);
        }
      }, this.connectionInterval);
      setTimeout(() => {
        clearInterval(interId);
        return reject({
          message: 'Could Not Connect to Device over WIFI',
          hint: 'Check if Device Connected to the Same Network'
        });
      }, this.connectionTimeout);
    });
  }
}

module.exports = Debugger;
