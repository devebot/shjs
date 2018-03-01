'use strict';

var assert = require('assert');
var Promise = global.Promise;

try {
  Promise = require('bluebird');
} catch(err) {}

assert.ok(typeof Promise === 'function',
    'Promise is unsupported. Please install "bluebird" to support it');

var defer = function() {
  var resolve, reject;
  var promise = new Promise(function(onResolved, onRejected) {
    resolve = onResolved;
    reject = onRejected;
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

module.exports = defer;
