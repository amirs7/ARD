#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { install, update, restart, flushLogs, stopLog, liveLog } = require('../lib/build');
const { connect, connectOverWIFI, connectOverWIFIWithIP } = require('../lib/connect');
const { logger } = require('../lib/utils');
const config = require('../lib/config');
run();

function run() {

  global.loggingLevel = 'info';

  setup();

  if (!global.packageName) {
    console.log('\x1b[31m%s\x1b[0m', 'Package Name not Specified');
    process.exit();
  }
  if (!global.packagePath) {
    console.log('\x1b[31m%s\x1b[0m', 'Package .apk File Path not Specified');
    process.exit();
  }
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
  fs.watchFile(global.packageAbsolutePath, {}, async(event) => {
    if (watching) {
      try {
        await install();
        await restart();
      } catch (error) {
        logger.error(error.message);
        logger.hint(error.hint);
      }
    } else {
    }
  });
  handleInputs();
}
let watching = false;

async function watch() {
  return new Promise(async (resolve,reject) => {
    watching = true;
    await liveLog('SystemWebChromeClient');
  });
}
async function endWatch() {
  return new Promise(async (resolve,reject) => {
    watching = false;
    await stopLog();
    resolve()
  });
}
function handleInputs() {
  process.stdin.on('data', async function(data) {
    let helpMessage = 'Available Commands:\n' +
      ' i, install\t remove the package from device and install it again\n' +
      ' u, update\t install the application preserving data and settings\n' +
      ' r, restart\t restart the application\n' +
      ' c, connect\t connect to the device over wifi\n' +
      ' w, watch\t enter watch mode\n' +
      ' ew, end watch\t end watch mode\n' +
      ' cw, connect wifi\t connect to the device only over wifi\n' +
      ' f, flush\t flush all logs\n' +
      ' ll\t monitor logs\n';
    return new Promise(async(resolve, reject) => {
      let command = data.toString().trim();
      try {
        switch (command) {
          case 'install':
          case 'i':
            await install();
            break;
          case 'update':
          case 'u':
            await update();
            break;
          case 'restart':
          case 'r':
            await restart();
            break;
          case 'watch':
          case 'w':
            await watch();
            break;
          case 'end watch':
          case 'ew':
            await endWatch();
            break;
          case 'connect':
          case 'c':
            await connect();
            break;
          case 'connect wireless':
          case 'cw':
            if (global.deviceIP)
              await connectOverWIFIWithIP(global.deviceIP);
            else
              await connectOverWIFI();
            break;
          case 'help':
            console.log(helpMessage);
            break;
          case 'exit':
            process.exit();
            break;
          case 'f':
          case 'flush':
            await flushLogs();
            logger.success('Log file flushed');
            logger.flush();
            break;
          case 'ir':
            await install();
            await restart();
            break;
          case 'sl':
            await stopLog();
            break;
          default:
            let words = command.split(' ');
            if (words[0] === 'll' || words[0] === 'live log') {
              await liveLog(words[1] || 'SystemWebChromeClient');
            } else {
              console.log(`${command}: Command not Found`);
            }
            break;
        }
      } catch (error) {
        logger.error(error.message);
        logger.hint(error.hint);
      }
    });
  }).on('end', function() {
    console.log('Done');
  });
}

function setup() {
  let noIP = true;
  let configured = false;
  process.argv.forEach((arg, index, array) => {
    if (arg === '--debug') {
      global.loggingLevel = 'debug';
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