import { Documented } from '../docs';

export default class SyntaxError extends Documented {
  constructor(channel) {
    super();
    this.channel_ = channel;
    this.response_ = {};
  }

  ClearError() {
    this.response_ = {};
  }

  ErrorResponseHandler(response) {
    this.response_ = response;
    if (response.response === '!syntax' && response.okay) {
      // do nothing
    }
    else if (this.channel_.CommitRebase.Name() !== response.error.macro_name) {
      this.channel_.PushPendingRequest({ command: '?read', target: response.error.macro_name });
    }
  }

  GetError() {
    let response = this.response_;
    let error;
    if (response.response !== undefined) {
      error = response.error; // can be undefined (no error)
    } else {
      error = null; // error value not valid
    }
    return error;
  }

  GetMessage() {
    /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
    notification.error.line + '\n' + notification.error.desc);*/
    let response = this.response_;
    let msg = "";
    switch (response.response) {
      case "!syntax":
      if (response.okay) {
        msg = "No syntax errors.";
      } else {
        // will get !notify_error ?
        msg = this._makeMessage(response.error);
      }
      break;
      case "!notify_errors":
      msg = this._makeMessage(response.error);
      break;
      default:
      break;
    }
    return msg;
  }

  _makeMessage(theerror) {
    let msg = "";
    //errormsg = error.macro_name + '@' + error.line_num + ': ' + error.line + '\n' + error.desc;
    msg = `${theerror.macro_name}@${theerror.line_num}.${theerror.offset}: \"${theerror.line}\" ${theerror.desc}`
    msg = msg.replace(/\s\s+/g, ' ');
    return msg;
  }
}
