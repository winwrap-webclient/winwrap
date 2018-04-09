import { Documented } from '../docs';

export default class Stack extends Documented {
  constructor(channel) {
    super();
    this.channel_ = channel;
    this.breaks = [];
  }

  GetPauseLine(name) {
    let line = null;
    if (this.stack.length > 0) {
      let stack0 = this.stack[0];
      if (stack0.name === name) {
        line = stack0.linenum;
      }
    }
    return line;
  }

  StateResponseHandler(response) {
    if (response.response !== '!state') {
      if (response.stack !== undefined) {
        this.stack = response.stack;
      } else {
        this.stack = [];
      }
    }
  }
}
