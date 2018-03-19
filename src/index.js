import {
  transportInterfaceDocLink,
  editorInterfaceDocLink,
} from './docs';

export class ChannelFactory {
  constructor({ transport = null, editor = null }) {
    if (!transport) {
      throw new Error(`config.transport required, ${transportInterfaceDocLink}`);
    }
    if (!editor) {
      throw new Error(`config.transport required, ${editorInterfaceDocLink}`);
    }
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
