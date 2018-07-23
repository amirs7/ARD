const { executeCommand, logger, sleep } = require('./utils');
let config = require('./config');
const ERRORS = require('./errors');
Object.assign(global,config);
config = global;

let DeviceIPAddress = null;

async function connect() {
  return new Promise(async(resolve, reject) => {
    try {

      await executeCommand(`adb kill-server`);
      logger.success('ADB Server Stopped');

      await executeCommand(`adb start-server`);
      logger.success('ADB Server Started');

      await executeCommand(`adb usb`, ERRORS.NO_DEVICE_CONNECTED_USB);
      logger.success('ADB Server Started in USB Mode');

      await searchForDevice();
      logger.success('Connected to Device via USB');

      await connectOverWIFI();
    } catch (error) {
      logger.error(error.message);
      logger.hint(error.hint);
    }
  });
}

async function connectOverWIFIWithIP(ip) {
  return new Promise(async (resolve,reject) => {
    if(ip)
      DeviceIPAddress = ip;
    try {
      logger.debug(`Connecting to ${DeviceIPAddress}`);
      await tryToConnect(DeviceIPAddress, config.ADBPort);
      logger.success('Connected to Device via WIFI');
    }catch (error) {
      DeviceIPAddress = null;
      logger.debug(error);
      reject({
        message: 'Could Not Connect to Device over WIFI',
        hint: 'Check if Device Connected to the Same Network'
      });
    }
  });
}

async function connectOverWIFI() {
  return new Promise(async(resolve, reject) => {
      try {
        let WLANInterfaceName = await getWLANInterfaceName();
        logger.debug(`Got WLAN Interface Name: ${WLANInterfaceName}`);

        let IPAddress = await getIPAddress(WLANInterfaceName);
        logger.debug(`Got IP Address: ${IPAddress}`);
        DeviceIPAddress = IPAddress;

        await executeCommand(`adb tcpip ${config.ADBPort}`);
        logger.success('ADB started in TCP/IP Mode');

        await tryToConnect(IPAddress, config.ADBPort);
        logger.success('Connected to Device via WIFI');
      } catch (error) {
        logger.debug(error);
        reject({
          message: 'Could Not Connect to Device over WIFI',
          hint: 'Check if Device Connected to the Same Network'
        });
      }
  });
}

async function tryToConnect(ip, port) {
  return new Promise(async(resolve, reject) => {
    logger.info(`Connecting to ${ip}:${port}`);
    let interId = setInterval(async() => {
      try {
        let output = await executeCommand(`adb connect ${ip}:${port}`);
        logger.debug(output);
        if (output.includes('connected')) {
          clearInterval(interId);
          return resolve();
        }
      } catch (error) {
        logger.debug(error);
      }
    }, global.connectingInterval);
    setTimeout(() => {
      clearInterval(interId);
      return reject({ message: 'Could Not Connect to Device' });
    }, global.connectingTimeout);
  });
}

function checkForCommonError(error) {
  if(error.stderr.includes('more than one device'))
    return ERRORS.MORE_THAN_ONE_DEVICE;
  return null;
}

function getIPAddress(WLANInterfaceName) {
  return new Promise(async(resolve, reject) => {
    try {
      let WLANInterfaceDetails = await executeCommand(`adb shell ifconfig ${WLANInterfaceName}`);
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
      if(checkForCommonError(error.err))
        reject(checkForCommonError(error.err));
      else
        reject({ message: `Could not execute IFCONFIG for ${WLANInterfaceName}` });
    }
  });
}

function searchForDevice() {
  return new Promise((resolve, reject) => {
    logger.info('Searching for Devices');
    let interId = setInterval(async() => {
      let devicesList = await executeCommand(`adb devices`);
      logger.debug(devicesList);
      if (devicesList.split('\n').length > 3) {
        clearInterval(interId);
        return resolve();
      }
    }, global.searchForDeviceInterval);
    setTimeout(() => {
      clearInterval(interId);
      reject(ERRORS.DEVICES_LIST_TIMEOUT);
    }, global.searchForDeviceTimeout);
  });
}

async function getWLANInterfaceName() {
  return new Promise(async(resolve, reject) => {
    let WLANInterfaceName = 'wlan';
    try {
      let allInterfaceDetails = await executeCommand(`adb shell ifconfig`);
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
      if(checkForCommonError(error.err))
        reject(checkForCommonError(error.err));
      else
        reject({ message: 'Could not execute IFCONFIG' });
    }
  });
}

module.exports = {
  connect, connectOverWIFI, connectOverWIFIWithIP
};
