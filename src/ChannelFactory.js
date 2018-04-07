import { assert } from './utils';
import { Documented } from './docs';
import Channel from './channel/Channel';

const requiredProperty = (prop, link) => `
  new ChannelFactory(config) missing required property 'config.${prop}'. ${link}
`;

export class ChannelFactory extends Documented {
  constructor(config) {
    super();
    const {
      serverURL = null,
      transport = null,
    } = config;

    assert(serverURL, requiredProperty('serverURL', this.help()));

    this.transport = transport;
  }
  createChannel() {
    return new Channel(this.transport);
  }
}
