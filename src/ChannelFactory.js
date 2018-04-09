import { assert } from './utils';
import { Documented } from './docs';
import Channel from './channel/Channel';
import Router from './channel/Router';

const VERSION = '10.40.001';

const requiredProperty = (prop, link) => `
  new ChannelFactory(config) missing required property 'config.${prop}'. ${link}
`;

export class ChannelFactory extends Documented {
  constructor(config) {
    super();
    const {
      serverURL = null,
      transport = null,
      version = VERSION,
    } = config;

    assert(serverURL, requiredProperty('serverURL', this.help()));

    this.version = version;
    this.transport = transport;
    this.router = new Router(transport);
  }
  createChannel() {
    return new Channel(this.router, this.version);
  }
}
