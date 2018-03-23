import { ChannelFactory } from './ChannelFactory';

describe('ChannelFactory', () => {
  describe('constructor()', () => {
    test('should throw when missing required options', () => {
      expect(() => new ChannelFactory()).toThrow();
    });
  });
});
