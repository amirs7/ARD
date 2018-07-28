const fs = require('fs');

const { install, restart, stopLog } = require('../debugger');
const { logger } = require('../utils/index');

class Watcher {
  constructor(config){
    this.packageAbsolutePath = config.packageAbsolutePath;
  }

}

module.exports = Watcher;