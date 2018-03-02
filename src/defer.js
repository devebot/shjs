import assert from 'assert';
import Promise from './promise';

const defer = function() {
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
