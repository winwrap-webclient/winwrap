/**
 * assert that a value is truthy, or throw an error
 * @param {Any} condition condition to test, any type may be passed
 * @param {String} message custom message
 * @param {Object} objectContext object to pass as context for the error message
 * @returns {Undefined} returns undefined or throws error
 */
export const assert = (condition, message = 'Assertion failed', objectContext = null) => {
  if (!condition) {
    throw new Error(`${message.replace(/\n/g, '').replace(/\s+/g, ' ')}${objectContext ? `: ${JSON.stringify(objectContext, null, 2)}` : ''}`);
  }
};

/**
 * get the callee of a function
 * useful for automatic documentation for errors
 * @return {String} name of function that invoked the current closure containing callee()
 */
export const callee = () => {
  const { stack } = new Error();
  const re = /(\w+)?@|at ([^(]+)/g;
  re.exec(stack);
  re.exec(stack);
  const [,, fnName] = re.exec(stack);
  if (fnName.indexOf('new ') === 0) {
    return 'constructor';
  }
  return fnName.split('.').reverse()[0];
};
