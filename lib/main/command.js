const { logger } = require('../utils/index');

const Watcher = require('./watch');

const commandsMap = {
  i: 'install',
  install: 'install',
  u: 'update',
  update: 'update',
  r: 'restart',
  restart: 'restart',
  c: 'connect',
  connect: 'connect',
  f: 'flushLogs',
  flush: 'flushLogs',
  sl: 'stopLog'
};

function commandHandler(remoteDebugger) {
  process.stdin.on('data', async function(data) {
    return new Promise(async(resolve, reject) => {
      let command = data.toString().trim();
      let func = commandsMap[command];
      if (func)
        await remoteDebugger[func]();
      else {
        try {
          switch (command) {
            case 'watch':
            case 'w':
              await Watcher.startWatch();
              logger.success('Watcher Started');
              break;
            case 'end watch':
            case 'ew':
              await Watcher.stopWatch();
              logger.success('Watcher Stopped');
              break;
            case 'connect wireless':
            case 'cw':
              if (global.deviceIP)
                await remoteDebugger.connectOverWIFIWithIP(global.deviceIP);
              else
                await remoteDebugger.connectOverWIFI();
              break;
            case 'help':
              console.log(helpMessage);
              break;
            case 'exit':
              process.exit();
              break;
            case 'ir':
              await remoteDebugger.install();
              await remoteDebugger.restart();
              break;
            default:
              let words = command.split(' ');
              if (words[0] === 'll' || words[0] === 'live log') {
                await remoteDebugger.liveLog(words[1] || 'SystemWebChromeClient');
              } else {
                console.log(`${command}: Command not Found`);
              }
              break;
          }
        } catch (error) {}
      }
    });
  }).on('end', function() {
    console.log('Done');
  });
}

module.exports = commandHandler;