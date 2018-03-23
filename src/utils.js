export const assert = (condition, message = 'Assertion failed', objectContext = null) => {
  if (!condition) {
    throw new Error(`${message.replace(/\n/g, '').replace(/\s+/g, ' ')}${objectContext ? `: ${JSON.stringify(objectContext, null, 2)}` : ''}`);
  }
};
