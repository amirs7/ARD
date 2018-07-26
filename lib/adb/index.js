const { executeCommand } = require('../utils/index');
const ADBError = require('./errors');

class ADB {
  static async uninstall(packageName) {
    return new Promise(async(resolve, reject) => {
      let command = `adb uninstall ${packageName}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Uninstall Error'));
      }
    });
  }

  static async install(packagePath) {
    return new Promise(async(resolve, reject) => {
      let command = `adb install -g ${packagePath}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Install Error'));
      }
    });
  }

  static async update(packagePath) {
    return new Promise(async(resolve, reject) => {
      let command = `adb install -r ${packagePath}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Update Error'));
      }
    });
  }

  static async listPackages() {
    return new Promise(async(resolve, reject) => {
      let command = `adb shell cmd package list packages`;
      try {
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        reject(new ADBError('Shell cmd package list Error'));
      }
    });
  }

  static async listDevices() {
    return new Promise(async(resolve, reject) => {
      let command = `adb devices`;
      try {
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        reject(new ADBError('List devices Error'));
      }
    });
  }

  static async connect(ip, port) {
    return new Promise(async(resolve, reject) => {
      let command = `adb connect ${ip}:${port}`;
      try {
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        reject(new ADBError('List devices Error'));
      }
    });
  }

  static async stopPackage(packageName) {
    return new Promise(async(resolve, reject) => {
      let command = `adb shell am force-stop ${packageName}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Shell am force-stop  Error'));
      }
    });
  }

  static async startPackage(packageName) {
    return new Promise(async(resolve, reject) => {
      let command = `adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Shell monkey (package start) Error'));
      }
    });
  }

  static async killServer() {
    return new Promise(async(resolve, reject) => {
      let command = `adb kill-server`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Kill server Error'));
      }
    });
  }

  static async startServer() {
    return new Promise(async(resolve, reject) => {
      let command = `adb start-server`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Start server Error'));
      }
    });
  }

  static async startInUSBMode() {
    return new Promise(async(resolve, reject) => {
      let command = `adb usb`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Start in usb mode Error'));
      }
    });
  }

  static async startInTCPMode(port) {
    return new Promise(async(resolve, reject) => {
      let command = `adb tcpip ${port}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Start in tcp mode Error'));
      }
    });
  }

  static async ifconfig(interfaceName) {
    return new Promise(async(resolve, reject) => {
      let command;
      if (interfaceName)
        command = `adb shell ifconfig ${interfaceName}`;
      else
        command = `adb shell ifconfig`;
      try {
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        reject(new ADBError('Ifconfig Error'));
      }
    });
  }

  static async flushAllLogs() {
    return new Promise(async(resolve, reject) => {
      let command = `adb logcat -c`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new ADBError('Logcat flush Error'));
      }
    });
  }
}

module.exports = ADB;