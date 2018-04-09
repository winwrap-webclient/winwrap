import Router from './Router';

describe('Router', () => {
  describe('executeListeners()', () => {
    const router = new Router();
    const responseData = [
      { id: 1, message: '!done' },
      { id: 2, message: '!complete' },
    ];
    const listener = jest.fn();
    router.addListener(1, listener);

    test('should process listeners for each message', () => {
      router.executeListeners(responseData);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener.mock.calls[0][0].message).toBe('!done');
    });
  });
});
