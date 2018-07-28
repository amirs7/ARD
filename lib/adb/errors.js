const { logger } = require('../utils/index');
class ADB {
  constructor(message, hint) {
    this.message = message;
    this.hint = hint;
  }
}

class MoreThanOneDevice extends ADB {
  constructor() {
    super('More than one devices are connected', 'Disconnect the usb cable');
  }
}

class NoDeviceConnected extends ADB {
  constructor() {
    super('No device is connected', 'Connect the device with usb cable then use the connect command');
  }
}

class ApplicationNotFound extends ADB {
  constructor() {
    super('Application not found on device', 'Either package not installed yet or package name is wrong');
  }
}

class WrongAPKPath extends ADB {
  constructor() {
    super('APK file path is wrong','');
  }
}

function handle(error) {
  logger.debug(`ADB::${error.message}`);
  if (error.message) {
    if (error.message.includes('more than one device'))
      return new MoreThanOneDevice();
    else if (error.message.includes('no devices/emulators found'))
      return new NoDeviceConnected();
    else if (error.message.includes('No such file or directory'))
      return new WrongAPKPath();
  } else
    return null;

};
module.exports = { MoreThanOneDevice, ADB, NoDeviceConnected, ApplicationNotFound, WrongAPKPath,handle };