const childProcess = require('child_process');
const spawn = childProcess.spawn;
const fs = require('fs');
const config = require('../config');
const ERRORS = require('../errors');
const levels = {
  'debug': 0,
  'info': 1,
  'error': 2
};
function log(style, message) {
  if (message) {
    fs.appendFileSync(config.logFilePath, `${message}\n`, 'utf8');
    console.log(style, message);
  }
}

class Loading {
  static stop() {
    clearInterval(this.interId);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  }

  static start(message) {
    let P = ['\\', '|', '/', '-'];
    let x = 0;
    this.interId = setInterval(function() {
      if (!message)
        message = '';
      process.stdout.write(`${message}\n`);
      //process.stdout.cursorTo(message.length);
      //process.stdout.write(`\t${P[x++]}\r\n`);
      x &= 3;
    }, 100);
  }
}

const logger = {
  startLoading: (message) => {
    Loading.start(message);
  },
  stopLoading: () => {
    Loading.stop();
  },
  info: (message) => {
    log('\x1b[1m\x1b[34m%s\x1b[0m', `${message}`);
  },
  success: (message) => {
    log('\x1b[32m%s\x1b[0m', message);
  },
  error: (message) => {
    log('\x1b[31m%s\x1b[0m', message);
  },
  hint: (message) => {
    log('\x1b[36m%s\x1b[0m', ` ${message}`);
  },
  debug: (message) => {
    if (levels['debug'] >= levels[global.loggingLevel])
      log('\x1b[33m%s\x1b[0m', message);
  },
  flush: () => {
    fs.writeFileSync(config.logFilePath, '', 'utf8');
  }
};

async function executeCommand(command, error) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug(`Executing: ${command}`);
      let output = childProcess.execSync(command, { stdio: ['pipe', 'pipe', 'pipe'] });
      output = output.toString();
      logger.debug(` => SUCCESS: ${output}`);
      resolve(output);
    } catch (err) {
      logger.debug(` => ERROR: ${err.stderr}`);
      reject(err);
    }
  });
}

let child;
function executePipeCommand(command, args, onData) {
  child = spawn(command, args);
  child.stdout.on('data', onData);
  child.stdout.on('exit', (data) => {
    console.log('Exited');
  });
}
function stopChild() {
  if (child && !child.killed)
    child.kill();
}

async function sleep(amount) {
  return new Promise((resolve) => {
    setTimeout(resolve, amount);
  });
}

module.exports = {
  executePipeCommand, executeCommand, sleep, logger, stopChild
};