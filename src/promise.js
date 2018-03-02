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

module.exports = Promise;
