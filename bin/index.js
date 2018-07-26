#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { logger } = require('../lib/utils/index');
const commandHandler = require('../lib/main/command');
const config = require('../lib/config');
let helpMessage = 'Available Commands:\n' +
  ' i, install\t remove the package from device and install it again\n' +
  ' u, update\t install the application preserving data and settings\n' +
  ' r, restart\t restart the application\n' +
  ' c, connect\t connect to the device over wifi\n' +
  ' w, watch\t enter watch mode\n' +
  ' ew, end watch\t end watch mode\n' +
  ' cw, connect wifi\t connect to the device only over wifi\n' +
  ' f, flush\t flush all logs\n' +
  ' ll\t monitor logs\n' +
  ' sl, stop live logging\n';

const Debugger = require('../lib/debugger');


(() => {

  global.loggingLevel = 'info';

  setup();

  configure();

  let remoteDebugger = new Debugger(global);
  commandHandler(remoteDebugger);
})();

function setup() {
  let noIP = true;
  let configured = false;
  process.argv.forEach((arg, index, array) => {
    if (arg === '--debug') {
      global.loggingLevel = 'debug';
    }
    if (arg === '--help') {
      console.log(helpMessage);
      process.exit();
    }
    if (arg === '-p') {
      global.packageAbsolutePath = array[index + 1];
    }
    if (arg === '-n') {
      global.packageName = array[index + 1];
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
      const config = require(configPath);
      Object.assign(global, config);
      configured = true;
    }
  });
  if (noIP)
    delete global.deviceIP;
  if (!configured) {
    console.log('\x1b[31m%s\x1b[0m', 'Config File not Specified');
    process.exit();
  }
}

function configure() {
  if (!global.packageName) {
    logger.error('Package Name not Specified');
    process.exit();
  }
  if (!global.packagePath) {
    logger.error('Package .apk File Path not Specified');
    process.exit();
  }
  global.packageAbsolutePath = global.packagePath;
  if (global.packagePath[0] !== '/') {
    global.packageAbsolutePath = path.join(process.cwd(), global.packagePath);
  }

  if (!global.packageAbsolutePath.includes('.apk')) {
    console.log('\x1b[33m%s\x1b[0m', 'Warning: Package File is not .apk');
  }
  if (!fs.existsSync(global.packageAbsolutePath)) {
    console.log('\x1b[33m%s\x1b[0m', 'Warning: Package File not Exists at Specified Path');
  }

  logger.success('Debugger Started');
  logger.info(`Configuration:\n`
    + ` Package Name:\t${global.packageName}\n`
    + ` Package Path:\t${global.packageAbsolutePath}\n`
    + ` Using IP:\t${global.deviceIP ? global.deviceIP : 'No'}\n`
    + ` Server Port:\t${global.ADBPort ? global.ADBPort : 'Default'}\n`);
}