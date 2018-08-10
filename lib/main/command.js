const { logger } = require('../utils/index');

const commandsMap = {
  i: 'install',
  install: 'install',
  un: 'uninstall',
  uninstall: 'uninstall',
  u: 'update',
  update: 'update',
  start: 'start',
  stop: 'stop',
  r: 'restart',
  restart: 'restart',
  c: 'connect',
  connect: 'connect',
  f: 'flushLogs',
  flush: 'flushLogs',
  sl: 'stopLog',
  'start watch':'startWatch',
  w: 'startWatch',
  'end watch':'stopWatch',
  ew: 'stopWatch',
  unlock: 'unlockDeviceWithPassword'
};

let helpMessage = 'Available Commands:\n' +
  ' i, install\t remove the package from device and install it again\n' +
  ' u, update\t install the application preserving data and settings\n' +
  ' r, restart\t restart the application\n' +
  ' c, connect\t connect to the device over wifi\n' +
  ' w, watch\t enter watch mode\n' +
  ' ew, end watch\t end watch mode\n' +
  ' cw, connect wifi\t connect to the device only over wifi\n' +
  ' f, flush\t flush all logs\n' +
  ' l\t monitor real time logs\n' +
  ' sl, stop logging\n';

function isValidIP(ip) {
  let segs = ip.split('.');
  let result = true;
  if(segs.length !== 4)
    return false;
  segs.forEach(seg=>{
    if(isNaN(seg))
      result = false;
    if(seg > 255 || seg < 0)
      result = false;
  });
  return result;
};

function commandHandler(remoteDebugger) {
  return async function(command) {
    let func = commandsMap[command];
    if (func) {
      try {
        await remoteDebugger[func]();
      } catch (error) {

      }
    } else {
      try {
        switch (command) {
          case 'help':
            console.log(helpMessage);
            break;
          case 'exit':
            process.exit();
            break;
          default:
            let words = command.split(' ');
            if (words[0] === 'l' || words[0] === 'log') {
              await remoteDebugger.liveLog(words[1] || 'SystemWebChromeClient');
            } else if (words[0] === 'cw' || words[0] === 'connect wifi') {
              if (!words[1])
                logger.error('IP not specified');
              else if (!isValidIP(words[1])) {
                logger.error('IP is invalid');
              } else {
                await remoteDebugger.connectOverWIFIWithIP(words[1]);
              }
            } else {
              console.log(`${command}: Command not Found`);
            }
            break;
        }
      }
      catch (error) {

      }
    }
  }
}

module.exports = { commandHandler, helpMessage };