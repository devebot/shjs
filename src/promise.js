'use strict';

import assert from 'assert';

// use bluebird if it is available
let Promise = global.Promise, bb = null;

try {
  Promise = bb = require('bluebird');
} catch(err) {}

assert.ok(typeof Promise === 'function',
    'Promise is unsupported. Please install "bluebird" to support it');

// define TimeoutError constructor
let TimeoutError = null;
if (Promise === bb) {
  TimeoutError = Promise.TimeoutError;
} else {
  TimeoutError =   function(timeout, message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = message || 'Timeout';
    this.timeout = timeout;
  };
  TimeoutError.prototype = Object.create(Error.prototype);
  TimeoutError.prototype.name = "TimeoutError";
}

// define timeoutify() utility function
let timeoutify = function(promise, timeout) {
  if (Promise === bb) {
    return Promise.resolve(promise).timeout(timeout);
  }

  let handler, timeoutError = new TimeoutError(timeout);
  return Promise.race([
    promise,
    new Promise(function(onResolved, onRejected) {
      handler = setTimeout(function() {
        onRejected(timeoutError);
      }, timeout);
    }),
  ]).then(function(v) {
    clearTimeout(handler);
    return v;
  }, function(err) {
    clearTimeout(handler);
    throw err;
  });
}

export { Promise as default, timeoutify, TimeoutError }
