#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { logger, checkForUpdate } = require('../lib/utils/index');
const { commandHandler, helpMessage } = require('../lib/main/command');
const config = require('../config');

const Debugger = require('../lib/debugger');
let packageJson;
if (fs.existsSync(path.join(process.env['NVM_PATH'], '../node_modules/android-remote-debugger/package.json')))
  packageJson = require(path.join(process.env['NVM_PATH'], '../node_modules/android-remote-debugger/package.json'));

(() => {

  global.loggingLevel = 'info';

  let config = setup();
  config = configure(config);
  let remoteDebugger = new Debugger(config);
  if(packageJson)
    checkForUpdate(packageJson.version);
  commandHandler(remoteDebugger);
})();

function setup() {
  let config = {};
  let noIP = true;
  let configured = false;
  process.argv.forEach((arg, index, array) => {
    if (arg === '--debug') {
      global.loggingLevel = 'debug';
    }
    if (arg === '--version') {
      console.log();
      console.log(`\nAndroid Remote Debugger v${packageJson.version}`);
      console.log(`Wiki and Documentation: https://github.com/amirs7/ARD/wiki\n`);
      process.exit();
    }
    if (arg === '--help') {
      console.log(`\nAndroid Remote Debugger v${packageJson.version}`);
      console.log(`Wiki and Documentation: https://github.com/amirs7/ARD/wiki\n`);
      console.log(helpMessage);
      process.exit();
    }
    if (arg === '-p') {
      config.packageAbsolutePath = array[index + 1];
    }
    if (arg === '-n') {
      config.packageName = array[index + 1];
    }
    if (arg === '--ip') {
      noIP = false;
    }
    if (arg.includes('.js') && index > 1) {
      const configPath = path.join(process.cwd(), arg);
      if (!fs.existsSync(configPath)) {
        console.log('\x1b[31m%s\x1b[0m', 'Config File not Exists');
        process.exit();
      }
      config = require(configPath);
      configured = true;
    }
  });
  if (noIP)
    delete config.deviceIP;
  if (!configured) {
    console.log('\x1b[31m%s\x1b[0m', 'Config File not Specified');
    process.exit();
  }
  return config;
}

function configure(config) {
  if (!config.packageName) {
    logger.error('Package Name not Specified');
    process.exit();
  }
  if (!config.packagePath) {
    logger.error('Package .apk File Path not Specified');
    process.exit();
  }
  config.packageAbsolutePath = config.packagePath;
  if (config.packagePath[0] !== '/') {
    config.packageAbsolutePath = path.join(process.cwd(), config.packagePath);
  }

  if (!config.packageAbsolutePath.includes('.apk')) {

    logger.warning('Warning: Package File is not .apk');
  }
  if (!fs.existsSync(config.packageAbsolutePath)) {
    logger.warning('Warning: Package File not Exists at Specified Path');
  }

  logger.success('Debugger Started');
  logger.info(`Configuration:\n`
    + ` Package Name:\t${config.packageName}\n`
    + ` Package Path:\t${config.packageAbsolutePath}\n`
    + ` Using IP:\t${config.deviceIP ? config.deviceIP : 'No'}\n`
    + ` Server Port:\t${config.ADBPort ? config.ADBPort : 'Default'}\n`);
  return config;
}