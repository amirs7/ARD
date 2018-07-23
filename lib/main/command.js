const { install, update, restart, flushLogs, stopLog, liveLog } = require('../build');
const { connect, connectOverWIFI, connectOverWIFIWithIP } = require('../connect');
const { logger } = require('../utils');

const Watcher = require('./watch');

function commandHandler() {
  process.stdin.on('data', async function(data) {
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
            await Watcher.startWatch();
            logger.success('Watcher Started');
            break;
          case 'end watch':
          case 'ew':
            await Watcher.stopWatch();
            logger.success('Watcher Stopped');
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
            logger.success('Live Logging Stopped');
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

module.exports = commandHandler;