const tty = require('tty');
function print(s) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(s);
}

function decode(buffer) {
  if (buffer[0] === 13)
    return 'return';
  if (buffer[0] === 127)
    return 'erase';
  if (buffer[0] === 9)
    return 'tab';
  if (buffer[0] === 27 && buffer[1] === 91) {
    if (buffer[2] === 65)
      return 'up';
    if (buffer[2] === 66)
      return 'down';
  } else
    return null;
}

const commands = [
  'install', 'uninstall', 'start', 'stop', 'unlock', 'watch', 'exit','update','restart','connect', 'flush'
];

class Terminal {
  constructor(cb) {
    process.stdin.setRawMode(true);
    this.cb = cb;
    this.idx = 0;
    this.command = '';
    this.commands = [];
    process.stdin.on('data', data => {
      //console.log(data);
      let command = this.get();
      if (decode(data) === 'return') {
        this.enter();
        process.stdout.write('\n');
        if (command === 'exit')
          process.exit();
      } else if (decode(data) === 'tab') {
        this.predict();
      } else if (decode(data) === 'up') {
        print(this.up());
      } else if (decode(data) === 'down') {
        print(this.down());
      } else if (decode(data) === 'erase') {
        print(this.erase());
      } else {
        print(this.add(data.toString()));
      }
    });

  }

  predict() {
    let candidates = commands.filter(command => command.substring(0, this.command.length) === this.command);
    if (candidates.length === 1) {
      this.command = candidates[0];
      print(candidates[0]);
    }
    else {
      print(candidates.join(', ') + '\n');
      print(this.command);
    }
  }

  erase() {
    this.command = this.command.substring(0, this.command.length - 1);
    return this.command;
  }

  add(c) {
    this.command += c;
    return this.get();
  }

  enter() {
    let command = this.command;
    this.commands.push(command);
    this.idx = this.commands.length;
    this.done();
    this.command = '';
    return command;
  }

  done() {
    this.cb(this.command);
  }

  get() {
    return this.command;
  }

  up() {
    if (this.idx > 0)
      this.idx--;
    this.command = this.commands[this.idx];
    return this.get();
  }

  down() {
    if (this.idx < this.commands.length - 1)
      this.idx++;
    this.command = this.commands[this.idx];
    return this.get();
  }
}

module.exports = Terminal;