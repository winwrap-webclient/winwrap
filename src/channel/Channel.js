/* eslint-disable no-undefined */
import { assert, randomId } from '../utils';
import { Documented } from '../docs';
import Message from './Message';
import CommitRebase from '../commit/CommitRebase';

export default class Channel extends Documented {
  constructor(router, version) {
    super();
    this._router = router;
    this._clientId = randomId();
    this.allocatedId = null;
    this.version = version;
  }
  async open(onMessageCallback = null) {
    const attach = await this.postMessage('attach', {
      version: this.version,
      unique_name: this._clientId,
    });

    assert(attach.unique_name !== this._clientId, `channel.connect() response contained invalid unique_name: ${attach.unique_name}. ${this.help()}`, attach);

    this.allocatedId = attach.allocated_id;
    this.edits = new CommitRebase(this.allocatedId);

    this.deferMessage('opendialog', { dir: '\\', exts: 'wwd|bas' });
    this.postMessage('stack');

    if (onMessageCallback) {
      this.onMessage(onMessageCallback);
    }
  }
  onMessage(callback) {
    this._router.addListener(this.allocatedId, callback);
  }
  deferMessage(type, message) {
    return this.postMessage(type, message, false);
  }
  postMessage(type, messageData = {}, flush = true) {
    const message = new Message({
      ...messageData,
      id: this.allocatedId,
    });
    return this._router.enqueue(type, message, flush);
  }
  async commit(change) {
    const commit = this.edits.getCommit();
    const response = await this.postMessage('commit', commit);
    return this.edits.applyCommit(response);
  }
  getAutocompletions(context) {
    assert(context, `channel.getAutocompletions(context) missing required param 'context'. ${this.help()}`);
    return this.postMessage('autocomplete', context);
  }
}


export class OldChannel {
  constructor(remote, name) {
    this.Remote = remote;
    this.Name = name;
    // set Basic async _InitializeAsync(factory)
    this.UI = undefined;
    this.CommitRebase = undefined;
    this.ClientID = `0000000000${Math.floor(Math.random() * 2147483647)}`.slice(-10).toString();
    // explicitly set in ?attach
    this.allocatedId = null;
    this.Version = undefined;
    this.generation = 0;
    this.commitcounter = 0;
    this.busy = false;
    this.initHandlers = [];
    this.responseHandlers = [];
    this.logger = undefined;
  }

  async InitializeAsync() { // eslint-disable-line max-statements
    while (this.busy) {
      this.Remote.Wait(100);
    }

    this.busy = true;
    this.CommitRebase = new CommitRebase(this);

    // complete initialization
    this.initHandlers.forEach(handler => handler());

    const request = { command: '?attach', version: '10.40.001', unique_name: this.ClientID };
    let attach = null;
    try {
      attach = await this.SendAndReceiveAsync(request, '!attach');
    } catch (err) {
      console.log('ERROR channel.js InitializeAsync ', err);
      // const attachErrMsg = `${this.Name} is not connected to the server`;
      // this.SetStatusBarText(attachErrMsg);
      this.busy = false;
      return;
    }
    this.busy = false;
    if (attach.unique_name !== this.ClientID) {
      console.log(`${this.Name} ${request.command} failed ${attach.unique_name} !== ${this.ClientID}`);
      return;
    }
    this.allocatedId = attach.allocated_id;
    this.Version = attach.version;
    // let versionInfo = `WinWrap Version = ${this.Version}`;
    // let channelInfo = `${this.Name} allocatedId = ${this.allocatedId}`;
    // this.SetStatusBarText(`${versionInfo}, ${channelInfo}`);
    this.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
    this.PushPendingRequest({ command: '?stack' });
    // now UI is initialized
  }

  AddInitHandler(handler) {
    this.initHandlers.push(handler);
  }

  AddResponseHandlers(handlers) {
    Object.keys(handlers).forEach(key => {
      const response = key[0] === '_' ? key : `!${key}`;
      if (this.responseHandlers[response] === undefined) {
        this.responseHandlers[response] = [];
      }
      const handler = handlers[key];
      this.responseHandlers[response].push(handler);
      if (key === 'state') {
        this.AddResponseHandlers({
          notify_begin: handler,
          notify_end: handler,
          notify_pause: handler,
          notify_resume: handler,
        });
      }
    });
  }

  Poll() {
    if (++this.commitcounter === 20) {
      // push any pending commits (approx once every 2 seconds)
      this.PushPendingCommit();
      this.commitcounter = 0;
    }
  }

  PushPendingRequest(request) {
    if (request) {
      request.datetime = new Date().toLocaleString();
      request.id = this.allocatedId;
      if (request.command.substring(0, 1) === '?') {
        request.gen = this._NextGeneration(false);
      }
      this._Log('=>', request);
      this.Remote.PushPendingRequest(request);
    }
  }

  ProcessResponse(response) {
    this._Log('<=', response);
    const handlers = this.responseHandlers[response.response];
    if (handlers !== undefined) {
      handlers.forEach(handler => handler(response));
    }
  }

  PushPendingCommit() {
    this.PushPendingRequest(this.CommitRebase.GetCommitRequest());
  }

  async SendAndReceiveAsync(request, expected) {
    request.datetime = new Date().toLocaleString();
    request.id = this.allocatedId;
    request.gen = this._NextGeneration(request.command === '?attach');
    this._Log('=>', request);
    let result = await this.Remote.SendAndReceiveAsync(request, expected, request.id);
    //console.log(`Channel.SendAndReceiveAsync expected = ${expected}`);
    this._Log('<=', result);
    return result;
  }

  SetLogger(logger) {
    this.logger = logger;
  }

  SetStatusBarText(text) {
    let response = { response: '_statusbar', text: text };
    this.ProcessResponse(response);
  }

  _Log(label, data) {
    if (this.logger !== undefined) {
      this.logger(label, data);
    }
  }

  _NextGeneration(reset) {
    if (reset) {
      this.generation = 0;
    } else if (++this.generation === 0x10000) {
      this.generation = 1; // 16 bit number (never 0)
    }
    return this.generation;
  }
}
