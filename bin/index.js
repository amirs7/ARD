#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { install, restart, flushLogs, log } = require('../lib/build');
const { connect, connectOverWIFI, connectOverWIFIWithIP } = require('../lib/connect');
const { logger } = require('../lib/utils');
const config = require('../lib/config');
run();

function run() {

  global.loggingLevel = 'info';

  setup();

  if(!global.packageName){
    console.log('\x1b[31m%s\x1b[0m', 'Package Name not Specified');
    process.exit();
  }
  if(!global.packageAbsolutePath){
    console.log('\x1b[31m%s\x1b[0m', 'Package .apk File Path not Specified');
    process.exit();
  }
  let packageAbsolutePath = global.packageAbsolutePath;
  if (global.packageAbsolutePath[0] !== '/'){
    global.packageAbsolutePath = path.join(process.cwd(),global.packageAbsolutePath);
  }
  if(!global.packageAbsolutePath.includes('.apk')){
    console.log('\x1b[33m%s\x1b[0m', 'Warning: Package File is not .apk');
  }
  if(!fs.existsSync(global.packageAbsolutePath)){
    console.log('\x1b[33m%s\x1b[0m', 'Warning: Package File not Exists at Specified Path');
  }


  console.log('\x1b[36m%s\x1b[0m', 'Debugger Started');
  console.log('\x1b[36m%s\x1b[0m', `Configuration:\n`
    + ` Package Name:\t${global.packageName}\n`
    + ` Package Path:\t${global.packageAbsolutePath}\n`
    + ` Using IP:\t${global.deviceIP?global.deviceIP:'No'}\n`
    + ` Server Port:\t${global.ADBPort?global.ADBPort:'Default'}\n`);

  handleInputs();
}

function handleInputs() {
  process.stdin.on('data', async function(data) {
    let helpMessage = 'Available Commands:\n' +
      ' i\t remove the package from device and install it again\n' +
      ' r\t restart the application\n' +
      ' c\t connect to the device over wifi\n' +
      ' cw\t connect to the device only over wifi\n' +
      ' f\t flush all logs\n' +
      ' l\t monitor logs\n';
    return new Promise(async(resolve, reject) => {
      let command = data.toString().trim();
      try {
        switch (command) {
          case 'i':
            await install();
            break;
          case 'r':
            await restart();
            break;
          case 'f':
            await flushLogs();
            break;
          case 'l':
            await log();
            break;
          case 'c':
            await connect();
            break;
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
          case 'flush':
            logger.success('Log file flushed');
            logger.flush();
            break;
          default:
            let words = command.split(' ');
            console.log(`${command}: Command not Found`);
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
  process.argv.forEach((arg, index, array)=>{
    if(arg === '--debug'){
      global.loggingLevel = 'debug';
    }
    if(arg === '-p'){
      global.packageAbsolutePath = array[index+1];
    }
    if(arg === '-n'){
      global.packageName = array[index+1];
    }
    if(arg === '--ip'){
      noIP = false;
    }
    if(arg.includes('.js') && index > 1){
      const configPath = path.join(process.cwd(), arg);
      if(!fs.existsSync(configPath)){
        console.log('\x1b[31m%s\x1b[0m', 'Config File not Exists');
        process.exit();
      }
      const config = require(configPath);
      Object.assign(global, config);
      configured = true;
    }
  });
  if(noIP)
    delete global.deviceIP;
  if(!configured){
    console.log('\x1b[31m%s\x1b[0m', 'Config File not Specified');
    process.exit();
  }
}