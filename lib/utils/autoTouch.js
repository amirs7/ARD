const parser = require('xml2js').parseString;
const ADB = require('../adb');
const { sleep, logger } = require('../utils');
const fs = require('fs');
// 0,0 1,0 2,0
// 0,1 1,1 2,1
// 0,2 1,2 2,2

// 0 1 2
// 3 4 5
// 6 7 8

class AutoTouch {
  constructor() {
    this.tl = {
      x: 0,
      y: 0
    };
    this.w = 0;
    this.h = 0;
  }

  getXY(x, y) {
    return {
      x: Math.round(this.tl.x) + Math.round(this.w * x),
      y: Math.round(this.tl.y) + Math.round(this.h * y)
    };
  }

  async emulatePattern(sequence) {
    return new Promise(async(resolve, reject) => {
      let seq = [];
      for (let i = 0; i < sequence.length - 1; i++) {
        if (sequence[i] < 0 || sequence[i] > 8)
          return reject(`${sequence[i]} is out of bound`);
        let x1 = sequence[i] % 3;
        let y1 = sequence[i] / 3;
        let x2 = sequence[i + 1] % 3;
        let y2 = sequence[i + 1] / 3;
        let xy1 = this.getXY(x1, y1);
        let xy2 = this.getXY(x2, y2);
        seq.push([xy1.x, xy1.y, xy2.x, xy2.y]);
      }
      await ADB.emulateInput({ type: 'keyevent', keyCode: 26 });
      await ADB.emulateInput({ type: 'swipe', coords: [150, 1600, 150, 1000] });
      for (let i = 0; i < seq.length; i++) {
        setTimeout(async() => {
          await ADB.emulateInput({ type: 'swipe', coords: seq[i] });
        }, 500 * i);

      }
      resolve(seq);
    });
  }

  async emulatePassword(password) {
    return new Promise(async(resolve, reject) => {
      try {
        await ADB.emulateInput({ type: 'keyevent', keyCode: 26 });
        await ADB.emulateInput({ type: 'swipe', coords: [150, 1600, 150, 1000] });
        await ADB.emulateInput({ type: 'text', text: password});
        await ADB.emulateInput({ type: 'keyevent', keyCode: 66 });
        await ADB.emulateInput({ type: 'keyevent', keyCode: 'KEYCODE_HOME' });
        resolve();
      } catch (error){
        console.log(error);
      }
    });
  }

  async getPatternBounds() {
    let ta = this;
    return new Promise(async(resolve, reject) => {
      try {
        let file = fs.readFileSync('../../../view.xml').toString();
        parser(file, function(error, result) {
          if (error)
            return reject(error);
          let lockNode = findObject(result, 'resource-id', 'com.android.systemui:id/lockPatternView');
          let bounds = lockNode.bounds.replace('[', '').replace(']', '').replace('[', ',').replace(']', '').split(',');
          let tlx = bounds[0];
          let tly = bounds[1];
          let brx = bounds[2];
          let bry = bounds[3];
          ta.w = Math.round((brx - tlx) / 2);
          ta.h = Math.round((bry - tly) / 2);
          ta.tl = { x: tlx, y: tly };
          resolve(bounds);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

function findObject(o, k, v) {
  let result;
  if (o instanceof Object) {
    if (o[k] === v)
      return o;
    else {
      for (let kk in o) {
        result = findObject(o[kk], k, v);
        if (result)
          return result;
      }
    }
  } else if (o instanceof Array) {
    for (let i = 0; i < o.length; i++) {
      let oo = o[i];
      if (o[k] === v)
        return oo;
      else {
        result = findObject(oo, k, v);
        if (result)
          return result;
      }
    }
  }
  return null;
}

module.exports = AutoTouch;