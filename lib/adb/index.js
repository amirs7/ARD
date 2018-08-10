const { executeCommand, Loading } = require('../utils/index');
const Error = require('./errors');

class ADB {
  static async runShellCommand(command) {
    return new Promise(async(resolve, reject) => {
      try {
        let output = await executeCommand(`adb shell ${command}`);
        resolve(output);
      } catch (error) {
        console.log(error);
        reject(new Error.ADB(`Command ${command} Failed`));
      }
    });
  }

  static async emulateInput(input) {
    return new Promise(async(resolve, reject) => {
      let command;
      if (input.type === 'keyevent') {
        command = `adb shell input keyevent ${input.keyCode}`;
      }
      else if (input.type === 'swipe') {
        if (!input.coords || input.coords.length !== 4)
          return reject(new Error.ADB('Shell Input Error'));
        command = `adb shell input swipe ${input.coords[0]} ${input.coords[1]} ${input.coords[2]} ${input.coords[3]} 300`;
      }
      else if (input.type === 'text') {
        command = `adb shell input text ${input.text}`;
      }
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        reject(new Error.ADB('Shell Input Error'));
      }
    });
  }

  static async uninstall(packageName) {
    return new Promise(async(resolve, reject) => {
      let loading;
      let command = `adb uninstall ${packageName}`;
      try {
        loading = new Loading();
        let output = await executeCommand(command);
        if (output.includes('DELETE_FAILED_INTERNAL_ERROR'))
          reject(new Error.ApplicationNotFound());
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Uninstall Error'));
      }
      loading.stop();
    });
  }

  static async install(packagePath) {
    return new Promise(async(resolve, reject) => {
      let command = `adb install -g ${packagePath}`;
      let loading;
      try {
        loading = new Loading();
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Install Error'));
      }
      loading.stop();
    });
  }

  static async update(packagePath) {
    return new Promise(async(resolve, reject) => {
      let command = `adb install -r ${packagePath}`;
      let loading;
      try {
        loading = new Loading();
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new ADB('Update Error'));
      }
      loading.stop();
    });
  }

  static async listPackages() {
    return new Promise(async(resolve, reject) => {
      let command = `adb shell cmd package list packages`;
      try {
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Shell cmd package list Error'));
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
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('List devices Error'));
      }
    });
  }

  static async connect(ip, port) {
    return new Promise(async(resolve, reject) => {
      let command = `adb connect ${ip}:${port}`;
      let loading;
      try {
        loading = new Loading();
        let output = await executeCommand(command);
        resolve(output);
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Error in connecting'));
      }
      loading.stop();
    });
  }

  static async stopPackage(packageName) {
    return new Promise(async(resolve, reject) => {
      let command = `adb shell am force-stop ${packageName}`;
      try {
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Shell am force-stop  Error'));
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
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Shell monkey (package start) Error'));
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
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Kill server Error'));
      }
    });
  }

  static async startServer() {
    return new Promise(async(resolve, reject) => {
      let command = `adb start-server`;
      let loading;
      try {
        loading = new Loading();
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Start server Error'));
      }
      loading.stop();
    });
  }

  static async startInUSBMode() {
    return new Promise(async(resolve, reject) => {
      let command = `adb usb`;
      let loading;
      try {
        loading = new Loading();
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Start in usb mode Error'));
      }
      loading.stop();
    });
  }

  static async startInTCPMode(port) {
    return new Promise(async(resolve, reject) => {
      let loading;
      let command = `adb tcpip ${port}`;
      try {
        loading = new Loading();
        await executeCommand(command);
        resolve();
      } catch (error) {
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Start in tcp mode Error'));
      }
      loading.stop();
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
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Ifconfig Error'));
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
        if (Error.handle(error))
          reject(Error.handle(error));
        else
          reject(new Error.ADB('Logcat flush Error'));
      }
    });
  }
}

module.exports = ADB;