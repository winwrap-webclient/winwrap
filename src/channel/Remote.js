import { isUndefined } from 'lodash';

export default class Remote {
  constructor(basic, name, transport) {
    this.Basic = basic;
    this.Name = name;
    this.transport_ = transport;
    this.channels_ = {};
    this.pollingIndex_ = -1;
    // not waiting to poll
    this.polling_ = false;
    this.timerId_ = null;
    // not in Poll
    this.pollBusy_ = false;
    this.pendingRequests = [];
  }

  async InitializeAsync() {
    for (const channel of Object.values(this.channels_)) {
      await channel.InitializeAsync(); // eslint-disable-line no-await-in-loop
    }
    this.StartPolling();
  }

  AddChannel(channel) {
    this.channels_[channel.Name] = channel;
  }

  ChannelById(id) {
    return Object.values(this.channels_).filter(channel => channel.AllocatedID === id)[0];
  }

  ChannelByName(name) {
    return this.channels_[name];
  }

  PollBusy() {
    return this.pollBusy_;
  }

  PushPendingRequest(request) {
    this.pendingRequests.push(request);
  }

  ProcessResponses(responses, id) {
    responses.forEach(response => {
      response.datetimeClient = new Date().toLocaleString();
      const channel = this.ChannelById(id);
      if (!isUndefined(channel)) {
        channel.ProcessResponse(response);
      }
    });
  }

  async SendAndReceiveAsync(request, expected, id) {
    const requests = this._ExtractPendingRequestsForId(id);
    console.log(`Remote.SendAndReceiveAsync(${id})>>> ${this._valuesmsg(requests, 'command')}`);
    requests.push(request);
    let response = null;
    const responses = [];
    const start = new Date().getTime();
    let end = start;
    // retrys may not be necessary - haven't seen
    for (let trys = 1; trys < 10; trys++) {
      const tryresponses = await this.transport_.SendAndReceiveAsync(trys === 1 ? requests : [], id); // eslint-disable-line no-await-in-loop
      end = new Date().getTime();
      tryresponses.forEach(tryresponse => {
        if (tryresponse.response === expected) {
          response = tryresponse;
        } else {
          responses.push(tryresponse);
        }
      });
      if (response !== null) {
        break;
      }
      await this.Wait(100);
    }
    console.log('Remote.SendAndReceiveAsync(' + id + ')<<< ' + this._valuesmsg(responses.concat(response), 'response'));
    this.ProcessResponses(responses, id);
    console.log({
      request: this._valuesmsg(requests, 'command'),
      expected: expected.toString(),
      results: this._valuesmsg(response, 'response'),
      trys: trys,
      elapsedms: end - start
    });
    return response;
  }

  SetStatusBarText(text) {
    Object.values(this.channels_).forEach(channel => channel.SetStatusBarText(text));
  }

  // stop during autocomplete and signaturehelp
  StartPolling() {
    if (!this.polling_) {
      // waiting to poll
      this.polling_ = true;
      if (this.timerId_ === null) {
        // waiting to poll
        this.timerId_ = setTimeout(async () => {
          await this.PollAsync();
        }, 100);
      }
    }
  }

  StopPolling() {
    // not waiting to poll
    this.polling_ = false;
    if (this.timerId_ !== null) {
      clearTimeout(this.timerId_);
      this.timerId_ = null;
    }
  }

  async PollAsync() {
    if (!this.polling_ || this.pollBusy_) {
      return;
    }
    this.pollBusy_ = true;
    this.StopPolling(); // not waiting to poll
    Object.values(this.channels_).forEach(channel => channel.Poll());
    let id = 0;
    let requests = [];
    if (this.pendingRequests.length > 0) {
      id = this.pendingRequests[0].id;
      requests = this._ExtractPendingRequestsForId(id);
      console.log('Remote.PollAsync(' + id + ')>>> ' + this._valuesmsg(requests, 'command'));
    } else {
      let channels = Object.values(this.channels_);
      if (++this.pollingIndex_ >= channels.length)
      this.pollingIndex_ = 0;
      id = this.pollingIndex_ < channels.length ? channels[this.pollingIndex_].AllocatedID : 0;
    }
    let responses = [];
    try {
      responses = await this.transport_.SendAndReceiveAsync(requests, id);
    } catch (err) {
      console.log('Remote.PollAsync(' + id + ') error: ' + err);
      let pollErrMsg = `${this.Name} polling error at ${new Date().toLocaleString()}`;
      this.SetStatusBarText(pollErrMsg);
    }
    if (responses.length > 0) {
      console.log('Remote.PollAsync(' + id + ')<<< ' + this._valuesmsg(responses, 'response'));
      this.ProcessResponses(responses, id);
    }
    this.pollBusy_ = false;
    this.StartPolling(); // waiting to poll
  }

  Wait(ms) { // eslint-disable-line class-methods-use-this
    return new Promise(r => setTimeout(r, ms));
  }

  _ExtractPendingRequestsForId(id) {
    const { pendingRequests } = this;
    this.pendingRequests = [];
    const requests = [];
    pendingRequests.forEach(request => {
      if (request.id === id) {
        requests.push(request);
      } else {
        this.pendingRequests.push(request);
      }
    });
    return requests;
  }

  _valuesmsg(data, key) { // eslint-disable-line class-methods-use-this
    const xdata = [].concat(data).filter(item => item !== null && !isUndefined(item));
    const datas = xdata.map(o => o[key]);
    return datas.toString();
  }
}
