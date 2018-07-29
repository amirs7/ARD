const childProcess = require('child_process');
const http = require('http');
const https = require('https');
const spawn = childProcess.spawn;
const fs = require('fs');
if (fs.existsSync('debug.log'))
  fs.unlinkSync('debug.log');
const Error = require('./errors');
const levels = {
  'debug': 0,
  'info': 1,
  'error': 2
};
function log(style, message) {
  if (message) {
    fs.appendFileSync('debug.log', `${message}\n`, 'utf8');
    console.log(style, message);
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
  warning: (message) => {
    log('\x1b[5m\x1b[33m%s\x1b[0m', message);
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

const commandExecutionTimeout = 60000;

class Loading {
  constructor() {
    this.process = childProcess.fork('./lib/utils/loader.js');
  }

  stop() {
    this.process.kill();
  }
}

async function executeCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug(`Executing: ${command}`);
      let cw = command.split(' ');
      let comm = cw[0];
      cw.splice(0, 1);
      let result = childProcess.spawnSync(comm, cw, { timeout: commandExecutionTimeout });
      let stdout = result.stdout;
      let stderr = result.stderr;
      let error = result.error;
      let status = result.status;
      let pid = result.pid;
      if (status === 0) {
        logger.debug(`${pid}:Success:${stdout.toString()}`);
        resolve(stdout.toString());
      } else {
        logger.debug(`${pid}:Error:Code=${status}:${error}`);
        logger.debug(`${pid}:STDERR:${stderr.toString()}`);
        if (error && error.code === 'ETIMEDOUT')
          return reject(new Error.Timeout());
        reject({ message: stderr.toString() });
      }
    } catch (err) {
      logger.debug(err);
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

function httpGet(options) {
  let port = options.port == 443 ? https : http;

  return new Promise((resolve, reject) => {
    let req = port.request(options, function(res) {
      let output = '';
      console.log(options.host + ':' + res.statusCode);
      res.setEncoding('utf8');

      res.on('data', function(chunk) {
        output += chunk;
      });

      res.on('end', function() {
        try {
          console.log(output);
          let obj = JSON.parse(output);
          resolve({ statusCode: res.statusCode, obj });
        }catch(err) {
          reject();
        }
      });
    });
    req.on('error', function(err) {
      reject(err);
    });
    req.end();
  });
};

function isGraterVersion(v1,v2) {
  let v1 = v1.split('.');
  let v2 = v2.split('.');
  console.log(v1);
  console.log(v2);
}

function checkForUpdate(currentVersion) {
  executeCommand('npm show android-remote-debugger version').then((version)=>{
    version = version.replace('\n','');
    if(currentVersion !== version)
      console.log('\x1b[33m%s\x1b[0m',`Update available, Version ${version} has been released`)
  }).catch(()=>{});
}

module.exports = {
  executePipeCommand, executeCommand, sleep, logger, stopChild, checkForUpdate, Loading
};