'use strict';

import assert from 'assert';

let Promise = null;

try {
  Promise = require('bluebird');
} catch(err) {}

if (typeof Promise === 'function') {
  if (global.Promise !== Promise) {
    global.Promise = Promise;
  }
} else {
  Promise = global.Promise;
}

assert.ok(typeof Promise === 'function',
    'Promise is unsupported. Please install "bluebird" to support it');

// define TimeoutError constructor
let TimeoutError = function(timeout, message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = message || 'Timeout';
  this.timeout = timeout;
};

TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.name = "TimeoutError";

// define timeoutify() utility function
let timeoutify = function(promise, timeout) {
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
