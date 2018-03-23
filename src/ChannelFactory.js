import { assert } from './utils';
import {
  transportInterfaceDocLink,
  editorInterfaceDocLink,
} from './docs';

const reqProp = (prop, link) => `
  new ChannelFactory(config) missing required config property '${prop}'.
  Read the documentation: ${link}
  - config
`;

export class ChannelFactory {
  constructor(config) {
    const { transport = null, editor = null } = config;
    assert(transport, reqProp('transport', transportInterfaceDocLink), config);
    assert(editor, reqProp('editor', editorInterfaceDocLink), config);
    this.transport = transport;
    this.editor = editor;
  }
  createChannel() {
    if (this.editor) {
      const id = Math.floor(Math.random() * 1e8);
      return { id };
    }
    throw new Error('missing editor');
  }
}

export default {
  ChannelFactory,
};
