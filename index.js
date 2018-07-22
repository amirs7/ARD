const stdin = process.openStdin();
const { install, restart, flushLogs, log } = require('./build');
const { connect, connectOverWIFI } = require('./connect');
const { logger } = require('./utils');
let state = 'init';
let helpMessage = 'Available Commands:\n' +
  ' i\t remove the package from device and install it again\n' +
  ' r\t restart the application\n' +
  ' c\t connect to the device over wifi\n' +
  ' cw\t connect to the device only over wifi\n' +
  ' f\t flush all logs\n' +
  ' l\t monitor logs\n';

process.stdin.on('data', async function(data) {
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
        case 'exit':
          resolve();
          break;
        case 'help':
          console.log(helpMessage);
          break;
        case 'flush':
          logger.success('Log file flushed');
          logger.flush();
          break;
        default:
          let words = command.split(' ');
          if (words[0] === 'cw'){
            await connectOverWIFI(words[1]);
          }
          else
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

